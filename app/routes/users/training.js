// /users/training

var router = require("express").Router();
var async = require("async");

var rootDir = process.env.CWD;

var Users = require(rootDir + "/app/models/users");
var Procedures = require(rootDir + "/app/models/procedures");

var Auth = require(rootDir + "/app/configs/auth");
var Helpers = require(rootDir + "/app/configs/helpful_functions");

router.get(
  "/:user_id",
  Auth.isLoggedIn,
  Auth.isOfClass(["global-admin", "local-admin"]),
  function(req, res) {
    Users.getById(req.params.user_id, function(err, user) {
      Procedures.getAll(function(err, procedures) {
        if (err || !user[0]) {
          req.flash("error_msg", "User not found!");
          res.redirect("/users");
        } else {
          Users.sanitizeUser(user[0], req.user, function(user) {
            res.render("users/training", {
              title: "Update Training",
              usersActive: true,
              viewedUser: user,
              allProcedures: procedures,
              hideOrganisationSelect: true
            });
          });
        }
      });
    });
  }
);

router.post(
  "/:user_id",
  Auth.isLoggedIn,
  Auth.isOfClass(["global-admin", "local-admin"]),
  function(req, res) {
    
    Users.getById(req.params.user_id, function(err, user) {
      if (err || !user[0] || user[0].deactivated) {
        req.flash("error_msg", "Something went wrong, please try again!");
        res.redirect(
          process.env.PUBLIC_ADDRESS + "/users/view/" + req.params.user_id
        );
      } else {
        user = user[0];
        var training = req.body.training || [];
        if (!Array.isArray(training)) {
          training = [training];
        }

        if (req.body.verification == "on") {
          Procedures.getAll(function(err, allProcedures) {
            Helpers.flattenToIds(allProcedures, "procedure_id", function(
              flatProcedures
            ) {
              if (Helpers.allBelongTo(training, flatProcedures)) {
                training = [...new Set(training)];

                Users.updateTraining(
                  req.user,
                  user.id,
                  JSON.parse(user.permissions) || [],
                  training || [],
                  function() {
                    req.flash("success_msg", "Training updated!");
                    res.redirect(
                      process.env.PUBLIC_ADDRESS + "/users/view/" + user.id
                    );
                  }
                );
              } else {
                req.flash("error_msg", "Please select valid procedures");
                res.redirect(
                  process.env.PUBLIC_ADDRESS + "/users/training/" + user.id
                );
              }
            });
          });
        } else {
          req.flash("error_msg", "Please tick the confirmation box");
          res.redirect(
            process.env.PUBLIC_ADDRESS + "/users/training/" + user.id
          );
        }
      }
    });
  }
);

module.exports = router;
