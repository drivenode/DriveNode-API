var express=require("express");
var router=express.Router();
var Auth=require("../controller/auth");
var Dir=require("../controller/dirCtrl");

router.use(Auth.SetPermission({dir:{create:true}}));
router.post("/",Auth.CheckPermission,function(req,res,next){
    Dir.CreateDir(req.userId,req.body.name,req.body.parentDir,function(err,data){
        if(err){
            res.status(400).json({success:false,msg:err});
        }else{
            res.status(201).json({success:true,msg:"Directory Added",data:data});
        }
    });
});

router.use(Auth.SetPermission({dir:{list:true}}));
router.get("/",Auth.CheckPermission,function(req,res,next){
    Dir.ListDir(req.userId,req.query.dirName,req.query.parentDir,function(err,data){
        if(err){
            res.status(400).json({success:false,msg:err});
        }else{
            res.status(201).json({success:true,msg:"Directory List",data:data});
        }
    })
});

router.use(Auth.SetPermission({dir:{delete:true}}));
router.delete("/:dirId",Auth.CheckPermission,function(req,res,next){
    Dir.DeleteDir(req.userId,req.param.dirId,function(err,data){
        if(err){
            res.status(400).json({success:false,msg:err});
        }else{
            res.status(200).json({success:true,msg:"Directory Deleted",data:data});
        }
    });
});


router.use(Auth.SetPermission({dir:{create:true}}));
router.put("/:dirId",Auth.CheckPermission,function(req,res,next){
    Dir.RenameDir(req.userId,req.params.dirId,req.body.name,function(err,data){
        if(err){
            res.status(400).json({success:false,msg:err});
        }else{
            res.status(200).json({success:true,msg:data.msg,data:data.data});
        }
    })
});

module.exports=router;