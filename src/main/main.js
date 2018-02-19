/*
  Author: Edward Seufert - Cborgtech, LLC
*/

const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const {ipcMain: ipc } = electron;

const path = require('path');
const url = require('url');
const fs = require('fs');
const vault = require('./vault');
const utils = require('./utils');
const installCodeManager = require('./installCodeManager');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let appDir;
let vaultDir = path.join(app.getAppPath(), '/vaults/');
let installCodeDir;
let currentVault = 'zvault-0.json';

function createWindow () {

  const base = app.getAppPath();
  if (base.includes("SafeLedger-darwin-x64")) {
    // console.log("running mac build");
    appDir = base.split("SafeLedger-darwin-x64");
  } else if (base.includes("SafeLedger-win32-x64")){
    // console.log("running win build");
    appDir = base.split("SafeLedger-win32-x64");
  } else if (base.includes("SafeLedgerPlus")){
    appDir = base.split("SafeLedgerPlus");
  } else {
    appDir = base.split("electron-react");
  }
  vaultDir = path.join(appDir[0],'reacttestdata/');
  installCodeDir = path.join(appDir[0],'reacttestsettings/');


  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1200, height: 720, icon: "pen.ico"});

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
   mainWindow.webContents.openDevTools();
 // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
  // menu setup
  const name = electron.app.getName();
  const template = [{
      label: "SafeLedger",
      submenu: [
          { label: "About SaveLedger", selector: "orderFrontStandardAboutPanel:" },
          { type: "separator" },
          { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
      ]}, {
      label: "Edit",
      submenu: [
          { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
          { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
          { type: "separator" },
          { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
          { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
          { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
          { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
      ]}
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));


}

// /Volumes/KINGSTON/ZVault-darwin-x64/ZVault.app

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

ipc.on('save', (evt, params) => {
  vault.saveVault(path.join(vaultDir,currentVault), JSON.stringify(params.vaultData), params.cryptoKey)
    .then((val) => {
      if (val === "SUCCESS") {
        mainWindow.webContents.send('result',{status:'SUCCESS',statusMsg:'Save successful'});
      } else {
        mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Save failed'});
      }
    })
    .catch((val) => mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Save failed'}));
});

ipc.on('read', (evt, params) => {
  vault.readVault(path.join(vaultDir,params.file),params.cryptoKey)
    .then((val) => {
      mainWindow.webContents.send('result',{type:params.type,vaultData:val});
    })
    .catch((val) => mainWindow.webContents.send('result',val));
});

ipc.on('read-vaultlist-init', (evt, params) => {
  // Initalize the vault
  vault.makeDir(vaultDir)
    .then((val) => {
      if (val === "CREATED") {
        // Create the initial Vault list
        vault.initVaultList(vaultDir,params.cryptoKey)
          .then((val) => {
            // Create the initial vault 0 data
            vault.initVaultData(vaultDir,currentVault,params.cryptoKey)
              .then((val) => {
                // load the vault list
                vault.readVaultList(path.join(vaultDir,"vaultlist.json"),params.cryptoKey)
                  .then((val) => {
                    mainWindow.webContents.send('result',{type:'vaultlist-init',vaultList:val});
                  })
                  .catch((val) => mainWindow.webContents.send('result',val));
              })
              .catch((val) => mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Unable to init vault data'}));
          })
          .catch((val) =>  mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Unable to init vault list'}));
      } else {
        // load the vault list
        vault.readVaultList(path.join(vaultDir,"vaultlist.json"),params.cryptoKey)
          .then((val) => {
            mainWindow.webContents.send('result',{type:'vaultlist-init',vaultList:val});
          })
          .catch((val) => mainWindow.webContents.send('result',val));
      }
    })
    .catch((val) => mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Unable to access vault list'}));
});

ipc.on('process-vault-list', (evt, params) => {
  let idInfo = null;
  if (params.action === "create") {
    // get vault id
    idInfo = vault.nextVaultFileName(params.vaultList);
    params.vault.id = idInfo.id;
    params.vault.file = idInfo.fileName;
    params.vault.path = vaultDir;
    params.vaultList.vaults.push(params.vault);
    params.vaultList.vaults.sort(utils.compareIgnoreCase);
    params.vaultList.vaultSelected = params.vaultList.vaults.indexOf(params.vault);
  } else if (params.action === "modify") {
  //  console.log("vault " + JSON.stringify(params.vault));
  //  console.log("in modify " +JSON.stringify(params.vaultList));
    const vaults = params.vaultList.vaults;
    for (let i = 0; i < vaults.length; i++) {
      if (vaults[i].id == params.vault.id) {
        params.vaultList.vaults[i] = params.vault;
        break;
      }
    }
    params.vaultList.vaults.sort(utils.compareIgnoreCase);
    params.vaultList.vaultSelected = params.vaultList.vaults.indexOf(params.vault);
  }
//  console.log("modified " + JSON.stringify(params.vaultList));
  // save vault list
  vault.saveVault(path.join(vaultDir,"vaultlist.json"), JSON.stringify(params.vaultList),params.cryptoKey)
    .then((val) => {
    //  console.log("val " + val);
      if (params.action === "create") {
        if (val === "SUCCESS") {
      //    console.log("erere " + idInfo.fileName);
          vault.initVaultData(vaultDir,idInfo.fileName,params.cryptoKey)
            .then((val) => {
        //      console.log("val init " + val);
              mainWindow.webContents.send('result',{type:"vault-create",vaultList:params.vaultList,vaultData:val});
            })
            .catch((val) => mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Unable to init vault data'}));
        } else {
          mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Save failed'});
        }
      } else {
        mainWindow.webContents.send('result',{type:"vault-modify",vaultList:params.vaultList,status:'SUCCESS',statusMsg:'Save successful'});
      }
    })
    .catch((val) => mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Save failed'}));
});

ipc.on('vault-list-delete', (evt, params) => {
  //console.log("vault-list-delete");
  // save vaultList
  vault.saveVault(path.join(vaultDir,"vaultlist.json"), JSON.stringify(params.vaultList),params.cryptoKey)
    .then((val) => {
      //console.log("save vault list " + val);
      // delete vault file
      vault.deleteVault(path.join(vaultDir,params.fileName))
        .then((val) => {
        //console.log("delete vault " + val);
          if (val === "SUCCESS") {
            mainWindow.webContents.send('result',{type:'vault-delete',status:'SUCCESS',statusMsg:'Delete successful'});
          } else {
            mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Delete failed'});
          }
        })
        .catch((val) => mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Delete failed'}));
    })
    .catch((val) => mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Delete failed'}));
});

ipc.on('process-group', (evt, params) => {
  //console.log("key " + params.cryptoKey);
  vault.saveVault(path.join(vaultDir,params.vaultData.file), JSON.stringify(params.vaultData),params.cryptoKey)
    .then((val) => {
      if (val === "SUCCESS") {
        mainWindow.webContents.send('result',{status:'SUCCESS',statusMsg:'Save successful',type:params.type,vaultData:params.vaultData});
      } else {
        mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Save failed'});
      }
    })
    .catch((val) => mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Save failed'}));
});

ipc.on('process-record', (evt, params) => {
  //console.log("process-record");
  vault.saveVault(path.join(vaultDir,params.vaultData.file), JSON.stringify(params.vaultData),params.cryptoKey)
    .then((val) => {
      if (val === "SUCCESS") {
        mainWindow.webContents.send('result',{status:'SUCCESS',statusMsg:'Save successful',type:"record",vaultData:params.vaultData});
      } else {
        mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Save failed'});
      }
    })
    .catch((val) => mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Save failed'}));
});

ipc.on('process-rotate-crypto', (evt, params) => {
  //console.log("old key " + params.oldCryptoKey);
  //console.log("new key " + params.newCryptoKey);

  vault.rotateCrypto(vaultDir,params.oldCryptoKey,params.newCryptoKey,params.vaultList)
    .then((val) => {
      if (val.status === "SUCCESS") {
        mainWindow.webContents.send('result-rotate-crypto',val);
      } else {
        mainWindow.webContents.send('result',val);
      }
    })
    .catch((val) => mainWindow.webContents.send('result',val));

});

ipc.on('check-license', (evt, params) => {
  // console.log(" check license ");
  installCodeManager.checkLicense(installCodeDir)
  .then((val) => {
    if (val.status === "SUCCESS") {
      mainWindow.webContents.send('result-check-license',{keyStatus:val.status});
    } else {
      mainWindow.webContents.send('result-check-license',{status:'ERROR',statusMsg:'License missing',keyCode:val.keyCode,fileCode:val.fileCode});
    }
  })
  .catch((val) => mainWindow.webContents.send('result-check-license',{status:'ERROR',statusMsg:'License check error'}));
});

ipc.on('save-license', (evt, params) => {
  // console.log(" main save license " + params.license.key + " " + params.license.fileCode);
  installCodeManager.saveLicense(path.join(installCodeDir,'license.json'),JSON.stringify(params.license))
  .then((val) => {
    if (val.status === "SUCCESS") {
      mainWindow.webContents.send('result-save-license',{status:val.status,statusMsg:'License saved',keyCode:params.license.key});
    } else {
      mainWindow.webContents.send('result-save-license',{status:'ERROR',statusMsg:'License save failed',fileCode:params.license.fileCode,keyCode:params.license.key});
    }
  })
  .catch((val) => mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'License save failed'}));
});

ipc.on('process-new-license', (evt, params) => {
  const d = new Date();
  // over ride
  // const d = new Date(2018,2,2);
  // console.log("year " + d.getFullYear());
  // console.log("mont " + d.getMonth());
  vault.readVaultList(path.join(vaultDir,"vaultlist.json"),params.cryptoKey)
    .then((vaultList) => {
      let foundVault = null;
      const vname = d.getFullYear() + "-" + d.getMonth();
      for (let vault of vaultList.vaults) {
        if (vault.name == vname) {
          foundVault = vault;
          vaultList.vaultSelected = vaultList.vaults.indexOf(vault);
          break;
        }
      }
      if (foundVault != null) {
        // console.log("vault list " + JSON.stringify(vaultList));
        // console.log("vault found " + JSON.stringify(foundVault));
        vault.readVault(path.join(vaultDir,foundVault.file),params.cryptoKey)
          .then((vaultData) => {
            let foundGroup = null;
            if (vaultData.groups != null) {
              // console.log("vault data " + JSON.stringify(vaultData));
              for (let group of vaultData.groups) {
                if (group.name == d.getDate()) {
                  group.modified = Date();
                  if (group.records == null) {
                    group.records = new Array();
                  }
                  // console.log("group found " +JSON.stringify(vaultData));
                  group.records.push(params.record);
                  // console.log("sort ");
                  //group.records.sort(utils.compareIgnoreCase);
                 // console.log("index");
                  vaultData.recordSelected = group.records.indexOf(params.record);
                  foundGroup = group;
                  break;
                }
              }
              if (foundGroup == null) {
                // console.log("new group");
                let myGroup = {};
                myGroup.name = d.getDate();
                myGroup.created = Date();
                myGroup.records = new Array();
                myGroup.records.push(params.record);
                vaultData.recordSelected = 0;
                // console.log("add to groups");
                vaultData.groups.push(myGroup);
                // console.log("sort ");
                vaultData.groups.sort(utils.compareNumber);
                // console.log("get slele");
                vaultData.groupSelected = vaultData.groups.indexOf(myGroup);
                // console.log("dond");
              }
            } else {
              // console.log("vault groups empty");
              vaultData.groups = new Array();
              let myGroup = {};
              myGroup.name = d.getDate();
              myGroup.created = Date();
              myGroup.records = new Array();
              myGroup.records.push(params.record);
              vaultData.recordSelected = 0;
              vaultData.groups.push(myGroup);
              vaultData.groupSelected = 0;
            }
            // console.log("start save " + JSON.stringify(vaultData));
            vault.saveVault(path.join(vaultDir,vaultData.file), JSON.stringify(vaultData),params.cryptoKey)
              .then((val) => {
                if (val === "SUCCESS") {
                  mainWindow.webContents.send('result-new-license',{status:'SUCCESS',statusMsg:'Save successful',vaultData,vaultList});
                } else {
                  mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Save failed'});
                }
              })
              .catch((val) => mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Save failed'}));

          })
          .catch((val) => mainWindow.webContents.send('result',val));
      } else {
        // console.log("vault not found " + JSON.stringify(vaultList));
        // create vaultList item
        let myVault = {};
        myVault.name = d.getFullYear() + "-"+ d.getMonth();
        myVault.created = Date();
        let idInfo = vault.nextVaultFileName(vaultList);
        myVault.id = idInfo.id;
        myVault.file = idInfo.fileName;
        myVault.path = vaultDir;
        vaultList.vaults.push(myVault);
        // console.log("sort " + JSON.stringify(vaultList));
        vaultList.vaults.sort(utils.compareYearMonth);
        // console.log('index');
        vaultList.vaultSelected = vaultList.vaults.indexOf(myVault);
        // console.log("new vault list " + JSON.stringify(vaultList));
        // create vault
        let myVaultData = {};
        myVaultData.file = idInfo.fileName;
        myVaultData.groups = new Array();
        let myGroup = {};
        myGroup.name = d.getDate();
        myGroup.created = Date();
        myGroup.records = new Array();
        myGroup.records.push(params.record);
        myVaultData.groups.push(myGroup);
        myVaultData.groupSelected = 0;
        myVaultData.recordSelected = 0;
        // save both
        vault.saveVault(path.join(vaultDir,myVaultData.file), JSON.stringify(myVaultData),params.cryptoKey)
          .then((val) => {
            if (val === "SUCCESS") {
              vault.saveVault(path.join(vaultDir,'vaultlist.json'), JSON.stringify(vaultList),params.cryptoKey)
                .then((val) => {
                  if (val === "SUCCESS") {
                    mainWindow.webContents.send('result-new-license',{status:'SUCCESS',statusMsg:'Save successful',vaultData:myVaultData,vaultList});
                  } else {
                    mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Save failed'});
                  }
                })
                .catch((val) => mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Save failed'}));
            } else {
              mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Save failed'});
            }
          })
          .catch((val) => mainWindow.webContents.send('result',{status:'ERROR',statusMsg:'Save failed'}));
      }

    })
    .catch((val) => mainWindow.webContents.send('result',val));


});
