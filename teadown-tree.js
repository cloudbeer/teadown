'use strict';

const FS = require('fs');
const PATH = require('path');
const constants = {
  DIRECTORY: 'directory',
  FILE: 'file'
}

function safeReadDirSync(path) {
  let dirData = {};
  try {
    dirData = FS.readdirSync(path);
  } catch (ex) {
    if (ex.code == "EACCES")
      //User does not have permissions, ignore directory
      return null;
    else throw ex;
  }
  return dirData;
}

let fileIndex = 0;

function directoryTree(path, options, plainContainer, parentId) {
  const name = PATH.basename(path);
  const item = { path, name };

  item.id = fileIndex;
  item.parent = parentId || 0;
  fileIndex++;

  let stats;

  try { stats = FS.statSync(path); }
  catch (e) { return null; }

  // Skip if it matches the exclude regex
  if (options && options.exclude && options.exclude.test(path))
    return null;

  // if (onEachPath) {
  //   onEachPath(item, PATH);
  // }
  plainContainer.push(item);

  if (stats.isFile()) {

    const ext = PATH.extname(path).toLowerCase();

    // Skip if it does not match the extension regex
    if (options && options.extensions && !options.extensions.test(ext))
      return null;

    item.size = stats.size;  // File size in bytes
    item.extension = ext;
    item.type = constants.FILE;


  }
  else if (stats.isDirectory()) {
    let dirData = safeReadDirSync(path);
    if (dirData === null) return null;
    item.children = dirData
      .map(child => {
        return directoryTree(PATH.join(path, child), options, plainContainer, item.id)
      })
      .filter(e => !!e);
    item.size = item.children.reduce((prev, cur) => prev + cur.size, 0);
    item.type = constants.DIRECTORY;
  } else {
    return null; // Or set item.size = 0 for devices, FIFO and sockets ?
  }

  return item;
}
module.exports = directoryTree;