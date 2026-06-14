const express = require("express");
const router = express.Router();

const mobileAuth = require("../../middleware/mobileAuth");
const checkoutController = require("../../controllers/mobile/checkoutV2");

router.get(
    "/summary",
    mobileAuth,
    checkoutController.checkoutSummary
);
module.exports = router;
