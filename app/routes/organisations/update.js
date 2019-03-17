// /organisations/update
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
    if (
      req.user.class == "global-admin" ||
      (req.user.class == "local-admin" &&
        req.user.organisations.includes(req.query.organisation))
    ) {
      res.render("organisations/update", {
        title: "Update Organisation",
        organisationsActive: true,
        organisation: req.user.allOrganisations[req.query.organisation]
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
