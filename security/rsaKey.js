const uuidv4 = require('uuid/v4');
const NodeRSA = require('node-rsa');
const fs=require('fs');
var config=require("../controller/config")

var generateKey=()=>{
    var key=uuidv4();
    var privateKey=fs.readFileSync(config.getConfig.config.keyPrivatePath);
    var rsaKey=new NodeRSA();
    rsaKey.importKey(privateKey);
    return rsaKey.encrypt(key);
}

var decryptKey=(payload)=>{
    var privateKey=fs.readFileSync(config.getConfig.config.keyPrivatePath);
    var rsaKey=new NodeRSA();
    rsaKey.importKey(privateKey);
    let dec=rsaKey.decrypt(payload).toString();
    return dec;
}

module.exports.GenerateKey=generateKey;
module.exports.DecryptKey=decryptKey;