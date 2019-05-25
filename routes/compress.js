var express = require("express");
var router = express.Router();
var Auth = require("../controller/auth");
var Compress = require("../controller/compress");
var fs = require("fs")

router.use(Auth.SetPermission({ files: { list: true } }));
router.get("/download", Auth.CheckPermission, (req, res, next) => {
  Compress.Compress(req.userId, req.query.files, req.query.name, req.query.compressFormat, (err, data) => {
    if (err) {
      console.log("router:" + err)
      res.status(400).json({ success: false, msg: err });
    } else {
      //res.status(201).json({ success: true, msg: "Compress Success", data: data });
      console.log("path:" + JSON.stringify(data))

      if (fs.existsSync(data.path)) {
        res.writeHead(200, {
          "Content-Type": "application/octet-stream", "Content-Disposition": "attachment; filename=" + data.filename,
          "filename": data.filename
        });
        fs.createReadStream(data.path).pipe(res);
        res.on("finish", function () {
          if (fs.existsSync(data.path)) {
            fs.unlinkSync(data.path);
          }
        });
      } else {
        res.status(400).json({ success: false, msg: "Compression Fail", data: "" });
      }
    }
  });
});

module.exports = router;
