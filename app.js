var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var cron = require("cron");

var config = require("./controller/config");
var token = require("./controller/token");
var LogFile = require("./controller/log");
let mail = require("./controller/mail");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var apiRouter = require("./routes/api");
var authRouter = require("./routes/auth");
var adminRouter = require("./routes/admin");
var installRouter = require("./routes/install");
var fileUploadRouter = require("./routes/uploadFile");
var fileRouter = require("./routes/file");
var dirRouter = require("./routes/dir");
var compressRouter = require("./routes/compress");

var user = require("./controller/user");
var rsa = require("./security/rsaKey");

config.Config(function (data) {
  if (data.error) {
    console.log("config file load failed");
  } else {
    console.log("config file loaded");
    var endpoint = config.getConfig.config.dbEndpoint;
    var dbName = config.getConfig.config.dbName;
    mongoose.connect("mongodb://" + endpoint + "/" + dbName, {
      useNewUrlParser: true, socketTimeoutMS: 0,
      keepAlive: true,
      reconnectTries: 30
    });
    rsa.GenerateKey();
    var cronJob = cron.job(config.getConfig.config.cronDeleteBlacklist, function () {
      console.info('cron job completed');
      token.BlackListRemove((err, data) => {
        console.log(err + data);
        if (err) {
          LogFile.JsonLogFile(err, "blacklist", (data) => { })
        } else {
          LogFile.JsonLogFile(data, "blacklist", (data) => { })
        }
      });
    });
    cronJob.start();

  }
});
/*
mail.SendEmail({
  from: 'admin@drivenode.com', // sender address
  to: "damonwcw@outlook.com", // list of receivers
  subject: "DriveNode Started", // Subject line
  text: "DriveNode Started at " + new Date(), // plain text body
  html: "DriveNode Started at " + new Date() // html body
})
*/
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("DB Connection established");
});




var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
//app.use(express.static(__dirname + '/views'));

app.use("/", indexRouter);
app.use("/install", installRouter);

//All API Router
app.use("/api/install", installRouter);
app.use("/api/token", apiRouter);
app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/fileUpload", fileUploadRouter);
app.use("/api/file", fileRouter);
app.use("/api/dir", dirRouter);
app.use("/api/compress", compressRouter);

app.use(function (req, res, next) {
  user.CheckAdmin(function (data) {
    if (!data) {
      res.redirect("/install");
    }
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
  //res.redirect('/');
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
