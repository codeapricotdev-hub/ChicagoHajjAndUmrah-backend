const controller = require("../../controllers/admin/package");
const express = require("express");
const route = express.Router();
const { JwtDecode } = require("../../middleware/auth");
const passport = require("passport");
const { verifyAdminRoles } = require('../../middleware/verifyRoles');

route.post("/", passport.authenticate("jwt", { session: false }), controller.create);
route.get("/:id", passport.authenticate("jwt", { session: false }), controller.getById);
route.get("/", passport.authenticate("jwt", { session: false }), controller.getAll);
route.patch("/:id", passport.authenticate("jwt", { session: false }), controller.edit);
route.delete("/:id", passport.authenticate("jwt", { session: false }), controller.remove);
route.post("/copy-package/:id", passport.authenticate("jwt", { session: false }), controller.copyPackage);

module.exports = route;
