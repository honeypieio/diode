var con = require("./index");
var mysql = require("mysql");
var async = require("async");

var rootDir = process.env.CWD;

var Helpers = require(rootDir + "/app/configs/helpful_functions");
var Activity = require(rootDir + "/app/models/activity");
var Tests = require(rootDir + "/app/models/tests");
var Procedures = require(rootDir + "/app/models/procedures");

var Categories = {};

Categories.getAll = function(callback) {
  Procedures.getAll(function(err, allProcedures) {
    Tests.getAll(function(err, allTests, allTestsByParent) {
      var query = "SELECT * FROM categories ORDER BY name ASC";
      con.query(query, function(err, categories) {
        var categoriesObj = {};
        async.each(
          categories,
          function(category, callback) {
            if (category.additionalInfo) {
              category.additionalInfo = JSON.parse(category.additionalInfo);
            } else {
              category.additionalInfo = [];
            }

            if (category.procedures) {
              category.procedures = JSON.parse(category.procedures);
            } else {
              category.procedures = [];
            }

            category.proceduresObj = {};

            async.each(
              category.procedures,
              function(procedure, callback) {
                if (allProcedures[procedure]) {
                  category.proceduresObj[procedure] = allProcedures[procedure];

                  category.proceduresObj[procedure].tests =
                    allTestsByParent[procedure] || [];

                  callback();
                } else {
                  callback();
                }
              },
              function() {
                categoriesObj[category.category_id] = category;
                callback();
              }
            );
          },
          function() {
            callback(err, categories, categoriesObj, allProcedures);
          }
        );
      });
    });
  });
};

Categories.getById = function(category_id, callback) {
  Categories.getAll(function(err, categories) {
    Helpers.treeify(categories, "category_id", function(tree) {
      var category = Helpers.flatten(tree, "category_id")[category_id];
      if (category) {
        category.path.reverse();
      }
      callback(err, category);
    });
  });
};

module.exports = Categories;
