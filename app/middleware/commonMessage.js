exports.MESSAGE = {
  created: { msg: "CREATED", code: 200 },
  deleted: { msg: "DELETED", code: 200 },
  updated: { msg: "UPDATED", code: 200 },
  found: { msg: "FOUND", code: 200 },
  notFound: { msg: "NOT FOUND", code: 400 },
  somethingWentWrong: {
    msg: "SOMETHING WENT WRONG. PLEASE TRY AFTER SOMEETIMES.",
    code: 500,
  },
  unAuthorized: { msg: "UnAuthorized", code: 401 },
};
