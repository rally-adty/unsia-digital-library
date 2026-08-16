const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
} = require('../controllers/memberController');

const router = express.Router();

router.use(protect);

const idRule = param('id').isMongoId().withMessage('ID anggota tidak valid');

const createRules = [
  body('memberCode')
    .trim()
    .notEmpty()
    .withMessage('Kode anggota wajib diisi')
    .isLength({ min: 3, max: 20 })
    .withMessage('Kode anggota harus 3-20 karakter'),
  body('name').trim().isLength({ min: 3, max: 80 }).withMessage('Nama harus 3-80 karakter'),
  body('email').trim().isEmail().withMessage('Format email tidak valid').normalizeEmail(),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9+\-\s]{8,20}$/)
    .withMessage('Nomor telepon tidak valid'),
  body('faculty').optional().trim().isLength({ max: 80 }),
  body('status').optional().isIn(['aktif', 'nonaktif']).withMessage('Status tidak dikenali'),
];

// Ditulis ulang, bukan hasil map dari createRules: chain express-validator
// bersifat mutable sehingga .optional() akan ikut melonggarkan aturan create.
const updateRules = [
  body('memberCode')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Kode anggota harus 3-20 karakter'),
  body('name').optional().trim().isLength({ min: 3, max: 80 }).withMessage('Nama harus 3-80 karakter'),
  body('email').optional().trim().isEmail().withMessage('Format email tidak valid').normalizeEmail(),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9+\-\s]{8,20}$/)
    .withMessage('Nomor telepon tidak valid'),
  body('faculty').optional().trim().isLength({ max: 80 }),
  body('status').optional().isIn(['aktif', 'nonaktif']).withMessage('Status tidak dikenali'),
];

router.route('/').get(getMembers).post(createRules, validate, createMember);

router
  .route('/:id')
  .get([idRule], validate, getMemberById)
  .put([idRule, ...updateRules], validate, updateMember)
  .delete([idRule], validate, deleteMember);

module.exports = router;
