const {
  app,
  BrowserWindow,
  ipcMain,
  dialog
} = require('electron');
const path = require('path');
const url = require('url');
const fs = require("fs");
const uuidv4 = require('uuid/v4');

let win;
const dirTree = require('directory-tree');
let currentDocPath, currentHtmlPath, docRoot;
let appConfig = {
  docRoot: path.join(__dirname, 'demo-md'),
  saveInteval: 4
};

function createWindow() {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: path.join(__dirname, 'logo.png')
  })


  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
  //win.webContents.openDevTools();

  win.on('closed', () => {
    win = null
  });
  
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


const configPath = path.join(app.getPath('userData'), 'config.json');

try {
  let configStr = fs.readFileSync(configPath);
  appConfig = JSON.parse(configStr.toString());
} catch (e) {
  fs.writeFileSync(configPath, JSON.stringify(appConfig));
}



const MarkdownIt = require('markdown-it'),
  md = new MarkdownIt({
    html: true,
    xhtmlOut: true,
    breaks: true,
    langPrefix: 'language-',
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
      let uid = uuidv4().replace(/-/ig, "");
      if (lang === "mermaid") {
        return `<div class="mermaid">${str}</div>`;
      } else if (lang === "sequence") {
        return `<div class="sequence">${str}</div>`;
      } else if (lang === "echarts") {
        return `<div id="echarts${uid}" class="echarts">${str}</div>`;
      }
    }
  });
md.use(require('markdown-it-emoji'));

mk = require('markdown-it-katex');
md.use(mk, {
  "throwOnError": false,
  "errorColor": " #cc0000"
});

md.use(require('markdown-it-footnote'));
md.use(require("markdown-it-anchor")); // Optional, but makes sense as you really want to link to something
md.use(require("markdown-it-table-of-contents"), {
  //markerPattern: "/^\[toc\]$/im"
});

const loadFileTree = (event)=>{
  docRoot = appConfig.docRoot;
  
  const tree = dirTree(docRoot, {
    extensions: /\.md$/
  });
  event.sender.send('threadReaded', tree);
}

ipcMain.on('reqSettings', (event)=>{
  event.sender.send("resSettings", appConfig);
});

ipcMain.on("onSettingChanged", (event, arg) => {
  appConfig = arg;
  fs.writeFileSync(configPath, JSON.stringify(arg));
  loadFileTree(event);
});


ipcMain.on('threadReading', (event, arg) => {
  loadFileTree(event);
  event.sender.send('onFolderChosen', docRoot);
});

ipcMain.on("docReadToEdit", (event, arg) => {
  //const previewFile = path.join(myCachePath, currentHtmlPath + ".html");
  //event.sender.send("previewRefreshed", previewFile);
  fs.readFile(currentDocPath, (err, data) => {
    const oriData = data.toString();
    event.sender.send('docEditReaded', oriData);
  });
});

ipcMain.on("docSaving", (event, arg) => {
  if (!currentDocPath) {
    console.error("currentDocPath 没有值，要弹出窗口新建");
  }
  event.sender.send("previewRefreshed", {
    oriData: arg,
    htmlData: md.render(arg)
  });
  fs.writeFile(currentDocPath, arg, (err) => {
    if (err) {
      throw err;
    }
  });
});

ipcMain.on("onBrowseFolderClick", (event, arg) => {
  dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  }, (paths) => {
    if (paths && paths.length > 0) {
      event.sender.send("onFolderChosen", paths[0]);
    }
  });
});


ipcMain.on('docReading', (event, arg) => {
  currentDocPath = arg;
  // currentHtmlPath = Buffer.from(arg).toString('base64');
  // currentHtmlPath = currentHtmlPath.replace(/\//ig, "-");
  fs.readFile(arg, (err, data) => {
    if (err) throw err;
    const oriData = data.toString();
    const htmlData = md.render(oriData);

    event.sender.send("previewRefreshed", {
      //url: previewFile,
      source: oriData,
      htmlData: htmlData
    });

    // htmlData = tempString.replace(/{{content}}/ig, htmlData)
    // const previewFile = path.join(myCachePath, currentHtmlPath + ".html");
    // fs.writeFile(previewFile, htmlData, {
    //   flag: 'w'
    // }, (err) => {
    //   if (err) throw err;
    //   event.sender.send("previewRefreshed", {
    //     url: previewFile,
    //     source: oriData
    //   });
    // });
  });
});