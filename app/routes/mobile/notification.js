const express = require("express");
const mobileAuth = require("../../middleware/mobileAuth");
const controller = require("../../controllers/mobile/notification");

const router = express.Router();

router.get("/", mobileAuth, controller.getNotifications);
router.patch("/read-all", mobileAuth, controller.markAllAsRead);
router.patch("/mark-all-read", mobileAuth, controller.markAllAsRead);
router.patch("/clear-all", mobileAuth, controller.clearAllNotifications);
router.delete("/clear-all", mobileAuth, controller.clearAllNotifications);
router.patch("/:id/read", mobileAuth, controller.markAsRead);

module.exports = router;
