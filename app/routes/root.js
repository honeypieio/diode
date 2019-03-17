// /
var router = require("express").Router();

router.get("/", function(req, res) {
  if (req.user) {
    res.redirect("/account");
  } else {
    res.redirect("/login");
  }
});

router.use("/error", require("./error"));
router.use("/support", require("./support"));
router.use("/login", require("./login"));
router.use("/recover", require("./recover"));
router.use("/logout", require("./logout"));
router.use("/account", require("./account"));

router.get("*", function(req, res) {
  res.render("error", {
    title: "Page Not Found",
    notFound: true
  });
});

module.exports = router;
