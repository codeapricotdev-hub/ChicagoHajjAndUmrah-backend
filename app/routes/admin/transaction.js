const controller = require("../../controllers/admin/transaction");
const express = require("express");
const route = express.Router();
const { JwtDecode } = require("../../middleware/auth");
const passport = require("passport");
const { verifyAdminRoles } = require('../../middleware/verifyRoles');

route.get("/", passport.authenticate("jwt", { session: false }),  controller.GetAllTransaction);

module.exports = route;