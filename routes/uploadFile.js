var express=require("express");
var router=express.Router();
var multer=require("multer");
var fs=require("fs");
var Auth = require("../controller/auth");
var File=require("../controller/file");
var config = require('../controller/config');
var dbHelper=require("../controller/dbHelper");

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, config.getConfig.config.uploadTempPath)
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now())
    }
  })
var upload=multer({ storage: storage });


router.use(Auth.SetPermission({files:{upload:true}}));
router.post('/upload',Auth.CheckPermission,upload.single('fileUpload'),File.AvailableSpace,function(req,res,next){ 
    console.log("req:"+req)
    File.FileAdd(req.file,req.body.dir,req.userId,function(err,data){
      if(err){
        res.status(200).json(err);
      }else{
        res.status(201).json(data);
      }
    });
});

module.exports=router;