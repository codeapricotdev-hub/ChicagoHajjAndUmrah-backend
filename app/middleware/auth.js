const jwt = require("jsonwebtoken");
const config = require("../../config/config");
const db = require("../middleware/db");
const models = require("../models").default;

exports.JwtSign = async (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: "6h" });
};

exports.JwtDecode = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (token) {
      const getToken = token.split(" ");
      const decodeData = await jwt.decode(getToken[1], process.env.JWT_SECRET);
      if (decodeData && decodeData.userId !== null) {
        const getUser = await db.findById(decodeData.userId, models.User);
        delete getUser.password;
        req.user = getUser;
        return next();
      } else {
        return res.json({
          status: 401,
          success: false,
          data: null,
          error: true,
          message: "Invalid Token.",
        });
      }
    } else {
      return res.json({
        status: 400,
        success: false,
        data: null,
        error: true,
        message: "Please provide token.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      data: null,
      error: true,
      message: error.message,
    });
  }
};
