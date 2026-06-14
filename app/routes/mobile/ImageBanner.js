const express = require('express');
const router = express.Router();
const imageBannerController = require('../../controllers/mobile/ImageBanner');
const optionalAuth = require('../../middleware/optionalAuth');


/**
 * @route   GET /api/mobile/image-banner
 * @desc    Get all image banners
 * @access  Public (optional auth)
 */
router.get(
    "/",
    optionalAuth,
    imageBannerController.getImageBanner
);

/**
 * @route   GET /api/mobile/image-banner/:id
 * @desc    Get image banner by ID
 * @access  Public (optional auth)
 */
router.get(
    "/:id",
    optionalAuth,
    imageBannerController.getImageBannerById
);

module.exports = router;