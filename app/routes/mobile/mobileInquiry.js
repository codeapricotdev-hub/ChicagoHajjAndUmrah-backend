const express = require("express");
const router = express.Router();
const controller = require("../../controllers/mobileInquiry");

router.post("/", controller.createInquiry);

module.exports = router;
