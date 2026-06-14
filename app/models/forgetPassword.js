const mongoose = require("mongoose");
const validator = require("validator");
const crypt = require("../../app/middleware/crypt");

const ForgotPasswordSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      validate: {
        validator: validator.isEmail,
        message: "EMAIL IS NOT VALID",
      },
      lowercase: true,
      required: true,
    },
    verification: {
      type: String,
      unique: true
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    used: {
      type: Boolean,
      default: false,
    },
    ipRequest: {
      type: String,
      default: "",
    },
    browserRequest: {
      type: String,
      default: "",
    },
    countryRequest: {
      type: String,
      default: "",
    },
    ipChanged: {
      type: String,
      default: "",
    },
    browserChanged: {
      type: String,
      default: "",
    },
    countryChanged: {
      type: String,
      default: "",
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

ForgotPasswordSchema.methods.generateUniqueVerificationCode = async function () {
  let code = crypt.generateRandomValue(20);
  let isExist = await this.constructor.findOne({
    verification: code,
  });

  if (isExist) return generateUniqueVerificationCode();
  return code;
};

/**
 * middleware for generate verification code
 */
ForgotPasswordSchema.pre("save", async function (next) {
  if (!this.isNew) return next();
  this.verification = await this.generateUniqueVerificationCode();
  return next();
});

module.exports = mongoose.model("ForgotPassword", ForgotPasswordSchema);
