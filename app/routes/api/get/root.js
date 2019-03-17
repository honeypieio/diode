// /api/get

var router = require("express").Router();

router.use("/items", require("./items/root"));
router.use("/cloudinary-signature", require("./cloudinary-signature"));

module.exports = router;
