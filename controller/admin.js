var dbHelper = require("./dbHelper");

var adminCount = (object, next) => {
  //dashboard counter

  dbHelper.Count(object, {}, (err, data) => {
    let json = {};
    if (data) {
      json.count = data;
    }

    next(err, json);
  });
};

module.exports.AdminCount = adminCount;
