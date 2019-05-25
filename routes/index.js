var express = require('express');
var router = express.Router();
var token = require('../controller/token');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'driveNode2.0' });
});

module.exports = router;
