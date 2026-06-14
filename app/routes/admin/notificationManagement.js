const express = require("express");
const passport = require("passport");
const controller = require("../../controllers/admin/notificationManagement");

const router = express.Router();

router.get("/", passport.authenticate("jwt", { session: false }), controller.getCampaigns);
router.post("/preview", passport.authenticate("jwt", { session: false }), controller.previewRecipients);
router.post("/send", passport.authenticate("jwt", { session: false }), controller.sendNotification);

module.exports = router;
