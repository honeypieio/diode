// /api/get/users

var router = require("express").Router();

router.use("/resend-activation-link", require("./resend-activation-link"));

module.exports = router;
