const { exec } = require('child_process');

let backupDB = () => {
    exec("mongodump");
}

let backupFiles = (destination) => {
    if (destination) {

    } else {

    }
}

module.exports.BackupDB = backupDB;