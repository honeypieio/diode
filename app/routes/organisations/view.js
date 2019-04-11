// /organisations/view
var router = require("express").Router();
var async = require("async");

var rootDir = process.env.CWD;

var Auth = require(rootDir + "/app/configs/auth");
var Helpers = require(rootDir + "/app/configs/helpful_functions");

var Organisations = require(rootDir + "/app/models/organisations");
var Users = require(rootDir + "/app/models/users");
var Items = require(rootDir + "/app/models/items");

router.get(
  "/",
  Auth.isLoggedIn,
  Auth.isOfClass(["global-admin", "local-admin"]),
  function(req, res) {
    console.log(req.user);
    if (
      req.user.class == "global-admin" ||
      (req.user.class == "local-admin" &&
        req.user.organisations.includes(req.query.organisation))
    ) {
      Items.getAllByOrganisationId(req.user, function(err, items) {
        Users.getByOrganisationId(req.user, function(err, users) {
          var activeUsers = [];
          async.each(
            users,
            function(user, callback) {
              if (user.deactivated == 0) {
                activeUsers.push(user);
              }
              callback();
            },
            function() {
              res.render("organisations/view", {
                title: "View Organisation",
                organisationsActive: true,
                organisation: req.user.allOrganisations[req.query.organisation],
                items: items,
                users: activeUsers
              });
            }
          );
        });
      });
    } else {
      res.render("error", {
        title: "Page Not Found",
        notFound: true
      });
    }
  }
);

module.exports = router;
