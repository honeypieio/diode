// /items
var router = require("express").Router();

router.use("/register", require("./register"));
router.use("/test", require("./test"));
router.use("/view", require("./view"));

module.exports = router;
