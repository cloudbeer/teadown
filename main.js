  const {app, BrowserWindow,ipcMain} = require('electron')
  const path = require('path')
  const url = require('url')
  const reader = require("./app/reader");
  const fs = require("fs");
  const uuidv4 = require('uuid/v4');

  let win

  function createWindow () {

    win = new BrowserWindow({width: 1024, height: 768})


    win.loadURL(url.format({
      pathname: path.join(__dirname,'index.html'),
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
      let uid = uuidv4().replace(/-/ig, "");
      if(lang==="mermaid"){
        return `<div class="mermaid">${str}</div>`;
      }else if (lang==="sequence"){
        return `<div class="sequence">${str}</div>`;
      }else if (lang==="echarts"){
        return `<div id="echarts${uid}" style="width: 800px;height:600px;"></div>
          <script type="text/javascript">
          var myChart${uid} = echarts.init(document.getElementById('echarts${uid}'));
          myChart${uid}.setOption(${str});
          </script>
        `;
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
  let currentDocPath, currentHtmlPath;

  fs.readFile(path.join(__dirname, 'web','preview.html'), (err, data) => {
    if (err) throw err;
    tempString = data.toString();
  });

  ipcMain.on('threadReading', (event, arg) => {
    let mdDir = path.join(__dirname, 'demo-md');
    const tree = dirTree(mdDir, {extensions:/\.md$/});
    event.sender.send('threadReaded', tree);
  });

  ipcMain.on("docReadToEdit",(event, arg) => {
    const previewFile = path.join(myCachePath, currentHtmlPath + ".html");
    event.sender.send("previewRefreshed", previewFile);
    fs.readFile(currentDocPath, (err, data) => {
      const oriData = data.toString();
      event.sender.send('docEditReaded', oriData);
    });
  });


  ipcMain.on('docReading', (event, arg) => {
    currentDocPath = arg;
    currentHtmlPath = Buffer.from(arg).toString('base64');
    currentHtmlPath = currentHtmlPath.replace(/\//ig, "-");
    fs.readFile(arg, (err, data) => {
      if (err) throw err;
      const oriData = data.toString();
      let htmlData = md.render(oriData)
      htmlData = tempString.replace(/{{content}}/ig, htmlData)
      const previewFile = path.join(myCachePath, currentHtmlPath + ".html");
      fs.writeFile(previewFile, htmlData, { flag: 'w' }, (err) => {
        if (err) throw err;
        event.sender.send("previewRefreshed", previewFile);
      });
    });
  });
