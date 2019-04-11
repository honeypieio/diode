// /recover

var router = require("express").Router();

var rootDir = process.env.CWD;

var Users = require(rootDir + "/app/models/users");

var Mail = require(rootDir + "/app/configs/mail");

router.get("/", function(req, res) {
  res.render("recover", {
    title: "Account Recovery"
  });
});

router.get("/:reset_code", function(req, res) {
  Users.getUnusedPasswordResetsByResetCode(req.params.reset_code, function(
    err,
    resets
  ) {
    if (resets[0]) {
      res.render("reset", {
        title: "Account Recovery",
        reset_code: req.params.reset_code
      });
    } else {
      res.redirect(process.env.PUBLIC_ADDRESS + "/");
    }
  });
});

router.post("/:reset_code", function(req, res) {
  Users.getUnusedPasswordResetsByResetCode(req.params.reset_code, function(
    err,
    resets
  ) {
    if (resets[0]) {
      var password = req.body.password || false;

      req.checkBody("password", "Please enter a password").notEmpty();
      req
        .checkBody(
          "password",
          "Please enter a shorter password (<= 255 characters)"
        )
        .isLength({ max: 255 });

      if (req.body.password) {
        req
          .assert("passwordConfirm", "Passwords do not match")
          .equals(req.body.passwordConfirm);
      }

      if (!password.match(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/)) {
        req
          .assert(
            "password",
            "Please enter a password that meets the requirements!"
          )
          .equals(false);
      }

      req
        .asyncValidationErrors()
        .then(function() {
          Users.updatePassword(resets[0].user_id, password, function(err) {
            if (err) {
              console.log(err);
              req.flash("error_msg", "Something went wrong!");
              res.redirect(
                process.env.PUBLIC_ADDRESS + "/recover/" + resets[0].reset_code
              );
            } else {
              Users.setResetCodeAsUsed(resets[0].reset_code, function(err) {
                if (err) {
                  req.flash("error_msg", "Something went wrong!");
                  res.redirect(
                    process.env.PUBLIC_ADDRESS +
                      "/recover/" +
                      resets[0].reset_code
                  );
                } else {
                  req.flash("success_msg", "Password reset!");
                  res.redirect(process.env.PUBLIC_ADDRESS + "/login");
                }
              });
            }
          });
        })
        .catch(function(errors) {
          res.render("reset", {
            errors: errors,
            title: "Account Recovery",
            reset_code: req.params.reset_code
          });
        });
    } else {
      res.redirect(process.env.PUBLIC_ADDRESS + "/");
    }
  });
});

router.post("/", function(req, res) {
  var email = req.body.email;
  req.checkBody("email", "Please enter your email address").notEmpty();

  req
    .asyncValidationErrors()
    .then(function() {
      Users.getByEmail(email, function(err, user) {
        if (err || !user[0]) {
          req.flash("error_msg", "Email not recognised!");
          res.redirect(process.env.PUBLIC_ADDRESS + "/recover");
        } else {
          Users.getUnusedPasswordResetsByUserId(user[0].id, function(
            err,
            resets
          ) {
            if (resets.length <= 5) {
              Users.addPasswordReset(
                user[0].id,
                req.headers["x-forwarded-for"] || req.connection.remoteAddress,
                function(err, token) {
                  if (err) {
                    console.log(err);
                    req.flash("error_msg", "Something went wrong!");
                    res.redirect(process.env.PUBLIC_ADDRESS + "/recover");
                  } else {
                    var subject = "Account Recovery";
                    var html =
                      "<p>Hi " +
                      user[0].first_name +
                      ",</p>" +
                      "<p>Follow the link below to to recover your account. The link will expire in 60 minutes." +
                      "<p>" +
                      process.env.PUBLIC_ADDRESS +
                      "/recover/" +
                      token +
                      "</p>";
                    Mail.sendUsers(
                      user[0].first_name,
                      user[0].last_name,
                      user[0].email,
                      subject,
                      html,
                      function(err) {
                        if (err) {
                          req.flash(
                            "error_msg",
                            'Something went wrong sending you your recovery link, please <a href="' +
                              process.env.PUBLIC_ADDRESS +
                              '/support">contact support</a>'
                          );
                          res.redirect(process.env.PUBLIC_ADDRESS + "/recover");
                        } else {
                          req.flash(
                            "success_msg",
                            "An email with recovery instructions has been sent!"
                          );
                          res.redirect(process.env.PUBLIC_ADDRESS + "/recover");
                        }
                      }
                    );
                  }
                }
              );
            } else {
              req.flash(
                "error_msg",
                "You've tried to reset your password too many times! Please wait 60 minutes and try again."
              );
              res.redirect(process.env.PUBLIC_ADDRESS + "/recover");
            }
          });
        }
      });
    })
    .catch(function(errors) {
      res.render("recover", {
        errors: errors
      });
    });
});

module.exports = router;
