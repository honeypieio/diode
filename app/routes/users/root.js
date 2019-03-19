// /users

var router = require("express").Router();
var async = require("async");

var rootDir = process.env.CWD;

var Users = require(rootDir + "/app/models/users");

var Auth = require(rootDir + "/app/configs/auth");

router.get("/", Auth.isLoggedIn, function(req, res) {
  Users.getByOrganisationId(req.user, function(err, usersArray, users) {
    res.render("users/root", {
      title: "Users",
      users: users,
      usersActive: true
    });
  });
});

router.use("/add", require("./add"));
router.use("/view", require("./view"));
router.use("/training", require("./training"));

module.exports = router;
