const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  dialog
} = require('electron');
const path = require('path');
const url = require('url');
const fs = require("fs");
const uuidv4 = require('uuid/v4');



const template = [
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteandmatchstyle' },
      { role: 'delete' },
      { role: 'selectall' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'toggledevtools' },
      { type: 'separator' },
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    role: 'window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: '@github',
        click() { require('electron').shell.openExternal('https://github.com/cloudbeer/teadown') }
      }
    ]
  }
]

if (process.platform === 'darwin') {
  template.unshift({
    label: "teadown",
    submenu: [
      { role: 'services', submenu: [] },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  });


  // Edit menu
  template[1].submenu.push(
    { type: 'separator' },
    {
      label: 'Speech',
      submenu: [
        { role: 'startspeaking' },
        { role: 'stopspeaking' }
      ]
    }
  );

  // Window menu
  template[3].submenu = [
    { role: 'close' },
    { role: 'minimize' },
    { role: 'zoom' },
    { type: 'separator' },
    { role: 'front' }
  ]
}




let win;
const util = require('./teadown-tree');
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

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
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

const tmpPath = app.getPath('userData');
if (!fs.existsSync(tmpPath)) {
  fs.mkdirSync(tmpPath);
}

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


ipcMain.on('reqSettings', (event) => {
  event.sender.send("resSettings", appConfig);
});

ipcMain.on("onSettingChanged", (event, arg) => {
  appConfig = arg;
  fs.writeFileSync(configPath, JSON.stringify(arg));
  util.loadFileTree(event, appConfig.docRoot);
});


ipcMain.on('reqFiles', (event, arg) => {
  util.loadFileTree(event, appConfig.docRoot);
  //event.sender.send('resFolderChoose', docRoot); //TODO: What is this
});

ipcMain.on("docReadToEdit", (event, arg) => {
  //const previewFile = path.join(myCachePath, currentHtmlPath + ".html");
  //event.sender.send("resDocRead", previewFile);
  fs.readFile(currentDocPath, (err, data) => {
    const oriData = data.toString();
    event.sender.send('docEditReaded', oriData);
  });
});

ipcMain.on("reqDocSave", (event, arg) => {
  if (!currentDocPath) {
    console.error("currentDocPath 没有值，要弹出窗口新建");
  }
  event.sender.send("resDocRead", {
    oriData: arg,
    htmlData: md.render(arg)
  });
  fs.writeFile(currentDocPath, arg, (err) => {
    if (err) {
      throw err;
    }
  });
});

ipcMain.on("reqFolderChoose", (event, arg) => {
  dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  }, (paths) => {
    if (paths && paths.length > 0) {
      event.sender.send("resFolderChoose", paths[0]);
    }
  });
});

ipcMain.on("reqCreateFile", (evt, arg) => {
  let newFileName = arg.rootName;
  const mdName = arg.mdName;
  if (!mdName.toLowerCase().endsWith(".md")) {
    arg.mdName = arg.mdName + ".md";
  }
  if (arg.fdName) {
    newFileName = path.join(newFileName, arg.fdName);
    if (!fs.existsSync(newFileName)) {
      fs.mkdirSync(newFileName);
    }
  }
  if (arg.mdName) {
    newFileName = path.join(newFileName, arg.mdName);
    fs.writeFileSync(newFileName, "# " + mdName);
  }
  // console.log(evt, newFileName);

  util.loadFileTree(evt, appConfig.docRoot, newFileName);
  //evt.sender.send("resCurrentPath", newFileName);
});


ipcMain.on("reqDeleteFile", (evt, arg) => {
  dialog.showMessageBox(win, {
    type: "info",
    buttons: ["OK", "Cancel"],
    message: "Are you sure to delete " + arg.dPath + "?"
  }, (res) => {
    if (res === 0) {
      if (arg.dPath.endsWith(".md")) {
        fs.unlinkSync(arg.dPath);
      } else {
        util.rimraf(arg.dPath);
      }
      util.loadFileTree(evt, appConfig.docRoot, arg.dPath.substr(0, arg.dPath.lastIndexOf("/")));
    }
  });
});

ipcMain.on('reqDocRead', (event, arg) => {
  currentDocPath = arg;
  // currentHtmlPath = Buffer.from(arg).toString('base64');
  // currentHtmlPath = currentHtmlPath.replace(/\//ig, "-");
  fs.readFile(arg, (err, data) => {
    if (err) throw err;
    const oriData = data.toString();
    const htmlData = md.render(oriData);

    event.sender.send("resDocRead", {
      //url: previewFile,
      source: oriData,
      htmlData: htmlData
    });
  });
});