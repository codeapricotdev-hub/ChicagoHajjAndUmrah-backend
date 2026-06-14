const express = require("express");
const route = express.Router();

route.use(require("./admin"));
route.use(require("./user"));
route.use(require("./website"));
route.use("/api/mobile", require("./mobile"));
route.use("/api/zelle-payment", require("./admin/zellePayment"));


module.exports = route;
