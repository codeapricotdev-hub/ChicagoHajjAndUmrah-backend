const express = require('express');
const router = express.Router();

const serviceTypeController = require('../../controllers/mobile/servicetype');
const optionalAuth = require('../../middleware/optionalAuth');

/**
 * GET /api/mobile/service-types
 */
router.get('/', optionalAuth, serviceTypeController.getServiceTypes);

router.get('/:id/services', optionalAuth, serviceTypeController.getServiceTypeByServiceId);
module.exports = router;
