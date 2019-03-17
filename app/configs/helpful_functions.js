var con = require("../models/index");
var mysql = require("mysql");
var http = require("http");
var async = require("async");
var moment = require("moment");

var Helpers = {};

Helpers.generateIntId = function(length) {
  return Math.floor(
    Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)
  );
};

Helpers.generateBase64Id = function(length) {
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  var result = "";

  for (let i = 0; i < length; i++) {
    result += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return result;
};

Helpers.uniqueIntId = function(length, table, id_name, callback) {
  var query = "SELECT ?? FROM ?? WHERE ?? = ?";
  // Generate ID!
  var id = Helpers.generateIntId(length);

  var inserts = [id_name, table, id_name, id];
  var sql = mysql.format(query, inserts);

  con.query(sql, function(err, result) {
    if (result.length == 1) {
      uniqueIntId(length, table, id_name, callback);
    } else if (result.length == 0) {
      callback(id);
    }
  });
};

Helpers.isNumber = function(number) {
  return !isNaN(number);
};

Helpers.uniqueBase64Id = function(length, table, id_name, callback) {
  var query = "SELECT ?? FROM ?? WHERE ?? = ?";
  // Generate ID!
  var id = Helpers.generateBase64Id(length);

  var inserts = [id_name, table, id_name, id];
  var sql = mysql.format(query, inserts);

  con.query(sql, function(err, result) {
    if (result.length == 1) {
      uniqueBase64Id(length, table, id_name, callback);
    } else if (result.length == 0) {
      callback(id);
    }
  });
};

Helpers.uniqueItemId = function(prefix, organisation_id, callback) {
  var query =
    "SELECT item_id FROM items WHERE item_id = ? AND organisation_id = ?";
  // Generate ID!
  var id = prefix + "-" + Helpers.generateIntId(4);

  var inserts = [id, organisation_id];
  var sql = mysql.format(query, inserts);

  con.query(sql, function(err, result) {
    if (result.length == 1) {
      Helpers.uniqueItemId(prefix, organisation_id);
    } else if (result.length == 0) {
      callback(id);
    }
  });
};

Helpers.plainDate = function(date) {
  return moment(date).format("YYMMDD");
};

Helpers.treeify = function(list, id, callback) {
  var map = {},
    node,
    roots = [];
  for (let i = 0; i < list.length; i += 1) {
    map[list[i][id]] = i; // init map
    list[i].children = []; // create children array
    list[i].path = [];
  }
  for (let i = 0; i < list.length; i += 1) {
    node = list[i];
    if (node.parent !== null) {
      node.path.push(list[map[node.parent]].name);
      if (list[map[node.parent]].parent) {
        node.path.push(list[map[list[map[node.parent]].parent]].name);
      }
      list[map[node.parent]].children.push(node);
    } else {
      roots.push(node);
    }
  }
  callback(roots);
};

Helpers.flattenToIds = function(array, id, callback) {
  var flatArray = [];
  async.each(
    array,
    function(obj, callback) {
      flatArray.push(obj[id]);
      callback();
    },
    function() {
      callback(flatArray);
    }
  );
};

Helpers.flatten = function(array) {
  var result = {};
  array.forEach(function(a) {
    result[a['category_id']] = a;
    if (Array.isArray(a.children)) {
      result = Object.assign(result, Helpers.flatten(a.children));
    }
  });
  return result;
};

module.exports = Helpers;
