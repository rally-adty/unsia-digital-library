const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  getLoans,
  getLoanById,
  createLoan,
  returnLoan,
  deleteLoan,
} = require('../controllers/loanController');

const router = express.Router();

router.use(protect);

const idRule = param('id').isMongoId().withMessage('ID peminjaman tidak valid');

const createRules = [
  body('book').isMongoId().withMessage('ID buku tidak valid'),
  body('member').isMongoId().withMessage('ID anggota tidak valid'),
  body('dueDate').isISO8601().withMessage('Tanggal jatuh tempo harus format tanggal yang valid'),
  body('note').optional().trim().isLength({ max: 200 }).withMessage('Catatan maksimal 200 karakter'),
];

router.route('/').get(getLoans).post(createRules, validate, createLoan);

router.get('/:id', [idRule], validate, getLoanById);
router.put('/:id/return', [idRule], validate, returnLoan);
router.delete('/:id', [idRule], validate, deleteLoan);

module.exports = router;
