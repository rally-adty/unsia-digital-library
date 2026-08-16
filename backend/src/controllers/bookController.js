const Book = require('../models/Book');
const Loan = require('../models/Loan');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/books — mendukung pencarian, filter kategori, dan paginasi.
const getBooks = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filter = {};

  if (req.query.search) {
    const keyword = new RegExp(req.query.search.trim(), 'i');
    filter.$or = [{ title: keyword }, { author: keyword }, { isbn: keyword }];
  }
  if (req.query.category) {
    filter.category = req.query.category;
  }

  const [items, total] = await Promise.all([
    Book.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Book.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  });
});

// GET /api/books/:id
const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw ApiError.notFound('Buku tidak ditemukan');

  res.status(200).json({ success: true, data: book });
});

// POST /api/books
const createBook = asyncHandler(async (req, res) => {
  const { title, author, category, isbn, publisher, year, stock } = req.body;

  const duplicate = await Book.findOne({ isbn: isbn.trim() });
  if (duplicate) throw ApiError.conflict(`ISBN ${isbn} sudah terdaftar`);

  const book = await Book.create({
    title,
    author,
    category,
    isbn: isbn.trim(),
    publisher,
    year,
    stock,
    available: stock,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Buku berhasil ditambahkan', data: book });
});

// PUT /api/books/:id
const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw ApiError.notFound('Buku tidak ditemukan');

  const { title, author, category, isbn, publisher, year, stock } = req.body;

  if (isbn && isbn.trim() !== book.isbn) {
    const duplicate = await Book.findOne({ isbn: isbn.trim(), _id: { $ne: book._id } });
    if (duplicate) throw ApiError.conflict(`ISBN ${isbn} sudah dipakai buku lain`);
    book.isbn = isbn.trim();
  }

  if (title !== undefined) book.title = title;
  if (author !== undefined) book.author = author;
  if (category !== undefined) book.category = category;
  if (publisher !== undefined) book.publisher = publisher;
  if (year !== undefined) book.year = year;

  if (stock !== undefined) {
    // Jumlah yang sedang dipinjam harus tetap terjaga saat stok diubah.
    const onLoan = book.stock - book.available;
    if (stock < onLoan) {
      throw ApiError.badRequest(
        `Stok tidak boleh kurang dari ${onLoan} karena sejumlah itu sedang dipinjam`
      );
    }
    book.stock = stock;
    book.available = stock - onLoan;
  }

  await book.save();

  res.status(200).json({ success: true, message: 'Buku berhasil diperbarui', data: book });
});

// DELETE /api/books/:id
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw ApiError.notFound('Buku tidak ditemukan');

  const activeLoan = await Loan.countDocuments({ book: book._id, status: 'dipinjam' });
  if (activeLoan > 0) {
    throw ApiError.badRequest('Buku masih memiliki peminjaman aktif dan tidak bisa dihapus');
  }

  await book.deleteOne();

  res.status(200).json({ success: true, message: 'Buku berhasil dihapus', data: { id: book._id } });
});

module.exports = { getBooks, getBookById, createBook, updateBook, deleteBook };
