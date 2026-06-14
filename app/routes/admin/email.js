const controller = require("../../controllers/admin/email");
const express = require("express");
const route = express.Router();
const { JwtDecode } = require("../../middleware/auth");
const passport = require("passport");
const { verifyAdminRoles } = require('../../middleware/verifyRoles');

route.post("/send-email",passport.authenticate("jwt", { session: false }),  controller.sendEmail);

module.exports = route;