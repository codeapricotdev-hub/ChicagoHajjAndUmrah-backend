const express = require("express");
const router = express.Router();
const passport = require("passport");
const zellePaymentController = require("../../controllers/admin/zellePayment");

router.post(
    "/",
    passport.authenticate("jwt", { session: false }),
    zellePaymentController.createZellePayment
);

router.get(
    "/",
    passport.authenticate("jwt", { session: false }),
    zellePaymentController.getZellePayments
);

router.get(
    "/:id",
    passport.authenticate("jwt", { session: false }),
    zellePaymentController.getZellePaymentById
);

router.put(
    "/:id",
    passport.authenticate("jwt", { session: false }),
    zellePaymentController.updateZellePayment
);

router.delete(
    "/:id",
    passport.authenticate("jwt", { session: false }),
    zellePaymentController.deleteZellePayment
);

module.exports = router;

