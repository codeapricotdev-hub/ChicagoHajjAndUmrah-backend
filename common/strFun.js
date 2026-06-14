/**
 * @param  {String} template
 * @param  {String[]} values
 * @return {String}
 */
exports.sprintf = function (template, values) {
  return template.replace(/%s/g, function () {
    return values.shift();
  });
};

/**
 * return string replaced by special character with divided by pipe
 * @param {String} str string for search
 */
exports.getRegexWordSearch = (str) =>
  str.replace(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g, "\\$&").replace(/ /g, "|");

/**
 * return string replaced by special character without divided by pipe
 * @param {String} str string for search
 */
exports.getRegexStringSearch = (str) =>
  str.replace(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g, "\\$&");
