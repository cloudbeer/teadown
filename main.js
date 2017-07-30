  const {app, BrowserWindow,ipcMain} = require('electron')
  const path = require('path')
  const url = require('url')
  const reader = require("./app/reader");
  const fs = require("fs");

  let win

  function createWindow () {

    win = new BrowserWindow({width: 1024, height: 768})


    win.loadURL(url.format({
      pathname: path.join(__dirname, 'web','read.html'),
      protocol: 'file:',
      slashes: true
    }))
    win.webContents.openDevTools();

    win.on('closed', () => {
      win = null
    })
  }


  app.on('ready', createWindow)

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (win === null) {
      createWindow();
    }
  })


  var MarkdownIt = require('markdown-it'),
  md = new MarkdownIt({
    html:         true,
    xhtmlOut:     true,
    breaks:       true,
    langPrefix:   'language-',
    linkify:      true,
    typographer:  true,
    highlight: function (str, lang) {
      if(lang==="mermaid"){
        return `<div class="mermaid">${str}</div>`;
      }else if (lang==="sequence"){
        return `<div class="sequence">${str}</div>`;
      }
    }
  });
  md.use(require('markdown-it-emoji'));

  mk = require('markdown-it-katex');
  md.use(mk, {"throwOnError" : false, "errorColor" : " #cc0000"});

  md.use(require('markdown-it-footnote'));
  md.use(require("markdown-it-anchor")); // Optional, but makes sense as you really want to link to something
  md.use(require("markdown-it-table-of-contents"), {
    //markerPattern: "/^\[toc\]$/im"
  });


  const dirTree = require('directory-tree');
  let myCachePath = "/tmp/teadown-cache";

  if (!fs.existsSync(myCachePath)) {
    fs.mkdirSync(myCachePath, 0766);
    fs.symlink(
      path.join(__dirname, 'web','assets'),
      path.join(myCachePath, 'assets'),
      ()=>{
        console.log("symlink created");
      }
    );
  }

  let tempString;

  fs.readFile(path.join(__dirname, 'web','preview.html'), (err, data) => {
    if (err) throw err;
    tempString = data.toString();
  });




  ipcMain.on('threadReading', (event, arg) => {
    const tree = dirTree(arg, {extensions:/\.md$/});
    event.sender.send('threadReaded', tree);
  });


  ipcMain.on('docReading', (event, arg) => {
    let tmpFile = Buffer.from(arg).toString('base64');
    tmpFile = tmpFile.replace(/\//ig, "-");
    fs.readFile(arg, (err, data) => {
      if (err) throw err;
      const oriData = data.toString();
      let htmlData = md.render(oriData)
      htmlData = tempString.replace(/{{content}}/ig, htmlData)
      const previewFile = path.join(myCachePath, tmpFile + ".html");
      fs.writeFile(previewFile, htmlData, { flag: 'w' }, (err) => {
        if (err) throw err;
        event.sender.send("previewRefreshed", previewFile);
      });
    });
  });
