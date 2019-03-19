var con = require("./index");
var mysql = require("mysql");

var Helpers = require("../configs/helpful_functions");
var Mail = require("../configs/mail");

var Activity = require("./activity");

var UserInvites = {};

UserInvites.create = function(loggedInUser, user, callback) {
  var query =
    "INSERT INTO user_invites (token, user_id, timestamp, used) VALUES (?,?,?,?)";
  Helpers.uniqueBase64Id(50, "user_invites", "token", function(token) {
    var inserts = [token, user.id, new Date(), 0];
    var sql = mysql.format(query, inserts);
    con.query(sql, function(err) {
      if (!err) {
        Mail.sendInvite(
          user.first_name,
          user.last_name,
          user.email,
          token,
          function(err) {
            
            Activity.userInvited(loggedInUser, user.id, function(err) {
              
              callback(null, { id: user.id });
            });
          }
        );
      } else {
        
        callback(
          "Something went wrong - please use the account recovery button!",
          { id: user.id }
        );
      }
    });
  });
};

UserInvites.getByToken = function(token, callback) {
  var query = "SELECT * FROM user_invites WHERE token = ?";
  var inserts = [token];
  var sql = mysql.format(query, inserts);

  con.query(sql, function(err, invite) {
    if (!err && invite[0]) {
      callback(null, invite[0]);
    } else {
      callback(err, null);
    }
  });
};

UserInvites.markAsUsed = function(invite, callback) {
  var query = "UPDATE user_invites SET used = 1 WHERE token = ?";
  var inserts = [invite.token];
  var sql = mysql.format(query, inserts);

  con.query(sql, function(err) {
    Activity.userAccountActivated(invite.user_id, function(err) {
      callback(null);
    });
  });
};

module.exports = UserInvites;
