// /users/update

var router = require("express").Router();
var async = require("async");

var rootDir = process.env.CWD;

var Users = require(rootDir + "/app/models/users");
var Procedures = require(rootDir + "/app/models/procedures");

var Auth = require(rootDir + "/app/configs/auth");
var Helpers = require(rootDir + "/app/configs/helpful_functions");

router.get("/:user_id", Auth.isLoggedIn, function(req, res) {
  Users.getById(req.params.user_id, function(err, user) {
    if (err || !user[0]) {
      req.flash("error_msg", "User not found!");
      res.redirect("/users");
    } else {
      Users.sanitizeUser(user[0], req.user, function(user) {
        if (user.canUpdate) {
          res.render("users/update", {
            title: "Update User",
            usersActive: true,
            viewedUser: user,
            hideOrganisationSelect: true
          });
        } else {
          req.flash(
            "error_msg",
            "You don't have permission to update this user!"
          );
          res.redirect(
            process.env.PUBLIC_ADDRESS + "/users/view/" + req.params.user_id
          );
        }
      });
    }
  });
});

router.post(
  "/:user_id",
  Auth.isLoggedIn,
  Auth.isOfClass(["global-admin", "local-admin"]),
  function(req, res) {
    Users.getById(req.params.user_id, function(err, user) {
      Users.sanitizeUser(user[0], req.user, function(user) {
        if (user.canUpdate) {
          var first_name = req.body.first_name.trim();
          var last_name = req.body.last_name.trim();
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

          if (organisations.length > 0) {
            if (!Helpers.allBelongTo(organisations, req.user.organisations)) {
              req
                .assert("organisations", "Please enter valid organisations")
                .equals(false);
            } else {
              if (!Array.isArray(organisations)) {
                organisations = [organisations];
              }
            }
          } else {
            organisations = [];
          }

          console.log(organisations);

          // Parse request's body asynchronously
          req
            .asyncValidationErrors()
            .then(function() {
              var updatedUser = {
                user_id: req.params.user_id,
                first_name: first_name,
                last_name: last_name,
                email: user.email,
                class: userClass,
                organisations: organisations
              };

              Users.update(updatedUser, function(err, user) {
                if (err) {
                  req.flash("error_msg", "Something went wrong!");
                  res.redirect(
                    process.env.PUBLIC_ADDRESS +
                      "/users/update/" +
                      req.params.user_id
                  );
                } else {
                  req.flash("success_msg", "User updated!");
                  res.redirect(
                    process.env.PUBLIC_ADDRESS +
                      "/users/view/" +
                      req.params.user_id
                  );
                }
              });
            })
            .catch(function(errors) {
              res.render("users/update", {
                errors: errors,
                title: "Update User",
                usersActive: true,
                viewedUser: updatedUser,
                hideOrganisationSelect: true
              });
            });
        } else {
          req.flash(
            "error_msg",
            "You don't have permission to update this user!"
          );
          res.redirect(process.env.PUBLIC_ADDRESS + "/users/view/" + user.id);
        }
      });
    });
  }
);

module.exports = router;
