const express = require("express");
const router = express.Router();

const mobileAuth = require("../../middleware/mobileAuth");
const applicationController = require("../../controllers/mobile/applicationV2");

router.post(
    "/create",
    mobileAuth,
    applicationController.createApplication
);

router.get(
    "/",
    mobileAuth,
    applicationController.getApplications
);
router.get(
    "/:id",
    mobileAuth,
    applicationController.getApplicationById
);

router.get(
    "/applicants/:id",
    mobileAuth,
    applicationController.getApplicantsById
);
router.get(
    "/:id/timeline",
    mobileAuth,
    applicationController.getApplicationTimeline
);
module.exports = router; // ✅ THIS IS CRITICAL
