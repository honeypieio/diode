// /users/view

var router = require("express").Router();
var async = require("async");

var rootDir = process.env.CWD;

var Users = require(rootDir + "/app/models/users");
var Procedures = require(rootDir + "/app/models/procedures");

var Auth = require(rootDir + "/app/configs/auth");

router.get("/:user_id", Auth.isLoggedIn, function(req, res) {
  Users.getById(req.params.user_id, function(err, user) {
    Procedures.getAll(function(err, procedures) {
      if (err || !user[0]) {
        req.flash("error_msg", "User not found!");
        res.redirect("/users");
      } else {
        Users.sanitizeUser(user[0], req.user, function(user) {
          res.render("users/view", {
            title: "View User",
            usersActive: true,
            viewedUser: user,
            allProcedures: procedures,
            hideOrganisationSelect: true
          });
        });
      }
    });
  });
});

router.post("/:user_id", Auth.isLoggedIn, Auth.isOfClass(["admin"]), function(
  req,
  res
) {
  Users.getById(req.params.user_id, function(err, user) {
    if (err || !user[0] || user[0].deactivated) {
      req.flash("error_msg", "Something went wrong, please try again!");
      res.redirect("/users/update/" + req.params.user_id);
    } else {
      var first_name = req.body.first_name.trim();
      var last_name = req.body.last_name.trim();
      var userClass = req.body.class;
      var working_groups = [];

      if (req.body.working_groups) {
        working_groups = JSON.parse(req.body.working_groups);
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

      var admin = 0;
      var volunteer = 0;

      if (!["admin", "till"].includes(userClass)) {
        userClass = "till";
      }

      // Parse request's body
      var errors = req.validationErrors();
      if (errors) {
        req.flash("error_msg", "Something went wrong!");
        res.redirect("/users/update/" + req.params.user_id);
      } else {
        var formattedWorkingGroups = [];

        WorkingGroups.getAll(function(err, allWorkingGroups) {
          async.eachOf(
            working_groups,
            function(working_group, key, callback) {
              if (allWorkingGroups[key]) {
                formattedWorkingGroups.push(key);
              }
              callback();
            },
            function(err) {
              var updatedUser = {
                user_id: req.params.user_id,
                first_name: first_name,
                last_name: last_name,
                class: userClass,
                working_groups: JSON.stringify(formattedWorkingGroups.sort())
              };

              Users.update(updatedUser, function(err, user) {
                if (err) throw err;

                req.flash("success_msg", "User updated!");
                res.redirect("/users/update/" + req.params.user_id);
              });
            }
          );
        });
      }
    }
  });
});

module.exports = router;
