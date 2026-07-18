const controller = require("../../controllers/admin/mobileInquiry");
const express = require("express");
const route = express.Router();
const passport = require("passport");

route.get("/", passport.authenticate("jwt", { session: false }), controller.getAllMobileInquiries);
route.get("/:id", passport.authenticate("jwt", { session: false }), controller.getMobileInquiryById);
route.post("/reply", passport.authenticate("jwt", { session: false }), controller.replyToMobileInquiry);

module.exports = route;
