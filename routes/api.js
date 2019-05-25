var express=require("express");
var router=express.Router();
var Token=require("../controller/token");

router.get("/list",function(req,res,next){
    Token.GetToken(function (data) {
        res.json(data);
    });
});

router.get("/token",function(req,res,next){
    var token=null;
    if(req.token){
        token=req.token;
    }else if(req.body.token){
        token = req.bobdy.token;
    }else if(req.query.token){
        token=req.query.token;
    } else if (req.params.token) {
        token=req.params.token;
    }

    Token.VerifyToken(token, function (err, data) {
        if(err){
            res.status(401).json({success:false,msg:err});
        }else{
            res.status(200).json({success:true,msg:data.msg});
        }
    });
})


module.exports =router;