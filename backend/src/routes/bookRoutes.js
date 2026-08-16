const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');

const router = express.Router();

// Seluruh endpoint buku hanya untuk pengguna yang sudah login.
router.use(protect);

const idRule = param('id').isMongoId().withMessage('ID buku tidak valid');

const createRules = [
  body('title').trim().notEmpty().withMessage('Judul wajib diisi').isLength({ max: 150 }),
  body('author').trim().notEmpty().withMessage('Penulis wajib diisi').isLength({ max: 100 }),
  body('category').trim().notEmpty().withMessage('Kategori wajib diisi').isLength({ max: 50 }),
  body('isbn')
    .trim()
    .notEmpty()
    .withMessage('ISBN wajib diisi')
    .isLength({ min: 5, max: 20 })
    .withMessage('ISBN harus 5-20 karakter'),
  body('publisher').optional().trim().isLength({ max: 100 }),
  body('year')
    .optional({ nullable: true })
    .isInt({ min: 1500, max: new Date().getFullYear() + 1 })
    .withMessage('Tahun terbit tidak valid'),
  body('stock').isInt({ min: 0 }).withMessage('Stok harus bilangan bulat >= 0'),
];

const updateRules = [
  body('title').optional().trim().notEmpty().withMessage('Judul tidak boleh kosong'),
  body('author').optional().trim().notEmpty().withMessage('Penulis tidak boleh kosong'),
  body('category').optional().trim().notEmpty().withMessage('Kategori tidak boleh kosong'),
  body('isbn').optional().trim().isLength({ min: 5, max: 20 }).withMessage('ISBN harus 5-20 karakter'),
  body('publisher').optional().trim().isLength({ max: 100 }),
  body('year')
    .optional({ nullable: true })
    .isInt({ min: 1500, max: new Date().getFullYear() + 1 })
    .withMessage('Tahun terbit tidak valid'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stok harus bilangan bulat >= 0'),
];

router.route('/').get(getBooks).post(createRules, validate, createBook);

router
  .route('/:id')
  .get([idRule], validate, getBookById)
  .put([idRule, ...updateRules], validate, updateBook)
  .delete([idRule], validate, deleteBook);

module.exports = router;
