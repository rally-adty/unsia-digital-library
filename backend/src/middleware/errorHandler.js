const env = require('../config/env');

// Error handler global: satu-satunya tempat yang menyusun respons error.
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Terjadi kesalahan pada server';
  let details = err.details;

  // Validasi tingkat schema Mongoose -> 400
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validasi data gagal';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }

  // ObjectId yang bentuknya salah -> 400, bukan 500
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Nilai '${err.value}' bukan ${err.kind} yang valid untuk field ${err.path}`;
  }

  // Pelanggaran unique index -> 409
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'data';
    message = `Nilai ${field} '${err.keyValue?.[field]}' sudah terdaftar`;
  }

  if (statusCode >= 500) {
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { errors: details } : {}),
    ...(env.nodeEnv === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};
