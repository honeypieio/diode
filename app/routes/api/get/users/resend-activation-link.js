// /api/get/users/resend-activation-link

var router = require("express").Router();

var rootDir = process.env.CWD;

var Users = require(rootDir + "/app/models/users");
var UserInvites = require(rootDir + "/app/models/user-invites");

var Helpers = require(rootDir + "/app/configs/helpful_functions");
var Auth = require(rootDir + "/app/configs/auth");

router.get(
  "/:user_id",
  Auth.isLoggedIn,
  Auth.isOfClass(["global-admin", "local-admin"]),
  function(req, res) {
    Users.getById(req.params.user_id, function(err, user) {
      if (!err && user[0]) {
        user = user[0];
        if (
          req.user.class == "global-admin" ||
          (req.user.class == "local-admin" &&
            Helpers.hasOneInCommon(
              req.user.organisations,
              JSON.parse(user.organisations)
            ))
        ) {
          UserInvites.getByUserId(req.params.user_id, function(err, tokens) {
            if (tokens.length <= 5) {
              UserInvites.create(req.user, user, function(err) {
                if (!err) {
                  req.flash(
                    "success_msg",
                    "A new activation link has been issued!"
                  );
                  res.redirect(
                    process.env.PUBLIC_ADDRESS +
                      "/users/view/" +
                      req.params.user_id
                  );
                } else {
                  req.flash("error_msg", "Something went wrong!");
                  res.redirect(
                    process.env.PUBLIC_ADDRESS +
                      "/users/view/" +
                      req.params.user_id
                  );
                }
              });
            } else {
              req.flash(
                "error_msg",
                "Too many activation links have been issued - please wait 24 hours and try again."
              );
              res.redirect(
                process.env.PUBLIC_ADDRESS + "/users/view/" + req.params.user_id
              );
            }
          });
        } else {
          req.flash("error_msg", "You don't have permission!");
          res.redirect(process.env.PUBLIC_ADDRESS + "/users");
        }
      } else {
        req.flash("error_msg", "Couldn't find user!");
        res.redirect(process.env.PUBLIC_ADDRESS + "/users");
      }
    });
  }
);

module.exports = router;
