// /organisations/manage
var router = require("express").Router();

var rootDir = process.env.CWD;

var Auth = require(rootDir + "/app/configs/auth");
var Helpers = require(rootDir + "/app/configs/helpful_functions");

var Organisations = require(rootDir + "/app/models/organisations");
var Users = require(rootDir + "/app/models/users");

router.get(
  "/",
  Auth.isLoggedIn,
  Auth.isOfClass(["global-admin", "local-admin"]),
  function(req, res) {
    if (!req.query.organisation) {
      res.redirect(
        process.env.PUBLIC_ADDRESS +
          "/organisations/manage?organisation=" +
          req.user.organisation.organisation_id
      );
    } else {
      console.log(req.user.organisations.includes(req.query.organisation));
      if (
        req.user.class == "global-admin" ||
        (req.user.class == "local-admin" &&
          req.user.organisations.includes(req.query.organisation))
      ) {
        Users.getByOrganisationId(req.user, function(err, users) {
          res.render("organisations/manage", {
            title: "Organisations",
            organisationsActive: true,
            organisation: req.user.organisation,
            organisations:
              req.user.allOrganisations[req.query.organisation.organisation_id],
            users: users
          });
        });
      } else {
        res.redirect(
          process.env.PUBLIC_ADDRESS +
            "/organisations/manage?organisation=" +
            req.user.organisation.organisation_id
        );
      }
    }
  }
);

module.exports = router;
