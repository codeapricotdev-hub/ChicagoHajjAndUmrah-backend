const express = require("express");
const router = express.Router();
const cmsController = require("../../controllers/mobile/cms");

router.get("/type", cmsController.getByType);

module.exports = router;
