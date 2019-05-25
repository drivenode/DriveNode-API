var async=require("async");
var dbHelper=require('./dbHelper.js');

var createDir=(uid,dirName,parentDir=null,next)=>{
    if(uid&&dirName){
        let json={};
        json.dirName=dirName;
        if(parentDir){
            json.parentDir=parentDir;
        }
        json.owner=uid;
        dbHelper.Add('dir',json,function(err,data){
            next(err,data);
        });
    }
}

var listDir=(uid,dirName=null,parentDir=null,next)=>{
    if(uid){
        let json={};
        if(dirName){
            json.dirName=dirName;
        }
        if(parentDir){
            json.parentDir=parentDir;
        }else{
            json.parentDir=null;
        }
        json.owner=uid;
        dbHelper.List('dir',json,null,"dir",null,false,function(err,data){
            console.log(json);
            next(err,data);
        });
    }
}

var rmDir=(uid,dirId=null,next)=>{
    if(uid){
        var json={};
        json.dir=dirId;

        var dirJson={};
        dirJson._id=dirId;
        dirJson.owner=uid;

        async.waterfall([
            function(cb){
                //find file
                dbHelper.List('file',json,null,null,null,false,function(err,data){
                    cb(err,data);
                });
            },function(data,cb){
                //Check Dir
                if(data&&data.length>0){
                    dbHelper.List('dir',dirJson,null,null,null,false,function(err,data){
                        cb(err,data);
                    });
                }else{
                    next({success:false,msg:"Directory Exist, please delete all files belong to this directory"},null);
                }
            }
            ,function(data,cb){
                if(data&&data.length>0){
                    next({success:false,msg:"File Exist, please delete all files belong to this directory"},null);
                }else{
                    dbHelper.Delete("dir",dirJson,function(err,data){
                        cb(err,data);
                    });
                }
            }
        ],function(err,data){
            if(err){
                next(err,null);
            }else{
                next(null,data);
            }
        });
    }else{
        next({success:false,msg:"Invalid UID",data:""},null);
    }
}

var renameDir=(uid, dirId,name,next)=>{
    async.waterfall([
        function(cb){
            console.log("dirId"+dirId+"/name"+name)
            if(dirId&&name){
                dbHelper.List('dir',{owner:uid,_id:dirId},null,null,null,true,function(err,data){
                    if(err){
                        next({success:false,msg:"Directory not found",data:""},null);
                    }else{
                        cb(null,true);
                    }
                })
            }else{
                next({success:false,msg:"Directory not found",data:""},null);
            }
            
        },function(req,cb){
            if(req){
                dbHelper.Update('dir',{owner:uid,_id:dirId},{dirName:name},function(err,data){
                    cb(err,data);
                })
            }else{
                
            }
        }
    ],function(err,data){
        if(err){
            next({success:false,msg:err,data:""},null);
        }else{
            next(null,{success:true,msg:"Rename success",data:data});
        }
    });
}

module.exports.CreateDir=createDir;
module.exports.ListDir=listDir;
module.exports.DeleteDir=rmDir;
module.exports.RenameDir=renameDir;