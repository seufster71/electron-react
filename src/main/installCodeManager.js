/*
  Author: Edward Seufert - Cborgtech, LLC
*/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const encryption = require('./encryption');
const myCryptKey = crypto.createHmac('sha256','siENFn34783w').update('73fnfisv734e').digest();

const logError = (err) => { err && console.error(err) }

exports.readLicenseFile = (vaultFile, myCryptKey) => {
  return new Promise((resolve,reject) => {
    fs.readFile(vaultFile, 'utf-8', (err, data) => {
      if(err){
        reject("Could not read file");
      } else {
        const result = encryption.decrypt(myCryptKey, data);
        let x = JSON.parse(result);
        resolve(x);
      }
    });
  });
};


exports.checkLicense = (licenseDir) => {
  return new Promise((resolve,reject) => {
    const licenseFile = path.join(licenseDir, 'license.json');
    fs.stat(licenseDir, (err, stats) => {
      if (err && err.code !== 'ENOENT') {
        reject({status:"ERROR",statusMs:"Directory or Permission issue"});
      } else if (err || !stats.isDirectory()) {
        fs.mkdir(licenseDir, (err, mkdirData) => {
          console.log("make license path");
          // create inital
          const initCode = encryption.encrypt(myCryptKey, JSON.stringify({key:'init'}));
          fs.writeFile(licenseFile, initCode, (err, data) => {
            if(err){
              reject({status:ERROR,statusMsg:"Could not save initial license file"});
            } else {
              fs.stat(licenseFile, (err, stats) => {
                if (err) {
                  console.log("error");
                  reject({status:"ERROR",statusMsg:err});
                } else {
                  console.log(stats);
                  // create license code
                  const fileCode = "codeInfo::"+stats["ino"]+"::"+stats["gid"]+"::"+stats["uid"]+"::"+stats["birthtime"];
                  console.log("the key " + fileCode);
                  const keyCode = encryption.encrypt(myCryptKey, fileCode);
                  console.log("new key "+ keyCode);
                  resolve({status:"ERROR",keyCode,fileCode});
                }
              });
            }
          });
        });
      } else {
        console.log("dir exists");
        if (!fs.existsSync(licenseFile)) {
          // create inital
          const encryptLicense = encryption.encrypt(myCryptKey, JSON.stringify({key:'init'}));
          fs.writeFile(licenseFile, encryptLicense, (err, data) => {
            if(err){
              reject({status:ERROR,statusMsg:"Could not save initial license file"});
            } else {
              resolve({status:"CREATED"});
            }
          });
        } else {
          fs.readFile(licenseFile, 'utf-8', (err, data) => {
            console.log("reading license");
            if (err) {
              reject({status:"ERROR",statusMsg:err});
            } else {
              fs.stat(licenseFile, (err, stats) => {
                if (err) {
                  console.log("error");
                  reject({status:"ERROR",statusMsg:err});
                } else {
                  console.log(stats);
                  console.log("license file data " + data);
                  // decrypt and compare license key
                  const licenseKey = encryption.decrypt(myCryptKey, data);
                  let x = JSON.parse(licenseKey);
                  console.log("l key " + x.key);
                  console.log("l code " + x.fileCode);
                  const fileCode = "codeInfo::"+stats["ino"]+"::"+stats["gid"]+"::"+stats["uid"]+"::"+stats["birthtime"];
                  console.log("the code " + fileCode);
                  if (x.fileCode != null && x.fileCode === fileCode){
                    resolve({status:"SUCCESS"});
                  } else {
                    const keyCode = encryption.encrypt(myCryptKey, fileCode);
                    console.log("new key "+ keyCode);
                    resolve({status:"ERROR",keyCode,fileCode});
                  }
                }
              });
            }
          });
        }
      }
    });
  });
};

exports.saveLicense = (licenseFile, jsonString) => {
  return new Promise((resolve,reject) => {

    // encrypt here
    const result = encryption.encrypt(myCryptKey, jsonString);
    // save file
    fs.writeFile(licenseFile, result, (err, data) => {
      if(err){
        reject({status:ERROR,statusMsg:"Could not save license file"});
      } else {
        resolve({status:"SUCCESS",statusMsg:"License saved"});
      }
    });
  });
};

exports.readCode = (encryptedData) => {
  return encryption.decrypt(myCryptKey,encryptedData);
};

exports.getLicense = (data) => {
  return crypto.createHmac('sha256','siENFn34783w').update(data).digest('hex');
};
