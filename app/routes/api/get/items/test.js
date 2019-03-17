// /api/get/items/test
var router = require("express").Router();

var rootDir = process.env.CWD;

var Auth = require(rootDir + "/app/configs/auth");
var Helpers = require(rootDir + "/app/configs/helpful_functions");

var Activity = require(rootDir + "/app/models/activity");
var Categories = require(rootDir + "/app/models/categories");
var Items = require(rootDir + "/app/models/items");

router.post("/:test_id", Auth.isLoggedIn, function(req, res) {
  var uid = req.params.uid;
  var test_id = req.body.test;
  var outcome = req.body.outcome;

  var response = { status: "fail", test: null };

  Tests.getById(req.params.test_id, function(err, test) {
    if (err || !test) {
      res.send(response);
    } else {
      response.test = test;
      res.send(response);
    }
  });
});

module.exports = router;
