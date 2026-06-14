const express = require("express");
const router = express.Router();
const authController = require("../../controllers/mobile/auth");
const mobileAuth = require("../../middleware/mobileAuth");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/refresh-token", authController.refreshAccessToken);
router.post("/logout", mobileAuth, authController.logout);

router.post("/change-password", mobileAuth, authController.changePassword);
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);
router.get("/get-refresh-token", mobileAuth, authController.getRefreshToken);


module.exports = router;