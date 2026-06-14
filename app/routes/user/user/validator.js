const { validationResult } = require("../../../middleware/utils");
const { check } = require("express-validator");

exports.login = [
  check("email")
    .exists()
    .withMessage("MISSING")
    .not()
    .isEmpty()
    .withMessage("IS_EMPTY")
    .isEmail()
    .withMessage("EMAIL_IS_NOT_VALID"),
  check("password")
    .exists()
    .withMessage("MISSING")
    .not()
    .isEmpty()
    .withMessage("IS_EMPTY")
    .isLength({
      min: 6,
    })
    .withMessage("PASSWORD TOO SHORT MIN 6"),
  (req, res, next) => {
    validationResult(req, res, next);
  },
];

exports.signUp = [
  check("email")
    .exists()
    .withMessage("MISSING")
    .not()
    .isEmpty()
    .withMessage("IS_EMPTY")
    .isEmail()
    .withMessage("EMAIL_IS_NOT_VALID"),
  check("password")
    .exists()
    .withMessage("MISSING")
    .not()
    .isEmpty()
    .withMessage("IS_EMPTY")
    .isLength({
      min: 6,
    })
    .withMessage("PASSWORD TOO SHORT MIN 6"),
  (req, res, next) => {
    validationResult(req, res, next);
  },
];

exports.updateProfile = [
  check("fullName")
    .exists()
    .withMessage("MISSING")
    .not()
    .isEmpty()
    .withMessage("IS_EMPTY"),
  check("phoneNumber")
    .exists()
    .withMessage("MISSING")
    .not()
    .isEmpty()
    .withMessage("IS_EMPTY"),
  (req, res, next) => {
    validationResult(req, res, next);
  },
];
