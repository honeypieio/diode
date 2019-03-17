// /organisations
var router = require("express").Router();

var rootDir = process.env.CWD;

var Auth = require(rootDir + "/app/configs/auth");

router.get("/", Auth.isLoggedIn, function(req, res) {
  res.redirect(
    process.env.PUBLIC_ADDRESS +
      "/organisations/manage?organisation=" +
      req.query.organisation
  );
});

router.use("/view", require("./view"));
router.use("/update", require("./update"));

module.exports = router;
