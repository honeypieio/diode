var con = require("./index");
var mysql = require("mysql");
var async = require("async");
var moment = require("moment");

var Activity = {};

Activity.loginFailed = function(user_id, ip_address) {
  var query =
    "INSERT INTO user_activity (timestamp, user_id, action, info) VALUES (?,?,?,?)";

  var inserts = [
    new Date(),
    user_id,
    "login",
    JSON.stringify({ success: false, ip_address: ip_address })
  ];
  var sql = mysql.format(query, inserts);

  con.query(sql);
};

Activity.loginSuccess = function(user_id, ip_address) {
  var query =
    "INSERT INTO user_activity (timestamp, user_id, action, info) VALUES (?,?,?,?)";

  var inserts = [
    new Date(),
    user_id,
    "login",
    JSON.stringify({ success: true, ip_address: ip_address })
  ];
  var sql = mysql.format(query, inserts);

  con.query(sql);
};

Activity.itemRegistered = function(uid, user_id, callback) {
  var query =
    "INSERT INTO item_activity (timestamp, uid, user_id, action, info) VALUES (?,?,?,?,?)";

  var inserts = [new Date(), uid, user_id, "register", JSON.stringify({})];
  var sql = mysql.format(query, inserts);

  con.query(sql);
};

Activity.itemTested = function(uid, user_id, test, callback) {
  var query =
    "INSERT INTO item_activity (timestamp, uid, user_id, action, info) VALUES (?,?,?,?,?)";

  var inserts = [
    new Date(),
    uid,
    user_id,
    "tested",
    JSON.stringify({ test: test.test_id, status: test.status })
  ];
  var sql = mysql.format(query, inserts);

  con.query(sql);
};

Activity.itemTestComplete = function(
  test_id,
  outcome,
  note,
  uid,
  user_id,
  callback
) {
  var query =
    "INSERT INTO item_activity (timestamp, uid, user_id, action, info) VALUES (?,?,?,?,?)";

  var inserts = [
    new Date(),
    uid,
    user_id,
    "test_complete",
    JSON.stringify({ test_id: test_id, outcome: outcome, note: note || null })
  ];
  var sql = mysql.format(query, inserts);

  con.query(sql, callback);
};

Activity.itemProcedureComplete = function(
  procedure_id,
  outcome,
  uid,
  user_id,
  callback
) {
  var query =
    "INSERT INTO item_activity (timestamp, uid, user_id, action, info) VALUES (?,?,?,?,?)";

  var inserts = [
    new Date(),
    uid,
    user_id,
    "procedure_complete",
    JSON.stringify({ procedure_id: procedure_id, outcome: outcome })
  ];
  var sql = mysql.format(query, inserts);

  con.query(sql, callback);
};

Activity.itemTestingComplete = function(outcome, uid, user_id, callback) {
  var query =
    "INSERT INTO item_activity (timestamp, uid, user_id, action, info) VALUES (?,?,?,?,?)";
  var inserts = [
    moment()
      .add(2, "seconds")
      .format("YYYY-MM-DD HH:mm:ss"),
    uid,
    user_id,
    "testing_complete",
    JSON.stringify({ outcome: outcome })
  ];
  var sql = mysql.format(query, inserts);

  con.query(sql, callback);
};

Activity.getItemActivityByUid = function(uid, callback) {
  var query =
    "SELECT * FROM item_activity WHERE uid = ? ORDER BY `timestamp` DESC, action ASC";

  var inserts = [uid];
  var sql = mysql.format(query, inserts);

  con.query(sql, function(err, events) {
    async.each(
      events,
      function(event, callback) {
        event.info = JSON.parse(event.info);
        callback();
      },
      function() {
        callback(err, events);
      }
    );
  });
};

Activity.getAllItemActivity = function(callback) {
  var query = "SELECT * FROM item_activity ORDER BY `timestamp` DESC";

  con.query(query, function(err, events) {
    activityByUid = {};
    async.each(
      events,
      function(event, callback) {
        event.info = JSON.parse(event.info);

        try {
          activityByUid[event.uid].push(event);
        } catch (err) {
          activityByUid[event.uid] = [event];
        }

        callback();
      },
      function() {
        callback(err, events, activityByUid);
      }
    );
  });
};

Activity.getLastLogin = function(user_id, callback) {
  var query =
    "SELECT login_timestamp FROM Activity WHERE user_id = ? AND outcome = 1 ORDER BY login_timestamp DESC LIMIT 1";

  var inserts = [user_id];
  var sql = mysql.format(query, inserts);

  con.query(sql, callback);
};

Activity.getAllUnsuccessfulActivityThisHour = function(user_id, callback) {
  var query = `SELECT * FROM user_activity WHERE action = 'login' AND info LIKE '%{"success":false%' AND user_id = ? AND timestamp > (now() - interval 60 minute)`;

  var inserts = [user_id];
  var sql = mysql.format(query, inserts);

  con.query(sql, callback);
};

module.exports = Activity;
