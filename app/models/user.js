const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const crypt = require("../../app/middleware/crypt");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

var validateEmail = function (email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: "" },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: "Email address is required",
      validate: [validateEmail, "Please fill a valid email address"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      default: ""
    },
    image: { type: String, default: "" },
    is_deleted: { type: String, enum: ["0", "1"], default: "0" },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isLogin: { type: String, enum: ["0", "1"], default: "0" },
    created_at: { type: String, default: new Date() },
    updated_at: { type: String, default: new Date() },
    loginAttempts: { type: Number, required: true, default: 0 },
    lockUntil: { type: Number },
    phoneNumber: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    referralCode: {
      type: String,
      default: "",
      unique: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    verification: { type: String, default: "", unique: true },
    designation: { type: String, default: "" },
  },
  {
    versionKey: false,
    id: false,
    timestamps: true,
    toObject: { getters: true, virtuals: true },
    toJSON: { getters: true, virtuals: true },
  }
);

const hash = (user, salt, next) => {
  bcrypt.hash(user.password, salt, (error, newHash) => {
    if (error) {
      return next(error);
    }
    user.password = newHash;
    return next();
  });
};

const genSalt = (user, SALT_FACTOR, next) => {
  bcrypt.genSalt(SALT_FACTOR, (err, salt) => {
    if (err) {
      return next(err);
    }
    return hash(user, salt, next);
  });
};

/**
 * password encrypt middleware
 */
UserSchema.pre("save", function (next) {
  const that = this;
  const SALT_FACTOR = 5;
  if (!that.isModified("password")) {
    return next();
  }
  return genSalt(that, SALT_FACTOR, next);
});

UserSchema.methods.comparePassword = function (passwordAttempt, cb) {
  bcrypt.compare(passwordAttempt, this.password, (err, isMatch) =>
    err ? cb(err) : cb(null, isMatch)
  );
};

UserSchema.methods.generateUniqueCode = async function () {
  let code = crypt.generateRandomValue(10);
  let isExist = await this.constructor.findOne({
    referralCode: code,
  });

  if (isExist) return generateUniqueCode();
  return code;
};

/**
 * middleware for generate referral code
 */
UserSchema.pre("save", async function (next) {
  if (!this.isNew) return next();
  this.referralCode = await this.generateUniqueCode();
  return next();
});

UserSchema.methods.generateUniqueVerificationCode = async function () {
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
UserSchema.pre("save", async function (next) {
  if (!this.isNew) return next();
  this.verification = await this.generateUniqueVerificationCode();
  return next();
});

UserSchema.plugin(mongoosePaginate);
UserSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("User", UserSchema);
