import React from 'react';
import PropTypes from 'prop-types';
import crypto from 'crypto';

export function encrypt(cryptoKey, clearData){
  const randomIV = crypto.randomBytes(16);
  //console.log("random string " + randomIV);
  //console.log("crytokey " + cryptoKey);
  let encipher = crypto.createCipheriv('aes-256-cbc', cryptoKey, randomIV);
  let encryptedData = encipher.update(clearData,'utf8');
  //encryptData += encipher.final("base64");
  const finalBuffer = Buffer.concat([encryptedData, encipher.final()]);
  const encryptedHex = randomIV.toString('hex') + ':' + finalBuffer.toString('hex');
  //console.log("encrypt data "  + encryptedHex);
  return encryptedHex;
}

export function decrypt(cryptoKey, encryptedHex) {
  //console.log("decrypt " + encryptedHex);
  //console.log("crytokey " + cryptoKey);
  const encryptedArray = encryptedHex.split(':');
  const randomIV = new Buffer(encryptedArray[0], 'hex');
  //console.log("random iv " + randomIV);
  const encryptedData = new Buffer(encryptedArray[1], 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', cryptoKey, randomIV);
  let decrypted = decipher.update(encryptedData,'utf8');
  const clearText = Buffer.concat([decrypted, decipher.final()]).toString();
  //console.log("clear text " + clearText);
  return clearText;
}
