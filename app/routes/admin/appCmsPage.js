const express = require("express");
const router = express.Router();
const passport = require("passport");
const controller = require("../../controllers/admin/appCmsPage");

router.post(
    "/",
    passport.authenticate("jwt", { session: false }),
    controller.create
);
router.get(
    "/",
    passport.authenticate("jwt", { session: false }),
    controller.list
);
router.get(
    "/:id",
    passport.authenticate("jwt", { session: false }),
    controller.getById
);
router.patch(
    "/:id",
    passport.authenticate("jwt", { session: false }),
    controller.update
);
router.delete(
    "/:id",
    passport.authenticate("jwt", { session: false }),
    controller.remove
);

module.exports = router;
