const jsend = require("jsend");

exports.JSEND = (type, data, message, code) => {
  try {
    if (type === "success") {
      return jsend.success(data, message);
    }

    if (type === "fail") {
      return jsend.fail("false", code, data, message);
    }

    if (type === "error") {
      return jsend.error(message, code);
    }
  } catch (error) {
    return jsend.error(error.message, 500);
  }
};
