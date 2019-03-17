// /items/register
var router = require("express").Router();
var cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

var eager_options = {
  width: 750,
  height: 750,
  crop: "scale",
  format: "jpg"
};

var rootDir = process.env.CWD;

var Auth = require(rootDir + "/app/configs/auth");
var Helpers = require(rootDir + "/app/configs/helpful_functions");

var Categories = require(rootDir + "/app/models/categories");
var Items = require(rootDir + "/app/models/items");

router.get("/", Auth.isLoggedIn, function(req, res) {
  Categories.getAll(function(err, categories) {
    Helpers.treeify(categories, "category_id", function(categoryTree) {
      res.render("items/register/select", {
        registerItemActive: true,
        title: "Register Item",
        categories: categoryTree
      });
    });
  });
});

router.get("/:category_id", Auth.isLoggedIn, function(req, res) {
  Categories.getById(req.params.category_id, function(err, category) {
    if (err || !category) {
      req.flash("error_msg", "Please select a valid category");
      res.redirect("/items/register");
    } else {
      res.render("items/register/register", {
        registerItemActive: true,
        title: "Register Item",
        category: category,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME
      });
    }
  });
});

router.post("/:category_id", Auth.isLoggedIn, function(req, res) {
  Categories.getById(req.params.category_id, function(err, category) {
    if (!err && category) {
      if (req.user.organisation) {
        var item = req.body.item;

        var formattedItem = {};
        var errors = [];
        if (category.basicInfoRequired) {
          if (!item.description) {
            errors.push({ msg: "Please enter a description." });
          } else {
            formattedItem.description = item.description;
          }

          if (item.brand) {
            formattedItem.brand = item.brand;
          }

          if (item.modelNo) {
            formattedItem.model_number = item.modelNo;
          }

          if (item.batchNo) {
            formattedItem.batch_number = item.batchNo;
          }
        }

        if (category.additionalInfo.length > 0) {
          category.additionalInfo.forEach(function(field) {
            if (field.required == true) {
              if (!item.additionalInfo[field.id]) {
                errors.push({
                  msg: "Please enter a " + field.description + "."
                });
              }
            }

            if (item.additionalInfo[field.id]) {
              if (field.type == "number") {
                if (!Helpers.isNumber(item.additionalInfo[field.id])) {
                  errors.push({
                    msg:
                      "Please enter a valid number for " +
                      field.description +
                      "."
                  });
                } else {
                  formattedItem[field.id] = item.additionalInfo[field.id];
                  if (field.unit) {
                    formattedItem[field.id] += " " + field.unit;
                  }
                }
              } else if (field.type == "dropdown") {
                Helpers.flattenToIds(field.options, "name", function(
                  flatOptions
                ) {
                  if (
                    flatOptions.includes(item.additionalInfo[field.id])
                      .length == 0
                  ) {
                    errors.push({
                      msg:
                        "Please enter a valid option for " +
                        field.description +
                        "."
                    });
                  } else {
                    formattedItem[field.id] = item.additionalInfo[field.id];
                  }
                });
              } else if (field.type == "text") {
                if (
                  typeof item.additionalInfo[field.id] === "string" ||
                  item.additionalInfo[field.id] instanceof String
                ) {
                  formattedItem[field.id] = item.additionalInfo[field.id];
                } else {
                  errors.push({
                    msg:
                      "Please enter a valid string for " +
                      field.description +
                      "."
                  });
                }
              }
            }
          });
        }

        if (category.imageRequired) {
          if (item.image) {
            formattedItem.image = item.image;
          } else {
            errors.push({
              msg: "Please upload an image!"
            });
          }
        }
        if (errors.length > 0) {
          res.render("items/register/register", {
            registerItemActive: true,
            title: "Register Item",
            category: category,
            item: item,
            errors: errors,
            CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
            CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME
          });
        } else {
          Items.create(formattedItem, req.user, category, function(err, item) {
            Items.getByUid(item.uid, req.user.categories, function(err, item) {
              res.render("items/register/success", {
                registerItemActive: true,
                title: "Register Item",
                item: item,
                hideOrganisationSelect: true
              });
            });
          });
        }
      }
    }
  });
});

module.exports = router;
