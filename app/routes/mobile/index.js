const express = require("express");
const router = express.Router();

console.log('✅ Mobile routes index loaded'); // ✅ ADD THIS

router.use("/services", require("./service"));
router.use('/service-types', require('./servicetype'));
router.use('/image-banner', require('./ImageBanner'));
router.use("/auth", require("./auth"));
router.use('/country', require('./country'));
router.use("/application", require("./application"));
router.use("/application-document", require("./applicationDocument"));
router.use("/payment", require("./payment"));
router.use("/checkout", require("./checkout"));
router.use("/profile", require("./profile"));
router.use("/cms", require("./cms"));
router.use("/notifications", require("./notification"));
console.log('✅ Mobile services route registered'); // ✅ ADD THIS

module.exports = router;
