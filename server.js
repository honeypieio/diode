// Load environment variables
require("dotenv").config();

// Import resources
var express = require("express");
var cors = require("cors");
var app = express();
var bodyParser = require("body-parser");
var flash = require("connect-flash");
var hbs = require("express-handlebars");
var path = require("path");
var session = require("cookie-session");
var passport = require("passport");
var cookieParser = require("cookie-parser");
var back = require("express-back");
var validator = require("express-validator");
var async = require("async");

if (process.env.NODE_ENV != "development") {
  process.on("uncaughtException", function(err) {
    console.error(err);
    console.log("Exception caught");
  });
}

var Users = require("./app/models/users");
var Organisations = require("./app/models/organisations");
var Categories = require("./app/models/categories");

// Setup Handlebars
app.set("views", path.join(__dirname, "app/views"));
app.engine(
  "hbs",
  hbs({
    layoutsDir: path.join(__dirname, "app/views/layouts"),
    partialsDir: path.join(__dirname, "app/views/partials"),
    defaultLayout: "layout",
    extname: ".hbs",
    helpers: require("./app/configs/hbs_helpers.js").helpers
  })
);
app.set("view engine", "hbs");

// Overwrite default date formatter (broken in current version of node)
Date.prototype.toLocaleDateString = function() {
  return `${this.getDate()}/${this.getMonth() + 1}/${this.getFullYear()}`;
};

String.prototype.toProperCase = function() {
  return this.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

process.env.NODE_ENV = process.env.NODE_ENV || "development";

// Define port (if not already)
var port = process.env.PORT || 3000;

// Define public (static) directory
app.use(express.static("app/public"));

app.use(cors());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    cookie: {
      path: "/",
      httpOnly: true
    },
    name: "diode_biscuit"
  })
);

app.use(back());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
// Express Validator
app.use(
  validator({
    customValidators: {
      isEmailAvailable: function(email) {
        return new Promise(function(resolve, reject) {
          Users.getByEmail(email, function(err, results) {
            if (results.length == 0) {
              return resolve();
            } else {
              return reject();
            }
          });
        });
      }
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Connect Flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.public_address = process.env.PUBLIC_ADDRESS;
  if (req.query.sidebar == "closed") {
    res.locals.sidebarClosed = true;
  }
  if (req.user) {
    if (req.user.deactivated == 1) {
      res.locals.user = null;
      req.logout();
      req.session = null;
      next();
    } else {
      if (req.user.class == "local-admin") {
        req.user.humanClass = "local admin";
      } else if (req.user.class == "global-admin") {
        req.user.humanClass = "global admin";
      } else {
        req.user.humanClass = "tester";
      }

      req.user.permissions = JSON.parse(req.user.permissions);
      req.user.organisations = JSON.parse(req.user.organisations || "[]");

      Categories.getAll(function(
        err,
        categories,
        categoriesObj,
        proceduresObj
      ) {
        req.user.allProcedures = proceduresObj;
        req.user.categories = categoriesObj;
        Organisations.getAll(function(err, organisations) {
          req.user.allOrganisations = organisations;
          async.eachOf(
            req.user.organisations,
            function(organisation, i, callback) {
              if (!organisations[organisation]) {
                req.user.organisations.splice(i, 1);
              }
              callback();
            },
            function() {
              if (req.user.organisations.length > 0) {
                if (
                  req.query.organisation &&
                  req.user.organisations.includes(req.query.organisation)
                ) {
                  req.user.organisation = organisations[req.query.organisation];
                } else {
                  req.user.organisation =
                    organisations[req.user.organisations[0]];
                }
              } else {
                req.user.organisation = null;
              }

              req.user.name = req.user.first_name + " " + req.user.last_name;
              res.locals.user = req.user;
              next();
            }
          );
        });
      });
    }
  } else {
    res.locals.user = null;
    next();
  }
});

//var job = require("./app/configs/cron");
//job.start();

// Use routers
app.use("/api", require("./app/routes/api/root"));
app.use("/users", require("./app/routes/users/root"));
app.use("/items", require("./app/routes/items/root"));
app.use("/organisations", require("./app/routes/organisations/root"));
app.use("/", require("./app/routes/root")); // *ALWAYS* PLACE THIS ROUTER LAST

// Start server
app.listen(port);
console.log("### " + process.env.NODE_ENV.toUpperCase() + " ###");
console.log("Server started on port " + port);

module.exports.getApp = app;
