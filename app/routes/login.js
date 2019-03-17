// /login

var router = require("express").Router();
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;

var rootDir = process.env.CWD;

var Users = require(rootDir + "/app/models/users");
var Activity = require(rootDir + "/app/models/activity");

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true
    },
    function(req, email, password, done) {
      Users.getByEmail(email, function(err, user) {
        if (err) res.redirect("/error");
        if (!user[0]) {
          return done(null, false, { message: "Account not found!" });
        } else {
          user = user[0];

          Activity.getAllUnsuccessfulActivityThisHour(user.id, function(
            err,
            failedActivity
          ) {
            if (failedActivity.length > 10) {
              return done(null, false, {
                message: "Account locked. Contact your local administrator"
              });
            } else {
              Users.comparePassword(password, user.password, function(
                err,
                isMatch
              ) {
                if (err) res.redirect("/error");
                if (isMatch) {
                  Activity.loginSuccess(
                    user.id,
                    req.headers["x-forwarded-for"] ||
                      req.connection.remoteAddress
                  );
                  return done(null, user);
                } else {
                  Activity.loginFailed(
                    user.id,
                    req.headers["x-forwarded-for"] ||
                      req.connection.remoteAddress
                  );
                  return done(null, false, { message: "Wrong password!" });
                }
              });
            }
          });
        }
      });
    }
  )
);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  Users.getById(id, function(err, user) {
    if (err) {
      return done(null, err);
    }
    done(null, user[0]);
  });
});

router.post(
  "/",
  passport.authenticate("local", {
    failureRedirect: "/login",
    badRequestMessage: "Please enter your details",
    failureFlash: true
  }),
  function(req, res) {
    res.redirect("/account");
  }
);

router.get("/", function(req, res) {
  if (!req.user) {
    res.render("login", {
      loginActive: true,
      title: "Login"
    });
  } else {
    res.redirect(process.env.PUBLIC_ADDRESS + "/");
  }
});

module.exports = router;
