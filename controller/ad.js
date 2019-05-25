let AD = require('ad');
let async = require("async")
let Config = require("../controller/config");
let User = require("../controller/user");

// Your AD account should be a member
// of the Administrators group.
let ad = new AD({
    url: "ldaps://192.168.1.14",
    user: "administrator@damonwonghome.com",
    pass: "basa3aTR"
});

let authencate = (username, pwd, cb) => {
    ad.user(username).authenticate(pwd).then(res => {
        cb(null, res);
    }).catch(err => {
        console.log(err)
        cb(err, null);
    })
}

let listUsers = (cb) => {
    let filter = {};
    let res = [];
    let available = [];
    let users = [];
    async.waterfall([
        (next) => {
            User.ListUsers("_id username", "", "", (err, data) => {
                console.log(data);
                let users = []
                for (let i = 0; i < data.length; i++) {
                    users.push(data[i].username);
                }
                //users = data;
                next(null, users);
            })
        },
        (users, next) => {
            let tmp = [];

            ad.user().get(filter).then(data => {
                for (let i = 0; i < data.length; i++) {
                    res.push(data[i].sAMAccountName);
                }
                next(null, { res: res, users: users })
            }).catch(err => {
                next(err, null)
            })

        }, (data, next) => {
            console.log(data);
            let adUser = data.res;
            forEachArray(data.users, data.res).then((available) => {
                next(null, { users: data.users, available: available });
            })
        }
    ], (err, data) => {
        cb(err, data);
    })
}

async function forEachArray(users, res) {
    let result = [];
    for (let a = 0; a < users.length; a++) {
        var index = res.indexOf(users[a]);
        if (index > -1) {
            console.log("forEachArray: " + res + " index: " + index)
            await res.splice(index, 1);
        } else {
            console.log("else");
        }
    }
    return res;
}

module.exports.Auth = authencate;
module.exports.ListUser = listUsers;