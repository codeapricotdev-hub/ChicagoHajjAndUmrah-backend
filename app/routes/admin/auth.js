const AdminController = require("../../controllers/admin/admin");
const express = require("express");
const route = express.Router();
const { JwtDecode } = require("../../middleware/auth");
const passport = require("passport");
const { verifyAdminRoles } = require('../../middleware/verifyRoles');

route.post("/signup", AdminController.signUpAdmin);
route.post("/login", AdminController.adminLogin);
route.post("/user", passport.authenticate("jwt", { session: false }), AdminController.createAdminUser);
route.post("/resetPassword",passport.authenticate("jwt", { session: false }), AdminController.reSetPassword);
route.get("/getAllUser", passport.authenticate("jwt", { session: false }), AdminController.getAdminUsers);
route.get("/user/:id", passport.authenticate("jwt", { session: false }), AdminController.getUserById);
route.patch("/user/:id", passport.authenticate("jwt", { session: false }), AdminController.updateUser);
route.delete("/user/:id", passport.authenticate("jwt", { session: false }), AdminController.deleteUser);
// route.post("/auth/login", validate.login, UserController.login);

route.post("/update-sitemap", passport.authenticate("jwt", { session: false }), AdminController.uploadXmlFileS3);

module.exports = route;
