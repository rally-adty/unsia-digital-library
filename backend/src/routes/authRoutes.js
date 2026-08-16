const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { register, login, me } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 3, max: 80 }).withMessage('Nama harus 3-80 karakter'),
    body('email').trim().isEmail().withMessage('Format email tidak valid').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password minimal 6 karakter')
      .matches(/\d/)
      .withMessage('Password harus mengandung minimal satu angka'),
    body('role').optional().isIn(['admin', 'petugas']).withMessage('Peran tidak dikenali'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Format email tidak valid').normalizeEmail(),
    body('password').notEmpty().withMessage('Password wajib diisi'),
  ],
  validate,
  login
);

router.get('/me', protect, me);

module.exports = router;
