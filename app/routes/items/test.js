// /items/test
var router = require("express").Router();
var async = require("async");

var rootDir = process.env.CWD;

var Auth = require(rootDir + "/app/configs/auth");
var Helpers = require(rootDir + "/app/configs/helpful_functions");

var Categories = require(rootDir + "/app/models/categories");
var Items = require(rootDir + "/app/models/items");

router.get("/", Auth.isLoggedIn, function(req, res) {
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
        res.render("items/test/root", {
          title: "Select Test Item",
          testItemActive: true,
          items: sanitizedItems
        });
      }
    );
  });
});

router.get("/:uid", Auth.isLoggedIn, function(req, res) {
  Items.getByUid(req.params.uid, req.user.categories, function(err, item) {
    if (item) {
      if (req.user.organisation.organisation_id == item.organisation_id) {
        if (
          item.status == null &&
          Object.keys(item.proceduresRequired).length > 0
        ) {
          if (req.user.permissions.includes(item.nextProcedure)) {
            res.render("items/test/uid", {
              title: "Test Item",
              testItemActive: true,
              item: item,
              hideOrganisationSelect: true
            });
          } else {
            req.flash(
              "success_msg",
              "Procedure complete! You're not yet trained to " +
                req.user.allProcedures[item.nextProcedure].details.name +
                ", so someone else will need to do the next step"
            );
            res.redirect(
              process.env.PUBLIC_ADDRESS + "/items/view/" + item.uid
            );
          }
        } else {
          req.flash("success_msg", "Item has completed testing!");
          res.redirect(process.env.PUBLIC_ADDRESS + "/items/view/" + item.uid);
        }
      } else {
        req.flash("error", "You don't belong to this organisation.");
        res.redirect(process.env.PUBLIC_ADDRESS + "/items/test");
      }
    } else {
      req.flash("error", "Couldn't find that item!.");
      res.redirect(process.env.PUBLIC_ADDRESS + "/items/test");
    }
  });
});

module.exports = router;
