// /users

var router = require("express").Router();
var async = require("async");

var rootDir = process.env.CWD;

var Users = require(rootDir + "/app/models/users");

var Auth = require(rootDir + "/app/configs/auth");

router.get("/", Auth.isLoggedIn, function(req, res) {
  Users.getAll(function(err, users) {
    res.render("users/all", {
      title: "Users",
      users: users,
      usersActive: true
    });
  });
});

router.use("/add", require("./add"));
router.use("/manage", require("./manage"));
router.use("/deactivate", require("./deactivate"));
router.use("/change-password", require("./change-password"));

module.exports = router;
