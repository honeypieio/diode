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
  con.query(sql, function(err, organisation) {
    if (organisation[0]) {
      organisation[0].details = JSON.parse(organisation[0].details);
      callback(err, organisation[0]);
    } else {
      callback(err, null);
    }
  });
};

Organisations.update = function(organisation, callback) {
  var query = "UPDATE organisations SET details = ? WHERE organisation_id = ?";
  var inserts = [
    JSON.stringify(organisation.details),
    organisation.organisation_id
  ];
  var sql = mysql.format(query, inserts);
  con.query(sql, callback);
};

Organisations.add = function(organisation, callback) {
  var query =
    "INSERT INTO organisations (organisation_id, details, preferences) VALUES (?,?,?)";
  Helpers.uniqueBase64Id(12, "organisations", "organisation_id", function(
    organisation_id
  ) {
    var inserts = [organisation_id, JSON.stringify(organisation.details), "{}"];
    var sql = mysql.format(query, inserts);
    con.query(sql, function(err) {
      callback(err, organisation_id);
    });
  });
};

module.exports = Organisations;
