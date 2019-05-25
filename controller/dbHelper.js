var mongoose = require("mongoose");

var add = (model, json, next) => {
  var Model = mongoose.model(model);
  var newItem = new Model(json);
  newItem.save((err, data) => {
    next(err, data);
  });
};

var list = (
  model,
  query,
  select = null,
  populate = null,
  populateSelect = null,
  isFindOne = false,
  next
) => {
  var Model = mongoose.model(model);
  var res = "";
  var find = Model.find(query);
  if (isFindOne) {
    find = Model.findOne(query);
  }
  if (select != null) {
    res = find.select(select);
  }
  if (populate != null && select != null) {
    res = res.populate(populate, populateSelect);
  } else if (populate != null && select == null) {
    res = find.populate(populate, populateSelect);
  } else {
    res = find;
  }
  res.exec((err, data) => {
    next(err, data);
  });
};

var update = (model, query, newQuery, next) => {
  var Model = mongoose.model(model);
  Model.update(query, newQuery, (err, data) => {
    next(err, data);
  });
};

var deleteDoc = (model, query, next) => {
  var Model = mongoose.model(model);
  Model.deleteOne(query, (err, data) => {
    next(err, data);
  });
};

var countDoc = (model, query, next) => {
  var Model = mongoose.model(model);
  Model.count(query, (err, data) => {
    next(err, data);
  });
};

module.exports.Add = add;
module.exports.List = list;
module.exports.Update = update;
module.exports.Delete = deleteDoc;
module.exports.Count = countDoc;
