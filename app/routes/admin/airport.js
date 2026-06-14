const controller = require("../../controllers/admin/airport");
const express = require("express");
const route = express.Router();
const { JwtDecode } = require("../../middleware/auth");
const passport = require("passport");
const { verifyAdminRoles } = require('../../middleware/verifyRoles');

route.post("/", passport.authenticate("jwt", { session: false }),  controller.importCsvtoJson);
// route.post("/auth/login", validate.login, UserController.login);

module.exports = route;
