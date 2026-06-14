const express = require('express');
const router = express.Router();
const passport = require("passport");
const serviceController = require('../../controllers/admin/service'); // ✅ Import all controller functions

/**
 * CREATE SERVICE
 */
router.post(
    '/',
    passport.authenticate("jwt", { session: false }),
    serviceController.createService  // ✅ Fixed
);

/**
 * GET SERVICE LIST
 */
router.get(
    '/',
    passport.authenticate("jwt", { session: false }),
    serviceController.getServices
);

/**
 * GET SERVICE BY ID
 */
router.get(
    '/:_id',
    passport.authenticate("jwt", { session: false }),
    serviceController.getServiceById
);

/**
 * UPDATE SERVICE
 */
router.patch(
    '/:_id',
    passport.authenticate("jwt", { session: false }),
    serviceController.updateService
);

/**
 * DELETE SERVICE
 */
router.delete(
    '/:_id',
    passport.authenticate("jwt", { session: false }),
    serviceController.deleteService
);

module.exports = router;