// /items/test
var router = require("express").Router();

var rootDir = process.env.CWD;

var Auth = require(rootDir + "/app/configs/auth");
var Helpers = require(rootDir + "/app/configs/helpful_functions");

var Users = require(rootDir + "/app/models/users");
var Items = require(rootDir + "/app/models/items");
var Tests = require(rootDir + "/app/models/tests");
var Procedures = require(rootDir + "/app/models/procedures");

router.get("/", Auth.isLoggedIn, function(req, res) {
  Items.getAll(req.user, function(err, items) {
    Items.getAll(req.user, function(err, items) {
      res.render("items/view/root", {
        title: "View All Items",
        viewItemsActive: true,
        items: items
      });
    });
  });
});

router.get("/:uid", Auth.isLoggedIn, function(req, res) {
  Items.getByUid(req.params.uid, req.user.categories, function(
    err,
    item,
    activity
  ) {
    Procedures.getAll(function(err, allProcedures) {
      Tests.getAll(function(err, allTests) {
        Users.getByOrganisationId(req.user, function(err, users, usersObj) {
          res.render("items/view/uid", {
            title: "View Item",
            viewItemsActive: true,
            item: item,
            activity: activity,
            allProcedures: allProcedures,
            allTests: allTests,
            users: usersObj,
            hideOrganisationSelect: true
          });
        });
      });
    });
  });
});

module.exports = router;
