const express = require("express");
const passport = require("passport");
const controller = require("../../controllers/admin/appUserManagement");

const router = express.Router();

router.get("/", passport.authenticate("jwt", { session: false }), controller.getAppUsers);
router.get("/:id", passport.authenticate("jwt", { session: false }), controller.getAppUserById);
router.patch("/:id", passport.authenticate("jwt", { session: false }), controller.updateAppUser);

module.exports = router;
