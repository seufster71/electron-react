/*
  Author: Edward Seufert - Cborgtech, LLC
*/

const fs = require('fs')
const path = require('path')
const crypto = require('crypto');
const encryption = require('./encryption');

const logError = (err) => { err && console.error(err) }

exports.saveVault = (vaultFile, jsonString, myCryptKey) => {
  return getSaveVault(vaultFile, jsonString, myCryptKey);
};

const getSaveVault = (vaultFile, jsonString, myCryptKey) => {
  return new Promise((resolve,reject) => {
    // encrypt here
    const result = encryption.encrypt(myCryptKey, jsonString);
    // save file
    fs.writeFile(vaultFile, result, (err, data) => {
      // console.log("Save Vault Error " + err);
      if(err){
        reject("Could not write file");
      } else {
        resolve("SUCCESS");
      }
    });
  });
};

exports.deleteVault = (vaultFile) => {
  return new Promise((resolve,reject) => {
    // delete file
    if (fs.existsSync(vaultFile)) {
      fs.unlink(vaultFile, (err) => {
        // console.log("Delete Vault Error " + err);
        if(err){
          reject("Could not delete file");
        } else {
          resolve("SUCCESS");
        }
      });
    } else {
      reject("File does not exist!");
    }
  });
};

exports.readVaultList = (vaultListFile, myCryptKey) => {
  return new Promise((resolve,reject) => {
    fs.readFile(vaultListFile, 'utf-8', (err, data) => {
      if(err){
        reject({status:"ERROR",statusMsg:"Could not read profile file"});
      } else {
        // decrypt here
        try {
          const result = encryption.decrypt(myCryptKey, data);
          let x = JSON.parse(result);
          resolve(x);
        } catch (err) {
          reject({status:"ERROR",statusMsg:"Bad Password"});
        }
      }
    });
  });
};

exports.readVault = (vaultFile, myCryptKey) => {
  return new Promise((resolve,reject) => {
    fs.readFile(vaultFile, 'utf-8', (err, data) => {
      if(err){
        reject({status:"ERROR",statusMsg:"Could not read file"});
      } else {
        try {
          const result = encryption.decrypt(myCryptKey, data);
          let x = JSON.parse(result);
          resolve(x);
        } catch (err) {
          reject({status:"ERROR",statusMsg:"Bad Password"});
        }
      }
    });
  });
};

exports.makeDir = (vaultPath) => {
  return new Promise((resolve,reject) => {
    fs.stat(vaultPath, (err, stats) => {
      if (err && err.code !== 'ENOENT') {
        reject("Directory or Permission issue");
      } else if (err || !stats.isDirectory()) {
        fs.mkdir(vaultPath, logError);
        resolve("CREATED");
      } else {
        if (!fs.existsSync(path.join(vaultPath, 'vaultlist.json'))) {
          resolve("CREATED");
        }
        resolve("EXISTS");
      }
    });
  });
};

exports.initVaultList = (vaultPath, myCryptKey) => {
  return new Promise((resolve,reject) => {
    let vaultList = {
      vaults:[
        {name:"2018-1",
        path:"",
        created:"",
        id:0,
        file:"zvault-0.json",
        password:"",
        usePass:false,
        encryptkey:"",
        encrypted:false
        }
      ]
    };
    vaultList.vaults[0].created = Date();
    vaultList.vaults[0].path = vaultPath;
    // encrypt here
    const result = encryption.encrypt(myCryptKey, JSON.stringify(vaultList));
    // save file
    fs.writeFile(path.join(vaultPath, 'vaultlist.json'), result, (err, data) => {
        if(err){
          reject("Save profile list failed");
        } else {
          resolve("SUCCESS");
        }
    });
  });
};

exports.initVaultData = (vaultPath, vaultName, myCryptKey) => {
  return new Promise((resolve,reject) => {
    const today = Date();
    // console.log("init vault data");
    let initData = { file:vaultName };
  //  console.log("init vault data " + vaultName);
  // encrypt here
  const result = encryption.encrypt(myCryptKey, JSON.stringify(initData));
    // save file
    fs.writeFile(path.join(vaultPath, vaultName), result, (err, data) => {
      //console.log("Error " + err);
        if(err){
          reject("Init Failed");
        } else {
          resolve(initData);
        }
    });
  });
};

exports.nextVaultFileName = (vaultList) => {
  return getNextVaultFileName(vaultList);
};

const getNextVaultFileName = (vaultList) => {
  const vaults = vaultList.vaults;
  let ids = [];
  for (let vault of vaults) {
    ids.push(vault.id);
  }
  let highest = Math.max(...ids) + 1;
  return {id:highest,fileName:"zvault-"+highest+".json"};
};

exports.rotateCrypto = (vaultPath,oldCryptoKey,newCryptoKey,vaultList) => {
  return new Promise((resolve,reject) => {
    let errorStatus = false;
    let newfileNames = [];
    // rotate each vault
    let vaults = vaultList.vaults;
    let promises = [];
    const nextVaultName = getNextVaultFileName(vaultList);
    // save each vault with new crypto
    for (let vault of vaultList.vaults) {
        // console.log("file " + vault.file + " " + nextVaultName.fileName);
        promises.push(rotateVault(vaultPath,oldCryptoKey,newCryptoKey,vault.file,nextVaultName.fileName,nextVaultName.id));
        vault.file = nextVaultName.fileName;
        vault.id = nextVaultName.id;
        // increment nextVaultFileName
        nextVaultName.id = nextVaultName.id + 1;
        nextVaultName.fileName = "zvault-"+nextVaultName.id+".json";
    }
    // wait for all saves to complete
    Promise.all(promises)
      .then((values) => {
        // save the vault list
        // console.log("save vault List " + JSON.stringify(vaultList));
        getSaveVault(path.join(vaultPath, 'vaultlist.json'), JSON.stringify(vaultList), newCryptoKey)
          .then((val) => {
            // vault list has saved successfully
            // scrub old files and delete them
            let scrubPromises = [];
            for (let o of values) {
              scrubPromises.push(scrubOldFile(path.join(vaultPath, o.oldVaultName),o.fileLength));
            }
            Promise.all(scrubPromises)
              .then((scrubValues) => {
                resolve({status:"SUCCESS",statusMsg:"Password change successful",vaultList,cryptoKey:newCryptoKey});
              })
              .catch((val) => {
                resolve({status:"SUCCESS",statusMsg:"Password change successful but old data files were not removed",vaultList,cryptoKey:newCryptoKey})
              });
          })
          .catch((val) => {
            reject({status:"ERROR",statusMsg:"Change password failed"});
          });
      })
      .catch((values) => {
        // cleanup any new vaults that may have been created
        let scrubPromises = [];
        for (let o of values) {
          scrubPromises.push(scrubOldFile(path.join(vaultPath, o.oldVaultName),o.fileLength));
        }
        Promise.all(scrubPromies)
          .then((scrubValues) => {
            reject({status:"ERROR",statusMsg:"Change password failed"});
          })
          .catch((val) => {
            reject({status:"ERROR",statusMsg:"Change password failed"});
          });
      });
  });
};

const rotateVault = (vaultPath,oldCryptoKey,newCryptoKey,oldVaultName,nextVaultName,nextVaultId) => {
  return new Promise((resolve,reject) => {
    // console.log("rotate vault " + oldVaultName + " " + nextVaultName + " " + nextVaultId);
    fs.readFile(path.join(vaultPath, oldVaultName), 'utf-8', (err, data) => {
      if(err){
        // rollback;
        // console.log(err);
        reject("ERROR");
      } else {
        // console.log("read ");
        const oldData = encryption.decrypt(oldCryptoKey, data);
        // get data length for later
        const fileLength = oldData.length;
        // console.log("file length " + fileLength);
        const newData = encryption.encrypt(newCryptoKey, oldData);
        fs.writeFile(path.join(vaultPath, nextVaultName), newData, (err, data) => {
            if(err){
              // rollback
              reject("ERROR");
            } else {
              resolve({oldVaultName,fileLength});
            }
        });
      }
    });
  });
};

const scrubOldFile = (vaultFile,fileLength) => {
  return new Promise((resolve,reject) => {
    // scrub data first
    // console.log("scrub file " + vaultFile);
    let r = crypto.randomBytes(fileLength).toString('hex');
    fs.writeFile(vaultFile, r, (err, data) => {
        if(err){
          reject({status:"ERROR",statusMsg:"Unable to Clean file " + vaultFile});
        } else {
          // delete file
          if (fs.existsSync(vaultFile)) {
            fs.unlink(vaultFile, (err) => {
              if(err){
                reject({status:"ERROR",statusMsg:"Unable to Delete file " + vaultFile});
              } else {
                resolve({status:"SUCCESS"});
              }
            });
          }
        }
    });
  });
};

exports.cryptoTest = () => {
  const secret = 'abcdefg';
  const hash = crypto.createHmac('sha256', secret)
                   .update('I love cupcakes')
                   .digest('hex');
  // console.log(hash);
}
