const express = require("express");
const passport = require("passport");
const controller = require("../../controllers/admin/paymentManagement");

const router = express.Router();

router.get("/", passport.authenticate("jwt", { session: false }), controller.getPayments);
router.get(
    "/:reference",
    passport.authenticate("jwt", { session: false }),
    controller.getPaymentByReference
);

module.exports = router;
