/*
  Author: Edward Seufert - Cborgtech, LLC
*/

const electron = require('electron');
const {ipcRenderer : ipc } = electron;
const licenseManager = require('./installCodeManager');

const utils = require('./utils');

exports.listRecords = (params) => {
  renderRecords(params);
};

const renderRecords = (params) => {
  const recordSearch = document.getElementById('recordSearch');
  // list of records
  const recordArea = document.getElementById('recordArea');
  recordArea.innerHTML = "";
  const ul = document.createElement("UL");
  ul.className = "nav";
  if (params.vaultData.groupSelected != null && params.vaultData.groups[params.vaultData.groupSelected].records != null) {
    const records = params.vaultData.groups[params.vaultData.groupSelected].records;
    for (let i = 0; i < records.length; i++) {
      if (recordSearch != null && recordSearch.value.length > 0 &&
        !(records[i].name.startsWith(recordSearch.value.toLowerCase()) || records[i].name.startsWith(recordSearch.value.toUpperCase())) ){
        continue;
      }
        const li = document.createElement("LI");
  				ul.appendChild(li);
  				const href = document.createElement("A");
          href.addEventListener('click', _ => {
            params.vaultData.recordSelected = i;
            renderRecordDetail({cryptoKey:params.cryptoKey,vaultData:params.vaultData,record:records[i]});
            renderRecords(params);
          });
          let nameString = "";
          if (params.vaultData.recordSelected != null && params.vaultData.recordSelected == i) {
            href.className = "item-selected";
          }
          nameString = nameString + "<i class='fa fa-key'></i> "+records[i].name;
  				href.innerHTML = nameString;
          li.appendChild(href);
    }
    recordArea.appendChild(ul);
  } else {
    recordArea.innerHTML = "No items";
  }
};

exports.createRecord = (params) => {
  createEditRecord(params);
};

const createEditRecord = (params) => {
  const area = document.getElementById('detailArea');
  area.innerHTML = "";
  const header = document.createElement('h1');
  if (params.record != null) {
    header.innerHTML = "Modify Install Code";
  } else {
    header.innerHTML = "Add Install Code";
  }
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
  // Name
  const labelName = document.createElement('label');
  labelName.for = "inputName";
  labelName.innerHTML = "Buyer";
  formgroup.appendChild(labelName);
  const inputName = document.createElement('input');
  inputName.type = "text";
  inputName.className = "form-control";
  inputName.id = "inputName";
  inputName.setAttribute('maxlength','20');
  if (params.record != null) {
    inputName.value = params.record.name;
  }
  formgroup.appendChild(inputName);

  // code
  const labelCode = document.createElement('label');
  labelCode.for = "inputCode";
  labelCode.innerHTML = "Code from app";
  formgroup.appendChild(labelCode);
  const inputCode = document.createElement('textarea');
  inputCode.rows = "5";
  inputCode.className = "form-control";
  inputCode.id = "inputCode";
  inputCode.setAttribute('maxlength','1000');
  if (params.record != null && params.record.code != null) {
    inputCode.value = params.record.code;
  }
  formgroup.appendChild(inputCode);

  // notes
  const labelNotes = document.createElement('label');
  labelNotes.for = "inputNotes";
  labelNotes.innerHTML = "Notes";
  formgroup.appendChild(labelNotes);
  const inputNotes = document.createElement('textarea');
  inputNotes.rows = "5";
  inputNotes.className = "form-control";
  inputNotes.id = "inputNotes";
  inputNotes.setAttribute('maxlength','500');
  if (params.record != null && params.record.notes != null) {
    inputNotes.value = params.record.notes;
  }
  formgroup.appendChild(inputNotes);

  const saveBtn = document.createElement('button');
  saveBtn.type = "button";
  saveBtn.id = "saveBtn";
  saveBtn.className = "btn btn-default bottom-space pull-right";
  saveBtn.innerHTML = "<span class='glyphicon glyphicon-save' aria-hidden='true'></span> Save";
  saveBtn.addEventListener('click', _ => {

    if (inputName != null && inputName.value != "") {
      if (params.record != null) {
        // Modify
        params.record.name = inputName.value;
        params.record.code = inputCode.value;
        params.record.notes = inputNotes.value;
        params.record.modified = Date();
        params.vaultData.groups[params.vaultData.groupSelected].records[params.vaultData.recordSelected] = params.record;
        params.vaultData.groups[params.vaultData.groupSelected].records.sort(utils.compareIgnoreCase);
        params.vaultData.recordSelected = params.vaultData.groups[params.vaultData.groupSelected].records.indexOf(params.record);
        ipc.send('process-record', {cryptoKey:params.cryptoKey,action:"modify",vaultData:params.vaultData});
      } else {
        // Create
        let myRecord = {};
        myRecord.name = inputName.value;
        myRecord.code = inputCode.value;
        myRecord.notes = inputNotes.value;
        myRecord.created = Date();
        // create license key
        const c = licenseManager.readCode(inputCode.value);
        if (c.startsWith("codeInfo")) {
          myRecord.codeInfo = c;
          myRecord.license = licenseManager.getLicense(c);
          ipc.send('process-new-license', {cryptoKey:params.cryptoKey,record:myRecord});
        } else {
          alert("Bad license");
        }
        /*
        if (params.vaultData.groups[params.vaultData.groupSelected].records == null) {
          params.vaultData.groups[params.vaultData.groupSelected].records = new Array();
        }
        params.vaultData.groups[params.vaultData.groupSelected].records.push(myRecord);
        params.vaultData.groups[params.vaultData.groupSelected].records.sort(utils.compareIgnoreCase);
        params.vaultData.recordSelected = params.vaultData.groups[params.vaultData.groupSelected].records.indexOf(myRecord);
        */
        //ipc.send('process-new-license', {cryptoKey:params.cryptoKey,record:myRecord});

      }
    }
  });
  area.appendChild(saveBtn);
};

exports.showRecordDetail = (params) => {
  renderRecordDetail(params);
};

const renderRecordDetail = (params) => {
  const area = document.getElementById('detailArea');
  area.innerHTML = "";
  const header = document.createElement('h1');
  header.innerHTML = "Buyer: "+params.record.name;
  area.appendChild(header);
  const divider = document.createElement('hr');
  area.appendChild(divider);
  const created = document.createElement('p');
  created.innerHTML = "<b>Created:</b> "+params.record.created;
  area.appendChild(created);

  const modified = document.createElement('p');
  if (params.record.modified != null) {
    modified.innerHTML = "<b>Modified:</b> "+params.record.modified;
  } else {
    modified.innerHTML = "<b>Modified:</b> ";
  }
  area.appendChild(modified);

  const license = document.createElement('p');
  license.innerHTML = "<b>Install Code, Copy to app:</b>";
  area.appendChild(license);
  const licenseDetail = document.createElement('p');
  if (params.record.license != null) {
    licenseDetail.innerHTML = params.record.license;
  } else {
    licenseDetail.innerHTML = "";
  }
  area.appendChild(licenseDetail);

  const code = document.createElement('p');
  code.innerHTML = "<b>Code from app:</b>";
  area.appendChild(code);
  const codeDetail = document.createElement('p');
  if (params.record.code != null) {
    codeDetail.innerHTML = params.record.code;
  } else {
    codeDetail.innerHTML = "";
  }
  area.appendChild(codeDetail);

  const codeInfo = document.createElement('p');
  codeInfo.innerHTML = "<b>Code Info:</b>";
  area.appendChild(codeInfo);
  const codeInfoDetail = document.createElement('p');
  if (params.record.codeInfo != null) {
    codeInfoDetail.innerHTML = params.record.codeInfo;
  } else {
    codeInfoDetail.innerHTML = "";
  }
  area.appendChild(codeInfoDetail);

  const notes = document.createElement('p');
  notes.innerHTML = "<b>Notes:</b>";
  area.appendChild(notes);
  const notesDetail = document.createElement('p');
  if (params.record.notes != null) {
    const r = params.record.notes.replace(/(?:\r\n|\r|\n)/g, '<br />');
    notesDetail.innerHTML = r;
  } else {
    notesDetail.innerHTML = "";
  }
  area.appendChild(notesDetail);


/*  const deleteBtn = document.createElement('button');
  deleteBtn.type = "button";
  deleteBtn.id = "deleteBtn";
  deleteBtn.className = "btn btn-default bottom-space pull-right";
  deleteBtn.innerHTML = "<span class='glyphicon glyphicon-trash' aria-hidden='true'></span> Delete";
  deleteBtn.addEventListener('click', _ => {
    confirmDelete(params);
  });
  area.appendChild(deleteBtn); */
 const editBtn = document.createElement('button');
  editBtn.type = "button";
  editBtn.id = "editBtn";
  editBtn.className = "btn btn-default bottom-space pull-right";
  editBtn.innerHTML = "<span class='glyphicon glyphicon-edit' aria-hidden='true'></span> Edit";
  editBtn.addEventListener('click', _ => {
    createEditRecord(params);
  });
  area.appendChild(editBtn);

};

const confirmDelete = (params) => {
  const area = document.getElementById('detailArea');
  area.innerHTML = "";
  const header = document.createElement('h1');
  header.innerHTML = "Confirm Delete of coin: "+params.record.name;
  area.appendChild(header);
  const divider = document.createElement('hr');
  area.appendChild(divider);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = "button";
  deleteBtn.id = "deleteBtn";
  deleteBtn.className = "btn btn-default bottom-space pull-right";
  deleteBtn.innerHTML = "<span class='glyphicon glyphicon-trash' aria-hidden='true'></span> Confirm";
  deleteBtn.addEventListener('click', _ => {
    params.vaultData.groups[params.vaultData.groupSelected].records.splice(params.vaultData.recordSelected,1);
    params.vaultData.recordSelected = null;
    ipc.send('process-record', {cryptoKey:params.cryptoKey,action:"delete",vaultData:params.vaultData});
    area.innerHTML = "";
  });
  area.appendChild(deleteBtn);
};
