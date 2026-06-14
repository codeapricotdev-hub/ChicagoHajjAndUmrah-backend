const express = require('express');
const router = express.Router();
const serviceController = require('../../controllers/mobile/service');
const optionalAuth = require('../../middleware/optionalAuth');


router.get('/', optionalAuth, serviceController.getServices);

/**
 * @route   GET /api/mobile/services/search
 * @desc    Search services by title/subtitle
 * @access  Public (optional auth)
 */
router.get('/search', optionalAuth, serviceController.searchServices);

/**
 * @route   GET /api/mobile/services/:id
 * @desc    Get single service by ID
 * @access  Public (optional auth)
 */
router.get('/:id', optionalAuth, serviceController.getServiceById);

module.exports = router;