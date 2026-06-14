const controller = require("../../controllers/admin/defaultContent");
const express = require("express");
const route = express.Router();
const { JwtDecode } = require("../../middleware/auth");
const passport = require("passport");
const { verifyAdminRoles } = require('../../middleware/verifyRoles');

route.post("/privacyPolicy", passport.authenticate("jwt", { session: false }), controller.updatePrivacyPolicy);
route.get("/privacyPolicy", passport.authenticate("jwt", { session: false }), controller.getPrivacyPolicy);
route.post("/termsAndCondition", passport.authenticate("jwt", { session: false }), controller.updateTermsAndCondition);
route.get("/termsAndCondition", passport.authenticate("jwt", { session: false }), controller.getTermsAndCondition);
// route.post("/auth/login", validate.login, UserController.login);

module.exports = route;
