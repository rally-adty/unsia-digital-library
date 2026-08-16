const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Protected route: wajib membawa header Authorization: Bearer <token>
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Akses ditolak, token tidak disertakan');
  }

  const token = header.slice(7).trim();
  if (!token) {
    throw ApiError.unauthorized('Akses ditolak, token kosong');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Sesi Anda sudah berakhir, silakan login kembali'
        : 'Token tidak valid';
    throw ApiError.unauthorized(message);
  }

  // Ambil ulang dari database supaya user yang sudah dihapus tidak bisa memakai token lamanya.
  const user = await User.findById(payload.sub);
  if (!user) {
    throw ApiError.unauthorized('Pengguna pemilik token sudah tidak terdaftar');
  }

  req.user = user;
  return next();
});

// Pembatas berbasis peran, dipakai untuk aksi yang hanya boleh admin.
function authorize(...roles) {
  return function checkRole(req, res, next) {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Aksi ini hanya untuk peran: ${roles.join(', ')}`));
    }
    return next();
  };
}

module.exports = { protect, authorize };
