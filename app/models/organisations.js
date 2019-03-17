var con = require("./index");
var mysql = require("mysql");
var async = require("async");

var Helpers = require("../configs/helpful_functions");
var Activity = require("./activity");

var Organisations = {};

Organisations.getAll = function(callback) {
  var query = "SELECT * FROM organisations";
  con.query(query, function(err, organisations) {
    if (!err && organisations) {
      var organisationsObj = {};
      async.each(
        organisations,
        function(organisation, callback) {
          organisation.details = JSON.parse(organisation.details);
          organisationsObj[organisation.organisation_id] = organisation;
          callback();
        },
        function() {
          callback(err, organisationsObj);
        }
      );
    } else {
      callback(err, organisations);
    }
  });
};

Organisations.getById = function(organisation_id, callback) {
  var query = "SELECT * FROM organisations WHERE organisation_id = ?";
  var inserts = [organisation_id];
  var sql = mysql.format(query, inserts);
  con.query(sql, callback)
}

module.exports = Organisations;
