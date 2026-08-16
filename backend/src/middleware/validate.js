const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Dipasang setelah rangkaian aturan express-validator pada tiap route.
module.exports = function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((err) => ({
    field: err.path || err.param,
    message: err.msg,
  }));

  return next(ApiError.badRequest('Validasi input gagal', details));
};
