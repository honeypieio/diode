// /account

var router = require("express").Router();
var async = require("async");

var rootDir = process.env.CWD;

var Items = require(rootDir + "/app/models/items");

var Auth = require(rootDir + "/app/configs/auth");

router.get("/", function(req, res) {
  req.user.organisation = null;
  Items.getAll(req.user, function(err, items) {
    var sanitizedItems = [];
    async.each(
      items,
      function(item, callback) {
        if (
          item.status == null &&
          req.user.permissions.includes(item.nextProcedure)
        ) {
          sanitizedItems.push(item);
        }
        callback();
      },
      function() {
        res.render("account", {
          title: "My Account",
          accountActive: true,
          hideOrganisationSelect: true,
          items: sanitizedItems
        });
      }
    );
  });
});

module.exports = router;
