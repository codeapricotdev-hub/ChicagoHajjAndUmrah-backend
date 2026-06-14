const express = require("express");
const router = express.Router();
const passport = require("passport");

const controller = require("../../controllers/admin/serviceType");
console.log("SERVICE TYPE CONTROLLER:", controller);
router.post("/", passport.authenticate("jwt", { session: false }), controller.createServiceType);
router.get("/", passport.authenticate("jwt", { session: false }), controller.getServiceTypes);
router.get("/:id", passport.authenticate("jwt", { session: false }), controller.getServiceTypeById);
router.patch("/:id", passport.authenticate("jwt", { session: false }), controller.updateServiceType);
router.delete("/:id", passport.authenticate("jwt", { session: false }), controller.deleteServiceType);

module.exports = router;
