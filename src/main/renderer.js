// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
/*
  Author: Edward Seufert - Cborgtech, LLC
*/

const electron = require('electron');
const remote = electron.remote;
const {ipcRenderer : ipc } = electron;
const crypto = require('crypto');
const vault = require('./vault');
const group = require('./group');
const record = require('./record');
const status = require('./status');
const encryption = require('./encryption');
const con = remote.getGlobal('console');
const installCodeManager = require('./installCodeManager');

let vaultData;
let vaultList;
let masterCrypto;
let installCode;

window.addEventListener('DOMContentLoaded', _ => {
  const addVault = document.getElementById('addVault');
  const addGroup = document.getElementById('addGroup');
  const addRecord = document.getElementById('addRecord');
  const groupSearch = document.getElementById('groupSearch');
  const recordSearch = document.getElementById('recordSearch');
  const encrytionSettings = document.getElementById('encryptionSettings');
  //const loginBtn = document.getElementById('loginBtn');
  const detailArea = document.getElementById('detailArea');

  addVault.addEventListener('click', _ => {
    if (installCode != null) {
      if (vaultList != null && masterCrypto != null) {
        createEditVault();
      } else {
        status.showStatus({status:'ERROR',statusMsg:'Please login'});
      }
    } else {
      status.showStatus({status:'ERROR',statusMsg:'Please enter install code'});
    }
  });
  addGroup.addEventListener('click', _ => {
    if (masterCrypto != null) {
      if (vaultList != null && vaultList.vaultSelected != null){
          group.createGroup({vaultData,cryptoKey:masterCrypto});
      } else {
        status.showStatus({status:'ERROR',statusMsg:'Please select a Profile.'});
      }
    } else {
      status.showStatus({status:'ERROR',statusMsg:'Please login.'});
    }
  });
  addRecord.addEventListener('click', _ => {
    if (masterCrypto != null) {
      if (vaultData != null && vaultData.groupSelected != null) {
        record.createRecord({vaultData,cryptoKey:masterCrypto});
      } else {
        status.showStatus({status:'ERROR',statusMsg:'Please select a Wallet.'});
      }
    } else {
      status.showStatus({status:'ERROR',statusMsg:'Please login.'});
    }
  });
  groupSearch.addEventListener('keyup', _ => { group.listGroups({cryptoKey:masterCrypto,vaultData}); });
  recordSearch.addEventListener('keyup', _ => { record.listRecords({cryptoKey:masterCrypto,vaultData}); });
  encrytionSettings.addEventListener('click', _ =>{
    if (masterCrypto != null) {
      if (vaultList != null) {
        vaultList.vaultSelected = null;
        listVaults(vaultList.vaults);
      }
      if (vaultData != null) {
        vaultData.groupSelected = null;
        vaultData.recordSelected = null;
        const groupArea = document.getElementById('groupArea');
        groupArea.innerHTML = "";
        const recordArea = document.getElementById('recordArea');
        recordArea.innerHTML = "";
      }
      encryption.showEncrptionDetail({vaultList});
    } else {
      status.showStatus({status:'ERROR',statusMsg:'Please login.'});
    }
  });


});

window.addEventListener("beforeunload", function (event) {
  event.preventDefault();
  //alert("clean data");
  if (masterCrypto != null) {
    const mc = new Buffer(masterCrypto,'hex');
    masterCrypto = crypto.randomBytes(mc.length * 2);
  }
  //alert("clean group");
  if (vaultData != null) {
    if (vaultData.groups != null) {
      vaultData.file = crypto.randomBytes(vaultData.file.length * 2).toString('hex');
      for(let group of vaultData.groups){
        if (group.records != null) {
          for (let record of group.records) {
            record.name = crypto.randomBytes(record.name.length * 2).toString('hex');
            if (record.currency != null) {
              record.currency = crypto.randomBytes(record.currency.length * 2).toString('hex');
            }
            if (record.address != null) {
              record.address = crypto.randomBytes(record.address.length * 2).toString('hex');
            }
            if (record.password != null) {
              record.password = crypto.randomBytes(record.password.length * 2).toString('hex');
            }
            if (record.privatekey != null) {
              record.privatekey = crypto.randomBytes(record.privatekey.length * 2).toString('hex');
            }
            if (record.pin != null) {
              record.pin = crypto.randomBytes(record.pin.length * 2).toString('hex');
            }
            if (record.backupphrase != null) {
              record.backupphrase = crypto.randomBytes(record.backupphrase.length * 2).toString('hex');
            }
            if (record.notes != null) {
              record.notes = crypto.randomBytes(record.notes.length * 2).toString('hex');
            }
          }
        }
      }
    }
  }
  //con.log("vault data " + JSON.stringify(vaultData));
  //alert("clean vault list");
  if (vaultList != null) {
    if (vaultList.vaults != null) {
      for(let vault of vaultList.vaults){
        vault.file = crypto.randomBytes(vault.file.length * 2).toString('hex');
        vault.path = crypto.randomBytes(vault.path.length * 2).toString('hex');
      }
    }
  }
  //con.log("vault list " + JSON.stringify(vaultList));
  alert("Memory Scrubbed");
});

ipc.on('result',(evt, params) => {
  if (params.status != null && params.status != ""){
    status.showStatus({status:params.status,statusMsg:params.statusMsg});
  }
  if (params.type === "vault-delete") {
    vaultList.vaultSelected = null;
    const groupArea = document.getElementById('groupArea');
    groupArea.innerHTML = "";
    listVaults(vaultList.vaults);
  }
  const recordArea = document.getElementById('recordArea');
  if (params.vaultList != null){
    if (params.type === 'vaultlist-init') {
      params.vaultList.vaultSelected = null;
    }
    vaultList = params.vaultList;
    const vaults = vaultList.vaults;
    listVaults(vaults);
    if (params.type === "vault-create"){
      const groupArea = document.getElementById('groupArea');
      groupArea.innerHTML = "";
      // record area
      recordArea.innerHTML = "";
    }
    if (params.vaultList.vaultSelected != null) {
      showVaultDetail(params.vaultList.vaults[params.vaultList.vaultSelected]);
    } else {
      showAfterLogin();
    }
  }
  if (params.vaultData != null){
    vaultData = params.vaultData;
    if (params.type != null && (params.type === "vault-create" || params.type === "vault-read" || params.type === "group-delete")) {
      vaultData.groupSelected = null;
      vaultData.recordSelected = null;
      recordArea.innerHTML = "";
    }
    group.listGroups({cryptoKey:masterCrypto,vaultData,groups:vaultData.groups});

    if (params.type != null && (params.type === "group-create" || params.type === "group-modify")) {
      if (params.type === "group-create") {
        recordArea.innerHTML = "";
      }
      if (params.vaultData.groupSelected != null) {
        let groupSelected = params.vaultData.groups[params.vaultData.groupSelected];
        if (groupSelected != null) {
          params.group = groupSelected;
          params.cryptoKey = masterCrypto;
          group.showGroupDetail(params);
        }
      }
    }

    if (params.type != null && params.type === "record") {
      if (params.vaultData.groupSelected != null) {
        let theGroup = params.vaultData.groups[params.vaultData.groupSelected];
        if (theGroup != null && theGroup != "" && theGroup.records != null) {
          record.listRecords({cryptoKey:masterCrypto,vaultData,records:theGroup.records});
          if (params.vaultData.recordSelected != null) {
            let recordSelected = theGroup.records[params.vaultData.recordSelected];
            if (recordSelected != null) {
              record.showRecordDetail({cryptoKey:masterCrypto,vaultData,record:recordSelected});
            }
          }
        }
      }
    }
  }
});

const checkInstallCode = () => {
  ipc.send('check-install-code',"test");
};

ipc.on('result-check-install-code',(evt, params) => {
  if (params.status != null && params.status != ""){
    status.showStatus({status:params.status,statusMsg:params.statusMsg});
  }
  if(params.keyStatus === "SUCCESS") {
    installCode = "good";
    showLogin();
  } else {
    installCode = null;
    showInstallCode({keyCode:params.keyCode,fileCode:params.fileCode});
  }
});

const listVaults = (vaults) => {
  // list of vaults
  const vaultArea = document.getElementById('vaultArea');
  vaultArea.innerHTML = "";
  const ul = document.createElement("UL");
  ul.className = "nav";
  if (vaults != null) {
    const vaultsArray = vaultList.vaults;
    for (let i = 0; i < vaultsArray.length; i++) {
        const li = document.createElement("LI");
				ul.appendChild(li);
				const href = document.createElement("A");
        href.addEventListener('click', _ => {
          status.loadStatus();
          vaultList.vaultSelected = vaultList.vaults.indexOf(vaultsArray[i]);
          showVaultDetail(vaults[i]);
          listVaults(vaultList.vaults);
          ipc.send('read',{cryptoKey:masterCrypto,type:"vault-read",file:vaultsArray[i].file});
        });
        const firstChar = vaultsArray[i].name.charAt(0).toUpperCase();
        let nameString = "";
        if (vaultList.vaultSelected != null && vaultList.vaultSelected == i) {
          nameString = "<div class='badge-circle badge-selected' style='display:inline-block;'><div class='text-center' style='margin-top:2px;font-size:25px;'>"+firstChar+"</div></div>";
        } else {
          nameString = "<div class='badge-circle' style='display:inline-block;'><div class='text-center' style='margin-top:4px;font-size:25px;'>"+firstChar+"</div></div>";
        }
        nameString = nameString + "<div style='display:inline-block;'><div style='margin-top:10px; margin-left:10px;'>"+vaultsArray[i].name+"</div></div>";
				href.innerHTML = nameString;
        li.appendChild(href);
    }
    vaultArea.appendChild(ul);
  } else {
    vaultArea.innerHTML = "No items";
  }
};

ipc.on('result-rotate-crypto',(evt, params) => {
  if (params.status != null && params.status != ""){
    status.showStatus({status:params.status,statusMsg:params.statusMsg});
  }
  if (params.status === "SUCCESS") {
    vaultList = params.vaultList;
    masterCrypto = params.cryptoKey;
    listVaults(vaultList.vaults);
    showAfterLogin();
  } else {
    const editBtn = document.getElementById('encryptionEditBtn');
    editBtn.disabled = false;
  }
});

const createEditVault = (vault) => {
  const area = document.getElementById('detailArea');
  area.innerHTML = "";
  const header = document.createElement('h1');
  if (vault != null) {
    header.innerHTML = "Modify Profile";
  } else {
    header.innerHTML = "Add Profile";
  }
  area.appendChild(header);
  const divider = document.createElement('hr');
  area.appendChild(divider);
  const form = document.createElement('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    const name = document.getElementById('inputName');
    if (name != null && name.value != "") {
      if (vault != null) {
        vault.name = name.value;
        vault.modified = Date();
        status.loadStatus();
        ipc.send('process-vault-list', {cryptoKey:masterCrypto,action:"modify",vault,vaultList});
      } else {
        vault = {};
        vault.name = name.value;
        vault.created = Date();
        status.loadStatus();
        ipc.send('process-vault-list', {cryptoKey:masterCrypto,action:"create",vault,vaultList});
      }
    } else {
      saveBtn.disabled = false;
    }
  });
  area.appendChild(form);
  const formgroup = document.createElement('div');
  formgroup.className = "form-group";
  form.appendChild(formgroup);
  const label = document.createElement('label');
  label.for = "inputName";
  label.innerHTML = "Name";
  formgroup.appendChild(label);
  const input = document.createElement('input');
  input.type = "text";
  input.className = "form-control";
  input.id = "inputName";
  input.setAttribute('maxlength','11');
  if (vault != null) {
    input.value = vault.name;
  }
  formgroup.appendChild(input);

  const saveBtn = document.createElement('button');
  saveBtn.type = "button";
  saveBtn.id = "saveBtn";
  saveBtn.className = "btn btn-default bottom-space pull-right";
  saveBtn.innerHTML = "<span class='glyphicon glyphicon-save' aria-hidden='true'></span> Save";
  saveBtn.addEventListener('click', _ => {
    saveBtn.disabled = true;
    const name = document.getElementById('inputName');
    if (name != null && name.value != "") {
      if (vault != null) {
        vault.name = name.value;
        vault.modified = Date();
        status.loadStatus();
        ipc.send('process-vault-list', {cryptoKey:masterCrypto,action:"modify",vault,vaultList});
      } else {
        vault = {};
        vault.name = name.value;
        vault.created = Date();
        status.loadStatus();
        ipc.send('process-vault-list', {cryptoKey:masterCrypto,action:"create",vault,vaultList});
      }
    } else {
      saveBtn.disabled = false;
    }
  });
  area.appendChild(saveBtn);
};

const showVaultDetail = (vault) => {
  const area = document.getElementById('detailArea');
  area.innerHTML = "";
  const header = document.createElement('h1');
  header.innerHTML = "Profile: "+vault.name;
  area.appendChild(header);
  const divider = document.createElement('hr');
  area.appendChild(divider);
  const created = document.createElement('p');
  created.innerHTML = "Created: "+vault.created;
  area.appendChild(created);
  const location = document.createElement('p');
  location.innerHTML = "Location: "+vault.path;
  area.appendChild(location);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = "button";
  deleteBtn.id = "deleteBtn";
  deleteBtn.className = "btn btn-default bottom-space pull-right";
  deleteBtn.innerHTML = "<span class='glyphicon glyphicon-trash' aria-hidden='true'></span> Delete";
  deleteBtn.addEventListener('click', _ => {
    deleteBtn.disabled = true;
    confirmDelete({vault});
  });
  area.appendChild(deleteBtn);
  const editBtn = document.createElement('button');
  editBtn.type = "button";
  editBtn.id = "editBtn";
  editBtn.className = "btn btn-default bottom-space pull-right";
  editBtn.innerHTML = "<span class='glyphicon glyphicon-edit' aria-hidden='true'></span> Edit";
  editBtn.addEventListener('click', _ => {
    editBtn.disabled = true;
    createEditVault(vault);
  });
  area.appendChild(editBtn);
};

const confirmDelete = (params) => {
  const vaultFilename = params.vault.file;
  const area = document.getElementById('detailArea');
  area.innerHTML = "";
  const header = document.createElement('h1');
  header.innerHTML = "Confirm delete of profile: "+params.vault.name;
  area.appendChild(header);
  const divider = document.createElement('hr');
  area.appendChild(divider);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = "button";
  deleteBtn.id = "deleteBtn";
  deleteBtn.className = "btn btn-default bottom-space pull-right";
  deleteBtn.innerHTML = "<span class='glyphicon glyphicon-trash' aria-hidden='true'></span> Confirm";
  deleteBtn.addEventListener('click', _ => {
    deleteBtn.disabled = true;
    vaultList.vaults.splice(vaultList.vaultSelected,1);
    vaultList.vaultSelected = null;
    status.loadStatus();
    ipc.send('vault-list-delete', {cryptoKey:masterCrypto,action:"delete",vaultList,fileName:vaultFilename});
    area.innerHTML = "";
  });
  area.appendChild(deleteBtn);
};

const showAfterLogin = () => {
  const area = document.getElementById('detailArea');
  area.innerHTML = "";
  const header = document.createElement('h1');
  header.innerHTML = "Welcome to SafeLedger";
  area.appendChild(header);
  const divider = document.createElement('hr');
  area.appendChild(divider);
  const created = document.createElement('p');
  created.innerHTML = "Please select a profile";
  area.appendChild(created);
};

const showLogin = () => {
  const area = document.getElementById('detailArea');
  area.innerHTML = "";
  const header = document.createElement('h1');
  header.innerHTML = "Welcome to SafeLedger";
  area.appendChild(header);
  const divider = document.createElement('hr');
  area.appendChild(divider);
  const text1 = document.createElement('p');
  text1.innerHTML = "Please enter password.";
  area.appendChild(text1);
  const text2 = document.createElement('p');
  text2.innerHTML = "Must be 8 characters long.";
  area.appendChild(text2);
  const text3 = document.createElement('p');
  text3.innerHTML = "Must contain numbers and letters";
  area.appendChild(text3);
  const text4 = document.createElement('p');
  text4.innerHTML = "Must contain Uppercase letters";
  area.appendChild(text4);

  const form = document.createElement('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    let masterCryptoInput = document.getElementById('masterCryptoInput');
    let statusCode = true;
    let statusMsg = "";
    let rx = new RegExp(/[a-z]/);
    if (!(rx.test(masterCryptoInput.value))) { statusCode = false; statusMsg='Password must contain at least 1 alpha character'; }
    rx = new RegExp(/[0-9]/);
    if (!(rx.test(masterCryptoInput.value))) { statusCode = false; statusMsg='Password must contain at least 1 number'; }
    rx = new RegExp(/[A-Z]/);
    if (!(rx.test(masterCryptoInput.value))) { statusCode = false; statusMsg='Password must contain at least 1 Uppercase letter'; }
    if (!(masterCryptoInput.value.length >= 8)) { statusCode = false; statusMsg='Password must be at least 8 character'; }
    if (statusCode == false){
      saveBtn.disabled = false;
      status.showStatus({status:'ERROR',statusMsg});
    } else {
      status.loadStatus();
      masterCrypto = crypto.createHmac('sha256',masterCryptoInput.value.split("").reverse().join("")).update(masterCryptoInput.value).digest();
      ipc.send('read-vaultlist-init',{cryptoKey:masterCrypto});
      masterCryptoInput.value = "********************";
    }
  });
  area.appendChild(form);
  const formgroup = document.createElement('div');
  formgroup.className = "form-group";
  form.appendChild(formgroup);
  const label = document.createElement('label');
  label.for = "masterCryptoInput";
  label.innerHTML = "Password";
  formgroup.appendChild(label);
  const input = document.createElement('input');
  input.type = "text";
  input.className = "form-control";
  input.id = "masterCryptoInput";
  input.setAttribute('maxlength','40');

  formgroup.appendChild(input);

  const saveBtn = document.createElement('button');
  saveBtn.type = "button";
  saveBtn.id = "loginBtn";
  saveBtn.className = "btn btn-default bottom-space pull-right";
  saveBtn.innerHTML = "<i class='fa fa-unlock'></i> Login";
  saveBtn.addEventListener('click', _ => {
    saveBtn.disabled = true;
    let masterCryptoInput = document.getElementById('masterCryptoInput');
    let statusCode = true;
    let statusMsg = "";
    let rx = new RegExp(/[a-z]/);
    if (!(rx.test(masterCryptoInput.value))) { statusCode = false; statusMsg='Password must contain at least 1 alpha character'; }
    rx = new RegExp(/[0-9]/);
    if (!(rx.test(masterCryptoInput.value))) { statusCode = false; statusMsg='Password must contain at least 1 number'; }
    rx = new RegExp(/[A-Z]/);
    if (!(rx.test(masterCryptoInput.value))) { statusCode = false; statusMsg='Password must contain at least 1 Uppercase letter'; }
    if (!(masterCryptoInput.value.length >= 8)) { statusCode = false; statusMsg='Password must be at least 8 character'; }
    if (statusCode == false){
      saveBtn.disabled = false;
      status.showStatus({status:'ERROR',statusMsg});
    } else {
      status.loadStatus();
      masterCrypto = crypto.createHmac('sha256',masterCryptoInput.value.split("").reverse().join("")).update(masterCryptoInput.value).digest();
      ipc.send('read-vaultlist-init',{cryptoKey:masterCrypto});
      masterCryptoInput.value = "********************";
    }
  });
  area.appendChild(saveBtn);
};

const showInstallCode = (params) => {
  const area = document.getElementById('detailArea');
  area.innerHTML = "";
  const header = document.createElement('h1');
  header.innerHTML = "Welcome to SafeLedger";
  area.appendChild(header);
  const divider = document.createElement('hr');
  area.appendChild(divider);
  const form = document.createElement('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
  });
  area.appendChild(form);
  const formgroup = document.createElement('div');
  formgroup.className = "form-group";
  form.appendChild(formgroup);
  //console.log("file Code " + params.fileCode);
  const labelCode = document.createElement('label');
  labelCode.for = "inputCode";
  labelCode.innerHTML = "Copy code to install manager.";
  formgroup.appendChild(labelCode);
  const inputCode = document.createElement('textarea');
  inputCode.rows = "5";
  inputCode.className = "form-control";
  inputCode.setAttribute('maxlength','500');
  inputCode.id = "inputCode";
  inputCode.innerHTML = params.keyCode;
  formgroup.appendChild(inputCode);

  const label = document.createElement('label');
  label.for = "inputInstallCode";
  label.innerHTML = "Please Enter Install Code";
  formgroup.appendChild(label);
  const input = document.createElement('input');
  input.type = "text";
  input.className = "form-control";
  input.id = "inputInstallCode";
  input.setAttribute('maxlength','200');
  formgroup.appendChild(input);

  const saveBtn = document.createElement('button');
  saveBtn.type = "button";
  saveBtn.id = "saveBtn";
  saveBtn.className = "btn btn-default bottom-space pull-right";
  saveBtn.innerHTML = "<span class='glyphicon glyphicon-save' aria-hidden='true'></span> Save";
  saveBtn.addEventListener('click', _ => {
    saveBtn.disabled = true;
    const installCodeField = document.getElementById('inputInstallCode');
    if (installCodeField != null && installCodeField.value != "") {
    //  console.log("file code " + params.fileCode);
      const s = installCodeManager.getInstallCode(params.fileCode);
      //console.log("hash " + s);
      if (s == installCodeField.value) {
        let myInstallCode = {};
        myInstallCode.key = installCodeField.value;
        myInstallCode.created = Date();
        myInstallCode.fileCode = params.fileCode;
        status.loadStatus();
        ipc.send('save-install-code', {installCode:myInstallCode,keyCode:params.keyCode});
      } else {
        alert("Bad Install Code");
        saveBtn.disabled = false;
      }
    } else {
      saveBtn.disabled = false;
    }
  });
  area.appendChild(saveBtn);
};

ipc.on('result-save-install-code',(evt, params) => {
  if (params.status != null && params.status != ""){
    status.showStatus({status:params.status,statusMsg:params.statusMsg});
  }
  if(params.status === "SUCCESS") {
    installCode = params.keyCode;
    //console.log("key code " + params.keyCode);
    showLogin();
  } else {
    installCode = null;
    showInstallCode({keyCode:params.keyCode,fileCode:params.fileCode});
  }
});
