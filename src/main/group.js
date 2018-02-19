/*
  Author: Edward Seufert - Cborgtech, LLC
*/

const electron = require('electron');
const {ipcRenderer : ipc } = electron;

const record = require('./record');
const utils = require('./utils');

exports.listGroups = (params) => {
  renderGroups(params);
};

const renderGroups = (params) => {
  const groupSearch = document.getElementById('groupSearch');
  // list of groups
  const groupArea = document.getElementById('groupArea');
  groupArea.innerHTML = "";
  const ul = document.createElement("UL");
  ul.className = "nav";
  if (params.vaultData.groups != null) {
    const groupsArray = params.vaultData.groups;
    for (let i = 0; i < groupsArray.length; i++) {
      if (groupSearch != null && groupSearch.value.length > 0 &&
        !(groupsArray[i].name.startsWith(groupSearch.value.toLowerCase()) || groupsArray[i].name.startsWith(groupSearch.value.toUpperCase())) ){
        continue;
      }
        const li = document.createElement("LI");
  				li.setAttribute("data-toggle","collapse");
  				li.setAttribute("data-target","#"+groupsArray[i].name);
  				ul.appendChild(li);
  				const href = document.createElement("A");
          href.addEventListener('click', _ => {
              params.vaultData.groupSelected = i;
              params.vaultData.recordSelected = null;
              renderGroupDetail({cryptoKey:params.cryptoKey,vaultData:params.vaultData,group:groupsArray[i]});
              renderGroups({cryptoKey:params.cryptoKey,vaultData:params.vaultData,groups:params.vaultData.groups});
              record.listRecords({cryptoKey:params.cryptoKey,vaultData:params.vaultData,records:groupsArray[i].records});
            });
          let nameString = "";
          if (params.vaultData.groupSelected != null && params.vaultData.groupSelected == i) {
            href.className = "item-selected";
          }
          nameString = nameString + "<span class='glyphicon glyphicon-calendar' aria-hidden='true'></span> "+groupsArray[i].name;
  				href.innerHTML = nameString;
          li.appendChild(href);
    }
    groupArea.appendChild(ul);
  } else {
    groupArea.innerHTML = "No items";
  }
};

exports.createGroup = (params) => {
  createEditGroup(params);
};

const createEditGroup = (params) => {
  const area = document.getElementById('detailArea');
  area.innerHTML = "";
  const header = document.createElement('h1');
  if (params.group != null) {
    header.innerHTML = "Modify Wallet";
  } else {
    header.innerHTML = "Add Wallet";
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
  const label = document.createElement('label');
  label.for = "inputName";
  label.innerHTML = "Name";
  formgroup.appendChild(label);
  const input = document.createElement('input');
  input.type = "text";
  input.className = "form-control";
  input.id = "inputName";
  input.setAttribute('maxlength','16');
  if (params.group != null) {
    input.value = params.group.name;
  }
  formgroup.appendChild(input);

  const saveBtn = document.createElement('button');
  saveBtn.type = "button";
  saveBtn.id = "saveBtn";
  saveBtn.className = "btn btn-default bottom-space pull-right";
  saveBtn.innerHTML = "<span class='glyphicon glyphicon-save' aria-hidden='true'></span> Save";
  saveBtn.addEventListener('click', _ => {
    const name = document.getElementById('inputName');
    if (name != null && name.value != "") {
      if (params.group != null) {
        params.group.name = name.value;
        params.group.modified = Date();
        params.vaultData.groups[params.vaultData.groupSelected] = params.group;
        params.vaultData.groups.sort(utils.compareIgnoreCase);
        params.vaultData.groupSelected = params.vaultData.groups.indexOf(params.group);
        ipc.send('process-group', {cryptoKey:params.cryptoKey,type:"group-modify",vaultData:params.vaultData});
      } else {
        let myGroup = {};
        myGroup.name = name.value;
        myGroup.created = Date();
        params.vaultData.groups.push(myGroup);
        params.vaultData.groups.sort(utils.compareIgnoreCase);
        params.vaultData.groupSelected = params.vaultData.groups.indexOf(myGroup);
        ipc.send('process-group', {cryptoKey:params.cryptoKey,type:"group-create",vaultData:params.vaultData});
      }
    }
  });
  area.appendChild(saveBtn);
};

exports.showGroupDetail = (params) => {
  renderGroupDetail(params);
};

const renderGroupDetail = (params) => {
  const area = document.getElementById('detailArea');
  area.innerHTML = "";
  const header = document.createElement('h1');
  header.innerHTML = "Day: "+params.group.name;
  area.appendChild(header);
  const divider = document.createElement('hr');
  area.appendChild(divider);
  const created = document.createElement('p');
  created.innerHTML = "Created: "+params.group.created;
  area.appendChild(created);

  const installCount = document.createElement('p');
  if (params.group.records != null) {
    installCount.innerHTML = "Count: "+params.group.records.length;
  } else {
    installCount.innerHTML = "Count: 0";
  }
  area.appendChild(installCount);
};
