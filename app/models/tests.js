var con = require("./index");
var mysql = require("mysql");
var async = require("async");

var Helpers = require("../configs/helpful_functions");
var Activity = require("./activity");

var Tests = {};

Tests.getAll = function(callback) {
  var query = "SELECT * FROM tests ORDER BY weight ASC";
  con.query(query, function(err, tests) {
    var testsObj = {};
    var testsParentObj = {};
    async.each(
      tests,
      function(test, callback) {
        test.details = JSON.parse(test.details);
        testsObj[test.test_id] = test;
        try {
          testsParentObj[test.procedure_id].push(test);
        } catch (err) {
          testsParentObj[test.procedure_id] = [test];
        }
        callback();
      },
      function() {
        callback(err, testsObj, testsParentObj);
      }
    );
  });
};

module.exports = Tests;
