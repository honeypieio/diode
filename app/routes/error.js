// /error

var router = require("express").Router();

router.get("/", function(req, res) {
  var layout;
  res.render("error", {
    title: "Error"
  });
});

module.exports = router;
