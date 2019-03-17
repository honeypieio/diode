var con = require("./index");
var mysql = require("mysql");
var bcrypt = require("bcrypt-nodejs");
var async = require("async");
var moment = require("moment");
moment.locale("en-gb");

var Helpers = require("../configs/helpful_functions");
var Activity = require("./activity");

var Users = {};

Users.getByUsername = function(username, callback) {
  var query = "SELECT * FROM login WHERE username = ?";
  var inserts = [username];
  var sql = mysql.format(query, inserts);

  con.query(sql, callback);
};

Users.getByUsernameOrEmail = function(email, callback) {
  var query =
    "SELECT * FROM login WHERE (username = ? OR email = ?) AND deactivated = 0";
  var inserts = [email, email];
  var sql = mysql.format(query, inserts);

  con.query(sql, callback);
};

Users.getByEmail = function(email, callback) {
  var query = "SELECT * FROM login WHERE email = ?";
  var inserts = [email];
  var sql = mysql.format(query, inserts);

  con.query(sql, callback);
};

Users.getById = function(id, callback) {
  var query = "SELECT * FROM login WHERE id = ?";
  var inserts = [id];
  var sql = mysql.format(query, inserts);

  con.query(sql, callback);
};

Users.getByOrganisationId = function(loggedInUser, callback) {
  var query = `SELECT * FROM login

  WHERE organisations LIKE ?`;
  var inserts = ["%" + loggedInUser.organisation.organisation_id + "%"];
  var sql = mysql.format(query, inserts);

  con.query(sql, function(err, users) {
    var usersObj = {};
    async.eachOf(
      users,
      function(user, i, callback) {
        Users.sanitizeUser(user, loggedInUser, function(sanitizedUser) {
          users[i] = sanitizedUser;
          usersObj[user.id] = sanitizedUser;
          callback();
        });
      },
      function() {
        callback(err, users, usersObj);
      }
    );
  });
};

Users.addPasswordReset = function(user_id, ip_address, callback) {
  var query =
    "INSERT INTO password_reset (user_id, ip_address, reset_code, date_issued, used) VALUES (?,?,?,?,?)";
  Helpers.uniqueBase64Id(25, "password_reset", "reset_code", function(id) {
    var dt = new Date();
    var inserts = [
      user_id,
      ip_address,
      id,
      new Date(dt.setMonth(dt.getMonth())),
      0
    ];
    var sql = mysql.format(query, inserts);

    con.query(sql);
    Users.getById(user_id, callback);
  });
};

Users.getUnusedPasswordResetsByUserId = function(user_id, callback) {
  var query =
    "SELECT * FROM password_reset WHERE user_id = ? AND used = 0 AND date_issued > (now() - interval 60 minute)";
  var inserts = [user_id];
  var sql = mysql.format(query, inserts);

  con.query(sql, callback);
};

Users.getUnusedPasswordResetsByResetCode = function(reset_code, callback) {
  var query =
    "SELECT * FROM password_reset WHERE reset_code = ? AND used = 0 AND date_issued > (now() - interval 60 minute)";
  var inserts = [reset_code];
  var sql = mysql.format(query, inserts);

  con.query(sql, callback);
};

Users.updateWorkingGroups = function(user_id, working_groups, callback) {
  var query = "UPDATE login SET working_groups = ? WHERE id = ?";
  var inserts = [working_groups, user_id];
  var sql = mysql.format(query, inserts);

  con.query(sql, callback);
};

Users.add = function(user, callback) {
  var query =
    "INSERT INTO login (id, first_name, last_name, username, email, password, class, working_groups) VALUES (?,?,?,?,?,?,?,?)";

  // Generate ID!
  Helpers.uniqueIntId(11, "login", "id", function(id) {
    user.id = id;
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(user.password, salt, null, function(err, hash) {
        user.password = hash.replace(/^\$2y(.+)$/i, "$2a$1");
        var inserts = [
          user.id,
          user.first_name,
          user.last_name,
          user.username,
          user.email,
          user.password,
          user.class,
          user.working_groups
        ];
        var sql = mysql.format(query, inserts);

        con.query(sql);
        Users.getById(user.id, callback);
      });
    });
  });
};

Users.update = function(user, callback) {
  var query =
    "UPDATE login SET first_name = ?, last_name = ?, class = ?, working_groups = ? WHERE id = ?";
  var inserts = [
    user.first_name,
    user.last_name,
    user.class,
    user.working_groups,
    user.user_id
  ];
  var sql = mysql.format(query, inserts);

  con.query(sql, callback);
};

Users.updatePassword = function(user_id, password, callback) {
  var query = "UPDATE login SET password = ? WHERE id = ?";
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password, salt, null, function(err, hash) {
      password = hash.replace(/^\$2y(.+)$/i, "$2a$1");
      var inserts = [password, user_id];
      var sql = mysql.format(query, inserts);

      con.query(sql, callback);
    });
  });
};

Users.deactivate = function(user_id, callback) {
  var query = "UPDATE login SET deactivated = 1 WHERE id = ?";
  var inserts = [user_id];
  var sql = mysql.format(query, inserts);

  con.query(sql, callback);
};

Users.setResetCodeAsUsed = function(reset_code, callback) {
  var query = "UPDATE password_reset SET used = 1 WHERE reset_code = ?";
  var inserts = [reset_code];
  var sql = mysql.format(query, inserts);

  con.query(sql, callback);
};

Users.comparePassword = function(candidatePassword, hash, callback) {
  hash = hash.replace(/^\$2y(.+)$/i, "$2a$1");
  bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    if (err) throw err;
    callback(null, isMatch);
  });
};

Users.sanitizeUser = function(user, loggedInUser, callback) {
  var sanitizedUser = {};
  sanitizedUser.id = user.id;
  sanitizedUser.first_name = user.first_name;
  sanitizedUser.last_name = user.last_name;
  sanitizedUser.name = user.first_name + " " + user.last_name;
  sanitizedUser.email = user.email;
  sanitizedUser.class = user.class;
  sanitizedUser.permissions = JSON.parse(user.permissions);
  sanitizedUser.organisations = JSON.parse(user.organisations);
  callback(sanitizedUser);
};

module.exports = Users;