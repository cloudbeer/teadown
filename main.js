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


  win.webContents.openDevTools()


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
    createWindow()
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
  highlight: function (str, lang) { return str; }
});

const dirTree = require('directory-tree');
let myCachePath = "/tmp/teadown-cache";

if (!fs.existsSync(myCachePath)) {
  fs.mkdirSync(myCachePath, 0766);
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
  const tmpFile = Buffer.from(arg).toString('base64');
  fs.readFile(arg, (err, data) => {
    if (err) throw err;
    const oriData = data.toString();
    let htmlData = md.render(oriData)
    htmlData = tempString.replace(/{{content}}/ig, htmlData)
    console.log(htmlData);
  });
});


// ipcMain.on('synchronous-message', (event, arg) => {
//   console.log(arg)  // prints "ping"
//   event.returnValue = 'pong'
// })
