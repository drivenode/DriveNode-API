const mongoose = require('mongoose');
var Schema = mongoose.Schema;


const blacklistSchema = new Schema({
    token: { type: String, require: true },
    createDate: { type: Date, default: Date.now }
})

const filesSchema = new Schema({
    filename: { type: String, requried: true },
    realname: { type: String, requried: true },
    extension: { type: String },
    mimetype: { type: String },
    size: { type: Number },
    createDate: { type: Date, default: Date.now },
    updateDate: { type: Date },
    dir: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'dir',
        required: false
    },
    key: { type: Buffer },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    share: { type: Object }
});

const dirSchema = new Schema({
    dirName: { type: String, required: true },
    parentDir: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'dir',
        required: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
});

const userSchema = new Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    salt: { type: String, require: true },
    email: { type: String, unique: true, required: true, uniqueCaseInsensitive: true },
    name: { type: String, required: true },
    createDT: { type: Number },
    updateDT: { type: Number },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'group',
        required: true
    },
    space: { type: Number, require: true },
    changePwd: { type: Boolean, required: false, default: false },
    activate: { type: Boolean, default: true }
});

const groupSchema = new Schema({
    groupName: { type: String, unique: true, required: true },
    files: {
        upload: Boolean,
        list: Boolean,
        delete: Boolean
    },
    dir: {
        create: Boolean,
        list: Boolean,
        delete: Boolean
    },
    changePwd: Boolean,
    createUser: Boolean,
    listUser: Boolean,
    createGroup: Boolean,
    defaultStorage: Number //KB
});

const logSchema = new Schema({

});

const resetPassword = new Schema({
    uid: { type: String, required: true },
    createDateTime: { type: Date, default: Date.now },
    token: String,
    reset: Boolean
});

const twofa = new Schema({
    uid: { type: String, required: true },
    type: { type: String, required: true },
    secret: { type: String },
    image: { type: String },
    createDateTime: { type: Date, default: Date.now }
});

const configSchema = new Schema({
    key: { type: String, required: true },
    value: { type: String }
})

module.exports = mongoose.model("file", filesSchema);
module.exports = mongoose.model("dir", dirSchema);
module.exports = mongoose.model("user", userSchema);
module.exports = mongoose.model("group", groupSchema);
module.exports = mongoose.model("config", configSchema);
module.exports = mongoose.model("blacklist", blacklistSchema);
module.exports = mongoose.model("resetPassword", resetPassword);
module.exports = mongoose.model("twofa", twofa);