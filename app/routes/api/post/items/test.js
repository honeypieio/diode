// /api/post/items/test
var router = require("express").Router();
var sanitizeHtml = require("sanitize-html");

var rootDir = process.env.CWD;

var Auth = require(rootDir + "/app/configs/auth");
var Helpers = require(rootDir + "/app/configs/helpful_functions");

var Activity = require(rootDir + "/app/models/activity");
var Categories = require(rootDir + "/app/models/categories");
var Items = require(rootDir + "/app/models/items");

router.post("/:uid", Auth.isLoggedIn, function(req, res) {
  var uid = req.params.uid;
  var test_id = req.body.test;
  var note = sanitizeHtml(req.body.note) || null;
  var outcome = req.body.outcome;

  var response = { status: "fail", msg: "Something went wrong" };

  Items.getByUid(req.params.uid, req.user.categories, function(err, item) {
    if (req.user.organisations.includes(item.organisation_id)) {
      if (!item.status || Object.keys(item.proceduresRequired).length > 0) {
        var procedure =
          item.proceduresRequired[Object.keys(item.proceduresRequired)[0]];

        Helpers.flattenToIds(procedure.tests, "test_id", function(flatTests) {
          if (flatTests.includes(test_id)) {
            var validOutcomes = ["pass", "fail"];
            if (procedure.tests[flatTests.indexOf(test_id)].details.allowNA) {
              validOutcomes.push("na");
            }
            if (validOutcomes.includes(outcome)) {
              Activity.itemTestComplete(
                test_id,
                outcome,
                note,
                uid,
                req.user.id,
                function(err) {
                  if (flatTests.length == 1) {
                    if (outcome == "na") {
                      outcome = "pass";
                    }
                    Activity.itemProcedureComplete(
                      procedure.procedure_id,
                      outcome,
                      uid,
                      req.user.id,
                      function(err) {
                        if (
                          Object.keys(item.proceduresRequired).length == 1 ||
                          outcome == "fail"
                        ) {
                          Activity.itemTestingComplete(
                            outcome,
                            uid,
                            req.user.id,
                            function(err) {}
                          );
                        }
                        response.status = "ok";
                        response.msg = "Procedure complete!";
                        response.nextProcedure = "aye";
                        res.send(response);
                      }
                    );
                  } else if (outcome == "fail") {
                    Activity.itemProcedureComplete(
                      procedure.procedure_id,
                      "fail",
                      uid,
                      req.user.id,
                      function(err) {
                        Activity.itemTestingComplete(
                          "fail",
                          uid,
                          req.user.id,
                          function(err) {
                            response.status = "ok";
                            response.msg = "Procedure complete!";
                            response.nextProcedure = "aye";
                            res.send(response);
                          }
                        );
                      }
                    );
                  } else {
                    response.status = "ok";
                    response.msg = "Test complete!";
                    response.nextTest =
                      procedure.tests[flatTests.indexOf(test_id) + 1];
                    res.send(response);
                  }
                }
              );
            } else {
              response.msg = "Invalid outcome.";
              res.send(response);
            }
          } else {
            response.msg = "Invalid test.";
            res.send(response);
          }
        });
      } else {
        response.msg = "Item has finished testing.";
        res.send(response);
      }
    } else {
      response.msg = "You don't belong to this organisation.";
      res.send(response);
    }
  });
});

module.exports = router;
