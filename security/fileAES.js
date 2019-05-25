var fs = require("fs");
var crypto = require("crypto");
const uuidv4 = require("uuid/v4");
var config = require("../controller/config");
var rsaKey = require("./rsaKey");

var encrypt = (path, filename, next) => {
  let key = rsaKey.GenerateKey();
  let decKey = rsaKey.DecryptKey(key);
  let fileInputDest = path + "/" + filename;
  let destPath = config.getConfig.config.filesPath + "/" + filename;

  var cipher = crypto.createCipher("aes-256-cbc", decKey);
  var inputFile = fs.createReadStream(fileInputDest);
  var outputFile = fs.createWriteStream(destPath);
  console.log("a");
  inputFile.pipe(cipher).pipe(outputFile);
  console.log("b");
  outputFile.on("finish", function () {
    console.log("c");
    if (fs.existsSync(fileInputDest)) {
      fs.unlinkSync(fileInputDest);
    }
    next(null, { key: key });
    console.log("key:" + key);
  });
};

var decrypt = (filename, key, destination, next) => {
  let fromPath = config.getConfig.config.filesPath + "/" + filename;
  let destPath = destination + "/" + filename;//config.getConfig.config.fileDecrypt + "/" + filename;
  let fileKey = rsaKey.DecryptKey(key);
  var decipher = crypto.createDecipher("aes-256-cbc", fileKey);
  if (fs.existsSync(fromPath)) {
    var input = fs.createReadStream(fromPath);
    var output = fs.createWriteStream(destPath);
    input.pipe(decipher).pipe(output);
    output.on("close", function () {
      next(null, true);
    });
  } else {
    next("File not found", null);
  }
};

var decryptFileCompress = (filename, key, next) => {
  let fromPath = config.getConfig.config.filesPath + "/" + filename;
  let destPath = config.getConfig.config.fileCompressDecrypt + "/" + filename;
  let fileKey = rsaKey.DecryptKey(key);
  var decipher = crypto.createDecipher("aes-256-cbc", fileKey);
  if (fs.existsSync(fromPath)) {
    var input = fs.createReadStream(fromPath);
    var output = fs.createWriteStream(destPath);
    input.pipe(decipher).pipe(output);
    output.on("close", function () {
      next(null, true);
    });
  } else {
    next("File not found", null);
  }
};

module.exports.Encrypt = encrypt;
module.exports.Decrypt = decrypt;
module.exports.DecryptFileCompress = decryptFileCompress;
