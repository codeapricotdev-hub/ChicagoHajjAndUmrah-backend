const { sendResponse } = require("../helpers/responser");
const { MAIN_ADMIN, MAIN_USER } = require("./constant")
const db = require("./db")
const models = require("../models").default;

exports.verifyAdminRoles = async (req, res, next) => {
  console.log("req.user.role", req.user.role);
  const getRole = await db.findData({
    req: {},
    model: models.Role,
    query: {
      _id: req.user.role,
    },
  });
  if (getRole && getRole.name === MAIN_ADMIN) {
    return next();
  } else {
    sendResponse(res, {
      success: false,
      error: true,
      status: 401,
      data: null,
      message: "Unauthorized for this route",
    });
  }
}

exports.verifyUserRoles = async (req, res, next) => {
  console.log("req.user.role", req.user.role);
  const getRole = await db.findData({
    req: {},
    model: models.Role,
    query: {
      _id: req.user.role,
    },
  });
  if (getRole && getRole.name === MAIN_USER) {
    return next();
  } else {
    sendResponse(res, {
      success: false,
      error: true,
      status: 401,
      data: null,
      message: "Unauthorized for this route",
    });
  }
}