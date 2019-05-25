var express = require('express');
var router = express.Router();
var Auth = require("../controller/auth");
var File = require("../controller/file");
var fs = require('fs');
var config = require('../controller/config')

router.use(Auth.SetPermission({ files: { list: true } }))
router.get('/', Auth.CheckPermission, function (req, res, next) {
    var uid = req.userId;
    if (uid) {
        File.FileList(uid, req.query.dir, function (err, data) {
            if (err) {
                res.status(400).json({ succes: false, error: "", msg: err });
            } else {
                res.status(200).json({ success: true, msg: "", data: data });
            }
        });
    } else {
        res.status(401).json({ success: false, error: "", msg: "Invalid UID" });
    }
});

router.use(Auth.SetPermission({ files: { list: true } }))
router.get('/info/:fileId', Auth.CheckPermission, function (req, res, next) {
    var uid = req.userId;
    if (uid) {
        File.FileInfo(uid, req.params.fileId, (err, data) => {
            if (err) {
                res.status(400).json({ succes: false, error: "", msg: err });
            } else {
                res.status(200).json({ success: true, msg: "File Info got", data: data });
            }
        })
    } else {
        res.status(401).json({ success: false, error: "", msg: "Invalid UID" });
    }
})

router.use(Auth.SetPermission({ files: { list: true } }))
router.get('/:fileId', Auth.CheckPermission, function (req, res, next) {
    var uid = req.userId;
    if (uid) {
        File.FileGet(uid, req.params.fileId, res, function (err, data) {
            if (err) {
                res.status(400).json({ succes: false, error: "", msg: err });
            }
        });
    } else {
        res.status(401).json({ success: false, error: "", msg: "Invalid UID" });
    }
});

router.use(Auth.SetPermission({ files: { upload: true } }))
router.put('/:fileId', Auth.CheckPermission, function (req, res, next) {
    var uid = req.userId;
    var filename = req.body.filename;
    console.log(uid);
    console.log(filename)
    if (uid && filename) {
        File.FileRename(uid, req.body.filename, req.params.fileId, function (err, data) {
            if (err) {
                res.status(400).json({ succes: false, error: "", msg: err });
            } else {
                res.status(201).json({ success: true, msg: "File renamed", data: data });
            }
        });
    } else {
        res.status(401).json({ success: false, error: "", msg: "Invalid UID or filename" });
    }
});

router.use(Auth.SetPermission({ files: { delete: true } }));
router.delete('/:fileId', Auth.CheckPermission, function (req, res, next) {
    var uid = req.userId;
    var fileId = req.params.fileId;
    if (uid && fileId) {
        File.FileDelete(uid, fileId, function (err, data) {
            if (err) {
                res.status(400).json({ succes: false, error: "", msg: err });
            } else {
                res.status(201).json({ success: true, msg: "File deleted", data: data });
            }
        })
    } else {
        res.status(401).json({ success: false, error: "", msg: "Invalid UID or filename" });
    }
});

router.use(Auth.SetPermission({ files: { list: true } }));
router.get('/preview/:fileId', Auth.CheckPermission, (req, res, next) => {
    var uid = req.userId;
    var fileId = req.params.fileId;
    var output;
    if (uid && fileId) {
        File.GetFilePreview(uid, fileId, (err, data) => {
            if (err) {
                console.log(err);
                res.status(400).json({ success: false, msg: err, data: null })
            } else {
                var range = req.headers.range;
                if (fs.existsSync(config.getConfig.config.streamTempPath + "/" + data.filename)) {
                    const path = config.getConfig.config.streamTempPath + "/" + data.filename
                    const stat = fs.statSync(path)
                    const fileSize = stat.size
                    if (range) {
                        const parts = range.replace(/bytes=/, "").split("-")
                        const start = parseInt(parts[0], 10)
                        const end = parts[1]
                            ? parseInt(parts[1], 10)
                            : fileSize - 1

                        const chunksize = (end - start) + 1
                        const file = fs.createReadStream(path, { start, end })
                        const head = {
                            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                            'Accept-Ranges': 'bytes',
                            'Content-Length': chunksize,
                            'Content-Type': data.mimetype,
                        }

                        res.writeHead(206, head)
                        file.pipe(res)
                    } else {
                        const head = {
                            'Content-Length': fileSize,
                            'Content-Type': data.mimetype,
                        }
                        res.writeHead(200, head)
                        fs.createReadStream(path).pipe(res)
                    }
                } else {
                    res.status(400).json({ success: false, msg: "File not exist", data: null });
                }
            }
        })
    } else {

    }
})

module.exports = router;