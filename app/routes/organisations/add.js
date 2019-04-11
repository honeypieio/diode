// /organisations/add
var router = require("express").Router();

var rootDir = process.env.CWD;

var Auth = require(rootDir + "/app/configs/auth");
var Helpers = require(rootDir + "/app/configs/helpful_functions");

var Organisations = require(rootDir + "/app/models/organisations");
var Users = require(rootDir + "/app/models/users");

router.get("/", Auth.isLoggedIn, Auth.isOfClass(["global-admin"]), function(
  req,
  res
) {
  res.render("organisations/add", {
    title: "Add Organisation",
    organisationsActive: true,
    hideOrganisationSelect: true
  });
});

router.post("/", Auth.isLoggedIn, Auth.isOfClass(["global-admin"]), function(
  req,
  res
) {
  var details = req.body.details;
  var formattedDetails = {};

  if (details.title) {
    formattedDetails.title = details.title;
    if (details.address) {
      formattedDetails.address = details.address;
      var organisation = {};
      organisation.details = formattedDetails;
      Organisations.add(organisation, function(err, organisation_id) {
        if (!err) {
          req.flash("success_msg", "Organisation added!");
          res.redirect(
            process.env.PUBLIC_ADDRESS +
              "/organisations/view?organisation=" +
              organisation_id
          );
        } else {
          req.flash("error_msg", "Something went wrong! Try again.");
          res.redirect(process.env.PUBLIC_ADDRESS + "/organisations/add");
        }
      });
    } else {
      req.flash("error_msg", "Please enter an address");
      res.redirect(process.env.PUBLIC_ADDRESS + "/organisations/add");
    }
  } else {
    req.flash("error_msg", "Please enter a name");
    res.redirect(process.env.PUBLIC_ADDRESS + "/organisations/add");
  }
});

module.exports = router;
