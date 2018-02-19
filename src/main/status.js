/*
  Author: Edward Seufert - Cborgtech, LLC
*/

exports.showStatus = (params) => {

  const statusArea = document.getElementById('statusArea');
  statusArea.innerHTML = "";

  const alert = document.createElement('DIV');
  if (params.status != null){
    switch(params.status) {
    case "SUCCESS":
      alert.className = "alert alert-success";
      break;
    case "ERROR":
      alert.className = "alert alert-danger";
      break;
    default:
        alert.className = "alert alert-info";
      }
  }
  alert.setAttribute('role','alert');
  alert.innerHTML = params.statusMsg;

  statusArea.appendChild(alert);
  window.setTimeout(closeStatus, 3000);
};



exports.hideStatus = () => {
  closeStatus();
};

const closeStatus = () => {
  const statusArea = document.getElementById('statusArea');

  statusArea.innerHTML = "&nbsp";
};
