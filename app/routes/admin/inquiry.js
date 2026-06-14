const controller = require("../../controllers/admin/inquiry");
const express = require("express");
const route = express.Router();
const { JwtDecode } = require("../../middleware/auth");
const passport = require("passport");
const { verifyAdminRoles } = require('../../middleware/verifyRoles');

// route.get("/", passport.authenticate("jwt", { session: false }),  controller.getAll);
route.get("/", passport.authenticate("jwt", { session: false }),  controller.getAllInquiry);
route.get("/getAllPackageInquiry", passport.authenticate("jwt", { session: false }),  controller.getAllPackagesInquiry);
route.post("/updateInquiryStatus/:id", passport.authenticate("jwt", { session: false }),  controller.updateInquiryStatus);
route.post("/updateInquiryComment/:id", passport.authenticate("jwt", { session: false }),  controller.updateInquiryComments);
// route.post("/auth/login", validate.login, UserController.login);
route.delete("/:id/:type", passport.authenticate("jwt", { session: false }),  controller.deleteInquiry);
route.post("/export-inquiry", passport.authenticate("jwt", { session: false }),  controller.exportInquiry);
route.post("/assing-inquiry", passport.authenticate("jwt", { session: false }),  controller.assignInquiry);
route.get("/getAll/assing-inquiry", passport.authenticate("jwt", { session: false }),  controller.getAllInquiryAssignee);

module.exports = route;
