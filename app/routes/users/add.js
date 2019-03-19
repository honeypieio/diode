// /users/add

var router = require("express").Router();

var rootDir = process.env.CWD;

var Users = require(rootDir + "/app/models/users");

var Auth = require(rootDir + "/app/configs/auth");
var Helpers = require(rootDir + "/app/configs/helpful_functions");

router.get(
  "/",
  Auth.isLoggedIn,
  Auth.isOfClass(["global-admin", "local-admin"]),
  function(req, res) {
    res.render("users/add", {
      title: "Add User",
      usersActive: true,
      hideOrganisationSelect: true
    });
  }
);

router.post(
  "/",
  Auth.isLoggedIn,
  Auth.isOfClass(["global-admin", "local-admin"]),
  function(req, res) {
    var first_name = req.body.first_name.trim();
    var last_name = req.body.last_name.trim();
    var email = req.body.email.trim();
    var userClass = req.body.class;
    var organisations = req.body.organisations;

    if (!Array.isArray(req.body.organisations)) {
      organisations = [organisations];
    }

    var validClasses = [];
    if (req.user.class == "global-admin") {
      validClasses = ["global-admin", "local-admin", "tester"];
    } else if (req.user.class == "local-admin") {
      validClasses = ["local-admin", "tester"];
    }

    // Validation

    if (email) {
      req
        .check(
          "email",
          "This email address is already associated with an account. <a href='#'>Recover account</a>"
        )
        .isEmailAvailable();
    }

    req.checkBody("first_name", "Please enter a first name").notEmpty();
    req
      .checkBody(
        "first_name",
        "Please enter a shorter first name (<= 20 characters)"
      )
      .isLength({ max: 20 });

    req.checkBody("last_name", "Please enter a last name").notEmpty();
    req
      .checkBody(
        "last_name",
        "Please enter a shorter last name (<= 30 characters)"
      )
      .isLength({ max: 30 });

    req.checkBody("email", "Please enter an email address").notEmpty();
    req
      .checkBody(
        "email",
        "Please enter a shorter email address (<= 89 characters)"
      )
      .isLength({ max: 89 });
    req.checkBody("email", "Please enter a valid email address").isEmail();

    if (organisations.length > 0) {
      if (!Helpers.allBelongTo(organisations, req.user.organisations)) {
        req
          .assert("organisations", "Please enter valid organisations")
          .equals(false);
      }
    }

    // Parse request's body asynchronously
    req
      .asyncValidationErrors()
      .then(function() {
        var newUser = {
          id: null,
          first_name: first_name,
          last_name: last_name,
          email: email,
          class: userClass,
          organisations: organisations
        };
        
        Users.add(newUser, req.user, function(err, user) {
          if (err) {
            req.flash("error_msg", err);
            res.redirect(process.env.PUBLIC_ADDRESS + "/users/view/" + user.id);
          } else {
            req.flash(
              "success_msg",
              "New user added! They have received an email with instructions on how to activate their account."
            );
            res.redirect(process.env.PUBLIC_ADDRESS + "/users/view/" + user.id);
          }
        });
      })
      .catch(function(errors) {
        res.render("users/add", {
          errors: errors,
          title: "Add User",
          usersActive: true,
          first_name: first_name,
          last_name: last_name,
          email: email,
          class: userClass,
          organisations: organisations,
          hideOrganisationSelect: true
        });
      });
  }
);

module.exports = router;
