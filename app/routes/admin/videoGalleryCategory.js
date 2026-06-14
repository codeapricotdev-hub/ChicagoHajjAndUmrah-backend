const controller = require("../../controllers/admin/videoGalleryCategory");
const express = require("express");
const route = express.Router();
const { JwtDecode } = require("../../middleware/auth");
const passport = require("passport");
const { verifyAdminRoles } = require('../../middleware/verifyRoles');

route.post("/", passport.authenticate("jwt", { session: false }),  controller.create);
route.get("/:id", passport.authenticate("jwt", { session: false }),  controller.getById);
route.get("/", controller.getAll);
route.patch("/:id", passport.authenticate("jwt", { session: false }),  controller.edit);
route.delete("/:id", passport.authenticate("jwt", { session: false }),  controller.remove);
// route.post("/auth/login", validate.login, UserController.login);

module.exports = route;
