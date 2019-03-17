// /api/post

var router = require("express").Router();

router.use("/items", require("./items/root"));

module.exports = router;
