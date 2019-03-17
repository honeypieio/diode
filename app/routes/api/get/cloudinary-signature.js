// /api/get/cloudinary-signature
var router = require("express").Router();
var crypto = require("crypto");
var cloudinary = require("cloudinary");

var rootDir = process.env.CWD;

var Auth = require(rootDir + "/app/configs/auth");

router.get("/", Auth.isLoggedIn, function(req, res) {
  var signature = cloudinary.utils.api_sign_request(
    req.query,
    process.env.CLOUDINARY_SECRET
  );

  res.send({ signature: signature });
});

module.exports = router;
