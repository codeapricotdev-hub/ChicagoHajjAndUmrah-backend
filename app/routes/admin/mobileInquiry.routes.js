const express = require("express");
const router = express.Router();
const passport = require("passport");
const controller = require("../../controllers/mobileInquiry.controller");

router.get("/", passport.authenticate("jwt", { session: false }), controller.getAllInquiries);
router.get("/:id", passport.authenticate("jwt", { session: false }), controller.getInquiryById);
router.delete("/:id", passport.authenticate("jwt", { session: false }), controller.deleteInquiry);

module.exports = router;
