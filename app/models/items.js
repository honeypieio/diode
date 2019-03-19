var con = require("./index");
var mysql = require("mysql");
var async = require("async");

var Helpers = require("../configs/helpful_functions");
var Activity = require("./activity");

var Items = {};

Items.sanitize = function(item, activity, categories, callback) {
  try {
    item.details = JSON.parse(item.details);
  } catch (err) {
    item.details = {};
  }

  if (item.details.image) {
    item.image = item.details.image;
    delete item.details.image;
  }

  item.status = null;
  item.proceduresRequired = JSON.parse(
    JSON.stringify(categories[item.category_id].proceduresObj)
  );

  item.nextProcedure = null;

  async.each(
    activity,
    function(event, callback) {
      if (event.action == "testing_complete") {
        item.proceduresRequired = {};
        item.status = event.info.outcome;
        callback();
      } else if (event.action == "procedure_complete") {
        if (event.info.outcome == "pass") {
          delete item.proceduresRequired[event.info.procedure_id];
        } else if (event.info.outcome == "fail") {
          item.proceduresRequired = {};
          item.status = "fail";
        }

        callback();
      } else if (event.action == "test_complete") {
        if (event.info.outcome == "fail") {
          item.status = "fail";
          callback();
        } else {
          async.each(
            item.proceduresRequired,
            function(procedure, callback) {
              async.each(
                procedure.tests,
                function(test, callback) {
                  if (
                    item.proceduresRequired[
                      procedure.procedure_id
                    ].tests.indexOf(test) >= 0 &&
                    event.info.test_id == test.test_id
                  ) {
                    item.proceduresRequired[
                      procedure.procedure_id
                    ].tests.splice(
                      item.proceduresRequired[
                        procedure.procedure_id
                      ].tests.indexOf(test),
                      1
                    );

                    callback();
                  } else {
                    callback();
                  }
                },
                function() {
                  callback();
                }
              );
            },
            function() {
              callback();
            }
          );
        }
      } else {
        callback();
      }
    },
    function() {
      if (
        item.status == null &&
        Object.keys(item.proceduresRequired).length == 0
      ) {
        item.status = "pass";
      }
      try {
        item.nextProcedure = Object.keys(item.proceduresRequired)[0];
      } catch (err) {}

      callback(item);
    }
  );
};

Items.create = function(item, user, category, callback) {
  var query =
    "INSERT INTO items (uid, item_id, category_id, organisation_id, details) VALUES (?, ?, ?, ?, ?)";
  Helpers.uniqueBase64Id(25, "items", "uid", function(uid) {
    Helpers.uniqueItemId(
      Helpers.plainDate(new Date()) + "-" + category.abbreviation,
      user.organisation.organisation_id,
      function(item_id) {
        var inserts = [
          uid,
          item_id,
          category.category_id,
          user.organisation.organisation_id,
          JSON.stringify(item)
        ];
        var sql = mysql.format(query, inserts);
        con.query(sql, function(err) {
          item.item_id = item_id;
          item.uid = uid;
          callback(err, item);
          Activity.itemRegistered(uid, user.id, function() {});
        });
      }
    );
  });
};

Items.getAll = function(user, callback) {
  Activity.getAllItemActivity(function(err, activityArray, activityByUid) {
    var query =
      "SELECT * FROM items LEFT JOIN (SELECT uid activity_uid, MAX(timestamp) lastUpdated FROM item_activity GROUP BY uid) activity ON items.uid=activity.activity_uid ORDER BY lastUpdated ASC";

    con.query(query, function(err, items) {
      if (!err && items) {
        var sanitizedItems = {};
        async.eachOf(
          items,
          function(item, i, callback) {
            if (user.organisations.includes(item.organisation_id)) {
              if (
                user.organisation == null ||
                user.organisation.organisation_id == item.organisation_id
              ) {
                Items.sanitize(
                  item,
                  activityByUid[item.uid] || [],
                  user.categories,
                  function(sanitizedItem) {
                    sanitizedItems[item.uid] = sanitizedItem;
                    callback();
                  }
                );
              } else {
                callback();
              }
            } else {
              callback();
            }
          },
          function() {
            callback(null, sanitizedItems);
          }
        );
      }
    });
  });
};

Items.getAllByOrganisationId = function(user, callback) {
  var query = "SELECT * FROM items WHERE organisation_id = ?";
  var inserts = [user.organisation.organisation_id];
  var sql = mysql.format(query, inserts);
  con.query(sql, callback);
};

Items.getByUid = function(uid, categories, callback) {
  var query = "SELECT * FROM items WHERE uid = ?";
  var inserts = [uid];
  var sql = mysql.format(query, inserts);
  con.query(sql, function(err, item) {
    if (item[0]) {
      Activity.getItemActivityByUid(item[0].uid, function(err, activity) {
        Items.sanitize(item[0], activity, categories, function(sanitizedItem) {
          callback(err, sanitizedItem, activity);
        });
      });
    } else {
      callback(err, null);
    }
  });
};

module.exports = Items;
