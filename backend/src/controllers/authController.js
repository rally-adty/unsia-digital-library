const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

// POST /api/auth/register (public)
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('Email sudah terdaftar, silakan gunakan email lain');
  }

  // Password di-hash otomatis oleh hook pre('save') pada model User.
  const user = await User.create({
    name,
    email,
    password,
    role: role === 'admin' ? 'admin' : 'petugas',
  });

  res.status(201).json({
    success: true,
    message: 'Registrasi berhasil',
    data: { user: toPublicUser(user), token: signToken(user) },
  });
});

// POST /api/auth/login (public)
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // password di-select eksplisit karena schema-nya select: false.
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  // Pesan sengaja disamakan agar tidak membocorkan email mana yang terdaftar.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Email atau password salah');
  }

  res.status(200).json({
    success: true,
    message: 'Login berhasil',
    data: { user: toPublicUser(user), token: signToken(user) },
  });
});

// GET /api/auth/me (protected)
const me = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: toPublicUser(req.user) });
});

module.exports = { register, login, me };
