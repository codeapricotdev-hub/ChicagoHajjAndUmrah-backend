const express = require("express");
const router = express.Router();

const mobileAuth = require("../../middleware/mobileAuth");
const profileController = require("../../controllers/mobile/profile");
const upload = require("../../helpers/mobile/multer");
router.get(
    "/myprofile",
    mobileAuth,
    profileController.getUserProfile
);
router.patch(
    "/edit-profile",
    mobileAuth,
    upload.single("file"),
    profileController.editProfile
);

router.delete(
    "/delete-profile",
    mobileAuth,
    profileController.deleteUser
);
router.post(
    "/save-fcm-token",
    mobileAuth,
    profileController.saveFcmToken
);
module.exports = router;