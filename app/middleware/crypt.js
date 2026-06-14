const CryptoJS = require("crypto-js");

module.exports = {
  generateRandomValue(len = 6) {
    return CryptoJS.lib.WordArray.random(Math.ceil(len / 2))
      .toString(CryptoJS.enc.Hex) // convert to hexadecimal format
      .slice(0, len); // return required number of characters
  },

  generateNumberValue() {
    return Math.floor(Math.random() * 10000000000); // return required number of characters
  },
};
