const express = require("express");
const router = express.Router();
const passport = require("passport");
const chequePaymentController = require("../../controllers/admin/chequePayment");

router.post(
    "/",
    passport.authenticate("jwt", { session: false }),
    chequePaymentController.createChequePayment
);

router.get(
    "/",
    passport.authenticate("jwt", { session: false }),
    chequePaymentController.getChequePayments
);

router.get(
    "/:id",
    passport.authenticate("jwt", { session: false }),
    chequePaymentController.getChequePaymentById
);

router.put(
    "/:id",
    passport.authenticate("jwt", { session: false }),
    chequePaymentController.updateChequePayment
);

router.delete(
    "/:id",
    passport.authenticate("jwt", { session: false }),
    chequePaymentController.deleteChequePayment
);

module.exports = router;
