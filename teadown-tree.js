'use strict';

const fs = require('fs');
const PATH = require('path');
const constants = {
  DIRECTORY: 'directory',
  FILE: 'file'
}

function safeReadDirSync(path) {
  let dirData = {};
  try {
    dirData = fs.readdirSync(path);
  } catch (ex) {
    if (ex.code == "EACCES")
      //User does not have permissions, ignore directory
      return null;
    else throw ex;
  }
  return dirData;
}

// let fileIndex = 0;

function directoryTree(path, options, plainContainer, parentId) {
  const name = PATH.basename(path);
  const item = {
    path,
    name
  };

  // item.id = fileIndex;
  // item.parent = parentId || 0;
  item.id = Buffer(path).toString("base64");
  item.parent = parentId;

  // fileIndex++;

  let stats;

  try {
    stats = fs.statSync(path);
  } catch (e) {
    return null;
  }

  // Skip if it matches the exclude regex
  if (options && options.exclude && options.exclude.test(path))
    return null;

  // if (onEachPath) {
  //   onEachPath(item, PATH);
  // }
  if (plainContainer) {
    plainContainer.push(item);
  }

  if (stats.isFile()) {

    const ext = PATH.extname(path).toLowerCase();

    // Skip if it does not match the extension regex
    if (options && options.extensions && !options.extensions.test(ext))
      return null;

    item.size = stats.size; // File size in bytes
    item.extension = ext;
    item.type = constants.FILE;


  } else if (stats.isDirectory()) {
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


function findNode(treeNode, path) {
  if (treeNode.path === path) {
    return treeNode;
  } else {
    if (treeNode.children) {
      for (const subTreeNode of treeNode.children) {
        return findNode(subTreeNode, path);
      }
    }
  }
  return null;
}

function setToggleOn(treeNode, path) {
  if (!path) return;
  if (treeNode.type === "directory") {
    if (path.startsWith(treeNode.path + "/")) {
      treeNode.toggled = true;
      for (const subTreeNode of treeNode.children) {
        setToggleOn(subTreeNode, path);
      }
    }
  }
  if (treeNode.path == path) {
    treeNode.active = true;
    treeNode.toggled = (treeNode.type === "directory");
  }
}

function rimraf(dir_path) {
  if (fs.existsSync(dir_path)) {
    fs.readdirSync(dir_path).forEach(function (entry) {
      var entry_path = PATH.join(dir_path, entry);
      if (fs.lstatSync(entry_path).isDirectory()) {
        rimraf(entry_path);
      } else {
        fs.unlinkSync(entry_path);
      }
    });
    fs.rmdirSync(dir_path);
  }
}

function loadFileTree(event, docRoot, currentPath) {
  // docRoot = appConfig.docRoot;
  const treeFiles = directoryTree(docRoot, {
    extensions: /\.md$/
  });
  if (currentPath) {
    setToggleOn(treeFiles, currentPath);
  }
  event.sender.send('resFiles', {
    treeFiles,
    currentPath
  });
}

module.exports.directoryTree = directoryTree;
module.exports.findNode = findNode;
module.exports.setToggleOn = setToggleOn;
module.exports.rimraf = rimraf;
module.exports.loadFileTree = loadFileTree;