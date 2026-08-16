const Loan = require('../models/Loan');
const Book = require('../models/Book');
const Member = require('../models/Member');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const POPULATE = [
  { path: 'book', select: 'title author isbn category' },
  { path: 'member', select: 'memberCode name email' },
];

// GET /api/loans
const getLoans = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.member) filter.member = req.query.member;
  if (req.query.book) filter.book = req.query.book;

  const [items, total] = await Promise.all([
    Loan.find(filter)
      .populate(POPULATE)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Loan.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  });
});

// GET /api/loans/:id
const getLoanById = asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id).populate(POPULATE);
  if (!loan) throw ApiError.notFound('Data peminjaman tidak ditemukan');

  res.status(200).json({ success: true, data: loan });
});

// POST /api/loans — mencatat transaksi peminjaman dan mengurangi stok tersedia.
const createLoan = asyncHandler(async (req, res) => {
  const { book: bookId, member: memberId, dueDate, note } = req.body;

  const [book, member] = await Promise.all([Book.findById(bookId), Member.findById(memberId)]);

  if (!book) throw ApiError.notFound('Buku yang dipinjam tidak ditemukan');
  if (!member) throw ApiError.notFound('Anggota peminjam tidak ditemukan');
  if (member.status !== 'aktif') {
    throw ApiError.badRequest('Anggota berstatus nonaktif tidak dapat meminjam buku');
  }
  if (book.available < 1) {
    throw ApiError.badRequest(`Stok buku "${book.title}" sedang habis dipinjam`);
  }

  const due = new Date(dueDate);
  if (due <= new Date()) {
    throw ApiError.badRequest('Tanggal jatuh tempo harus setelah hari ini');
  }

  const duplicate = await Loan.findOne({
    book: book._id,
    member: member._id,
    status: 'dipinjam',
  });
  if (duplicate) {
    throw ApiError.badRequest('Anggota ini masih meminjam buku yang sama dan belum mengembalikan');
  }

  const loan = await Loan.create({
    book: book._id,
    member: member._id,
    dueDate: due,
    note,
    handledBy: req.user._id,
  });

  book.available -= 1;
  await book.save();

  await loan.populate(POPULATE);

  res
    .status(201)
    .json({ success: true, message: 'Peminjaman berhasil dicatat', data: loan });
});

// PUT /api/loans/:id/return — menandai buku sudah dikembalikan.
const returnLoan = asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) throw ApiError.notFound('Data peminjaman tidak ditemukan');
  if (loan.status === 'dikembalikan') {
    throw ApiError.badRequest('Peminjaman ini sudah ditandai dikembalikan sebelumnya');
  }

  loan.status = 'dikembalikan';
  loan.returnDate = new Date();
  await loan.save();

  // Kembalikan stok, tetap dibatasi agar tidak melebihi total stok.
  const book = await Book.findById(loan.book);
  if (book) {
    book.available = Math.min(book.stock, book.available + 1);
    await book.save();
  }

  await loan.populate(POPULATE);

  res.status(200).json({ success: true, message: 'Buku berhasil dikembalikan', data: loan });
});

// DELETE /api/loans/:id
const deleteLoan = asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) throw ApiError.notFound('Data peminjaman tidak ditemukan');

  // Menghapus peminjaman aktif berarti stok tersedia harus dipulihkan.
  if (loan.status === 'dipinjam') {
    const book = await Book.findById(loan.book);
    if (book) {
      book.available = Math.min(book.stock, book.available + 1);
      await book.save();
    }
  }

  await loan.deleteOne();

  res
    .status(200)
    .json({ success: true, message: 'Data peminjaman berhasil dihapus', data: { id: loan._id } });
});

module.exports = { getLoans, getLoanById, createLoan, returnLoan, deleteLoan };
