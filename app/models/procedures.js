var con = require("./index");
var mysql = require("mysql");
var async = require("async");

var Helpers = require("../configs/helpful_functions");
var Activity = require("./activity");

var Procedures = {};

Procedures.getAll = function(callback) {
  var query = "SELECT * FROM procedures";
  con.query(query, function(err, procedures) {
    var proceduresObj = {};
    async.each(
      procedures,
      function(procedure, callback) {
        procedure.details = JSON.parse(procedure.details);
        proceduresObj[procedure.procedure_id] = procedure;
        callback();
      },
      function() {
        callback(err, proceduresObj);
      }
    );
  });
};

module.exports = Procedures;
