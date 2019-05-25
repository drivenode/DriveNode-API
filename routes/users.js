var express = require('express');
var router = express.Router();
var Auth = require('../controller/auth')
var User = require('../controller/user')
var TwoFA = require('../controller/twofa');

/* GET users listing. */
router.get('/', Auth.IsAuthenticated, function (req, res, next) {
  User.GetProfile(req.userId, (err, data) => {
    if (err) {
      res.status(400).json(err);
    } else {
      res.status(200).json(data);
    }
  })
});

router.get('/checktfaSec', Auth.IsAuthenticated, (req, res, next) => {
  TwoFA.GetSecret(req.userId, (err, data) => {
    if (data) {
      res.status(200).json(data);
    } else {
      res.status(400).json(err);
    }
  })
});

router.get('/get2faToken', Auth.IsAuthenticated, (req, res, next) => {
  TwoFA.GenNewToken(req.userId).then((data) => {
    res.status(200).json({ success: true, data: data });
  })
});

router.post('/gettotpSecret', Auth.IsAuthenticated, (req, res, next) => {
  TwoFA.GenNewTotpSecret(req.userId, (err, data) => {
    console.log(data);
    console.log(err)
    if (data) {
      res.status(200).json(data);
    } else {
      res.status(400).json(err);
    }
  })
});

router.post('/validatetfa', (req, res, next) => {

})

router.get('/validate2fa', (req, res, next) => {
  TwoFA.Validate(req.query.tfa).then(data => {
    console.log(req.query.tfa)
    if (data) {
      res.status(200).json({ success: true, data: data });
    } else {
      res.status(401).json({ success: false, data: data });

    }
  })
})

router.put('/changePwd', Auth.IsAuthenticated, (req, res, next) => {
  User.ChangePassword(req.userId, req.body.oldPassword, req.body.newPassword, req.body.confirmPassword, null, (err, data) => {
    if (err) {
      res.status(400).json(err);
    } else {
      Auth.AddBlackList(req, res, () => {

      })
      res.status(201).json({ success: true, msg: "Password changed" });
    }
  })
})

router.put('/resetPassword', (req, res, next) => {
  User.ResetPwd(req.body.username, req.body.email, (err, data) => {
    if (err) {
      res.status(400).json({ success: false, msg: err });
    } else {
      res.status(201).json({ success: true, msg: "Password Reset! Please chaeck your email" });
    }
  })
})

module.exports = router;
