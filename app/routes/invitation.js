// /invitation

var router = require("express").Router();
var moment = require("moment");

var rootDir = process.env.CWD;

var Users = require(rootDir + "/app/models/users");
var UserInvites = require(rootDir + "/app/models/user-invites");

var Mail = require(rootDir + "/app/configs/mail");

router.get("/", function(req, res) {
  if (req.query.token && !req.user) {
    UserInvites.getByToken(req.query.token, function(err, invite) {
      if (invite && !err) {
        if (
          invite.used == 0 &&
          moment(invite.timestamp).isBefore(
            moment(invite.timestamp).add(24, "hours")
          )
        ) {
          Users.getById(invite.user_id, function(err, user) {
            user = user[0];
            delete user.password;
            res.render("invitation", {
              title: "Activate Your Account",
              viewedUser: user,
              token: invite.token,
              hideOrganisationSelect: true
            });
          });
        } else {
          res.render("error", {
            title: "Invalid Token",
            message:
              "Your invitation has either expired or been used. Contact your local admin for a new one!"
          });
        }
      } else {
        res.render("error", {
          title: "Invalid Token",
          message:
            "Your invitation has either expired or been used. Contact your local admin for a new one!"
        });
      }
    });
  } else {
    res.redirect(process.env.PUBLIC_ADDRESS);
  }
});

router.post("/", function(req, res) {
  if (req.query.token && !req.user) {
    UserInvites.getByToken(req.query.token, function(err, invite) {
      if (invite && !err) {
        if (
          invite.used == 0 &&
          moment().isBefore(moment(invite.timestamp).add(24, "hours"))
        ) {
          var password = req.body.password;
          var passwordConfirm = req.body.passwordConfirm;
          if (password) {
            if (passwordConfirm) {
              if (password == passwordConfirm) {
                if (
                  password.match(
                    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/
                  )
                ) {
                  Users.updatePassword(invite.user_id, password, function(err) {
                    UserInvites.markAsUsed(invite, function(err) {
                      req.flash(
                        "success_msg",
                        "Account activated! You can now login."
                      );
                      res.redirect(process.env.PUBLIC_ADDRESS + "/login");
                    });
                  });
                } else {
                  req.flash(
                    "error_msg",
                    "Please enter a password that meets the requirements!"
                  );
                  res.redirect(
                    process.env.PUBLIC_ADDRESS +
                      "/invitation?token=" +
                      req.query.token
                  );
                }
              } else {
                req.flash("error_msg", "Passwords don't match!");
                res.redirect(
                  process.env.PUBLIC_ADDRESS +
                    "/invitation?token=" +
                    req.query.token
                );
              }
            } else {
              req.flash("error_msg", "Please confirm your password.");
              res.redirect(
                process.env.PUBLIC_ADDRESS +
                  "/invitation?token=" +
                  req.query.token
              );
            }
          } else {
            req.flash("error_msg", "Please enter a password.");
            res.redirect(
              process.env.PUBLIC_ADDRESS +
                "/invitation?token=" +
                req.query.token
            );
          }
        } else {
          res.render("error", {
            title: "Invalid Token",
            message:
              "Your invitation has either expired or been used. Contact your local admin for a new one!"
          });
        }
      } else {
        res.render("error", {
          title: "Invalid Token",
          message:
            "Your invitation has either expired or been used. Contact your local admin for a new one!"
        });
      }
    });
  } else {
    res.redirect(process.env.PUBLIC_ADDRESS);
  }
});

module.exports = router;
