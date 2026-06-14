const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/mobile/paymentV2');
const upload = require("../../helpers/mobile/multer");
const mobileAuth = require('../../middleware/mobileAuth');


/**
 * @route   GET /api/mobile/image-banner
 * @desc    Get all image banners
 * @access  Public (optional auth)
 */
router.post(
    "/stripe",
    mobileAuth,
    paymentController.createStripePayment
);
router.post(
    "/manual",
    mobileAuth,
    upload.single("proof"),
    paymentController.createManualPayment
);
router.get("/get-user-payments",
    mobileAuth,
    paymentController.getPaymentsByUserId);

router.get("/get-zelle-payment-details",
    mobileAuth,
    paymentController.getZellePaymentInstructions);


router.post(
    "/repay",
    mobileAuth,
    upload.single("proof"),
    paymentController.repayManualPayment
);
router.get("/cheque-payments-details", mobileAuth, paymentController.getChequePayments);

router.get(
    "/:reference",
    mobileAuth,
    paymentController.getPayment
);

module.exports = router;
