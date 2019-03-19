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

router.post(
  "/",
  Auth.isLoggedIn,
  Auth.isOfClass(["global-admin", "local-admin"]),
  function(req, res) {
    if (
      (req.user.class == "global-admin" && req.query.organisation) ||
      (req.user.class == "local-admin" &&
        req.user.organisations.includes(req.query.organisation))
    ) {
      var details = req.body.details;
      var formattedDetails = {};

      if (details.title) {
        formattedDetails.title = details.title;
        if (details.address) {
          formattedDetails.address = details.address;
          var organisation = {};
          organisation.organisation_id = req.query.organisation;
          organisation.details = formattedDetails;
          Organisations.update(organisation, function(err) {
            if (!err) {
              req.flash("success_msg", "Organisation updated!");
              res.redirect(
                process.env.PUBLIC_ADDRESS +
                  "/organisations/view?organisation=" +
                  req.query.organisation
              );
            } else {
              
              req.flash("error_msg", "Something went wrong! Try again.");
              res.redirect(
                process.env.PUBLIC_ADDRESS +
                  "/organisations/update?organisation=" +
                  req.query.organisation
              );
            }
          });
        } else {
          req.flash("error_msg", "Please enter an address");
          res.redirect(
            process.env.PUBLIC_ADDRESS +
              "/organisations/update?organisation=" +
              req.query.organisation
          );
        }
      } else {
        req.flash("error_msg", "Please enter a name");
        res.redirect(
          process.env.PUBLIC_ADDRESS +
            "/organisations/update?organisation=" +
            req.query.organisation
        );
      }
    } else {
      res.render("error", {
        title: "Page Not Found",
        notFound: true
      });
    }
  }
);

module.exports = router;
