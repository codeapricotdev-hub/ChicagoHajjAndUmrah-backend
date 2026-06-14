const express = require("express");
const router = express.Router();
const passport = require("passport");
const countryController = require("../../controllers/admin/country");

router.post(
    "/",
    passport.authenticate("jwt", { session: false }),
    countryController.addCountry
);

router.put(
    "/:id",
    passport.authenticate("jwt", { session: false }),
    countryController.updateCountry
);

router.get(
    "/",
    passport.authenticate("jwt", { session: false }),
    countryController.getCountries
);

router.get(
    "/:id",
    passport.authenticate("jwt", { session: false }),
    countryController.getCountryById
);

router.delete(
    "/:id",
    passport.authenticate("jwt", { session: false }),
    countryController.deleteCountry
);

module.exports = router;
