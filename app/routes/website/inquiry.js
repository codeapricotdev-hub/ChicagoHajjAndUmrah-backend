const controller = require("../../controllers/website/inquiry");
const express = require("express");
const route = express.Router();
const { JwtDecode } = require("../../middleware/auth");
const passport = require("passport");
const { verifyAdminRoles } = require('../../middleware/verifyRoles');
const { mailValidationZeroBounce } = require("../../middleware/utils");


route.post("/", controller.createInquary);
route.post("/evisa", controller.eVisaInquiry);
route.post("/packageInquiry", controller.packageInquiry);

module.exports = route;