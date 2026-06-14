exports.sendResponse = (res, data) => {
  return res.status(data.status).json({
    status: data.status,
    success: data.success,
    error: data.error,
    data: data.data,
    message: data.message,
  });
};
