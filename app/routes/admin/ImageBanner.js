const express = require("express");
const router = express.Router();
const passport = require("passport");

const controller = require("../../controllers/admin/ImageBanner");
console.log("Image banner Controller:", controller);
router.post("/", passport.authenticate("jwt", { session: false }), controller.addImageBanner);
router.get("/", passport.authenticate("jwt", { session: false }), controller.getImageBanners);
router.get("/:id", passport.authenticate("jwt", { session: false }), controller.getImageBannerById);
router.patch("/:id", passport.authenticate("jwt", { session: false }), controller.updateImageBanner);
router.delete("/:id", passport.authenticate("jwt", { session: false }), controller.deleteImageBanner);

module.exports = router;
