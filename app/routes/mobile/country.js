const express = require('express');
const router = express.Router();
const countryController = require('../../controllers/mobile/country');
const optionalAuth = require('../../middleware/optionalAuth');


/**
 * @route   GET /api/mobile/image-banner
 * @desc    Get all image banners
 * @access  Public (optional auth)
 */
router.get(
    "/",
    optionalAuth,
    countryController.getCountries
);

/**
 * @route   GET /api/mobile/image-banner/:id
 * @desc    Get image banner by ID
 * @access  Public (optional auth)
 */
router.get(
    "/:id",
    optionalAuth,
    countryController.getCountryById
);

module.exports = router;