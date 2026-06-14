const express = require("express");
const route = express.Router();

route.use("/user", require("./user/user"));

module.exports = route;
