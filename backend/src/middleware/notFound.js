const ApiError = require('../utils/ApiError');

// Route apa pun yang tidak cocok berakhir di sini sebagai 404 JSON.
module.exports = function notFound(req, res, next) {
  next(ApiError.notFound(`Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`));
};
