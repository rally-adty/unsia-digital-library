const Book = require('../models/Book');
const Member = require('../models/Member');
const Loan = require('../models/Loan');
const asyncHandler = require('../utils/asyncHandler');

const NAMA_BULAN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

// GET /api/dashboard/summary — kartu ringkasan + data untuk grafik Chart.js.
const getSummary = asyncHandler(async (req, res) => {
  const now = new Date();

  // Batas awal jendela 6 bulan terakhir (termasuk bulan berjalan).
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalBooks,
    totalMembers,
    activeMembers,
    totalLoans,
    activeLoans,
    returnedLoans,
    overdueLoans,
    stockAgg,
    booksByCategory,
    loansPerMonth,
    topBorrowedBooks,
  ] = await Promise.all([
    Book.countDocuments(),
    Member.countDocuments(),
    Member.countDocuments({ status: 'aktif' }),
    Loan.countDocuments(),
    Loan.countDocuments({ status: 'dipinjam' }),
    Loan.countDocuments({ status: 'dikembalikan' }),
    Loan.countDocuments({ status: 'dipinjam', dueDate: { $lt: now } }),

    // Total eksemplar dan eksemplar yang tersedia.
    Book.aggregate([
      { $group: { _id: null, stock: { $sum: '$stock' }, available: { $sum: '$available' } } },
    ]),

    // Grafik 1: jumlah judul buku per kategori.
    Book.aggregate([
      { $group: { _id: '$category', total: { $sum: 1 }, stock: { $sum: '$stock' } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, category: '$_id', total: 1, stock: 1 } },
    ]),

    // Grafik 2: jumlah peminjaman per bulan, 6 bulan terakhir.
    Loan.aggregate([
      { $match: { loanDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$loanDate' }, month: { $month: '$loanDate' } },
          total: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),

    // Tabel pendukung: buku paling sering dipinjam.
    Loan.aggregate([
      { $group: { _id: '$book', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
      { $unwind: '$book' },
      {
        $project: {
          _id: 0,
          bookId: '$book._id',
          title: '$book.title',
          author: '$book.author',
          category: '$book.category',
          total: 1,
        },
      },
    ]),
  ]);

  const stock = stockAgg[0] || { stock: 0, available: 0 };

  // Isi bulan yang tidak punya transaksi dengan nol supaya sumbu X grafik utuh.
  const monthlyMap = new Map(
    loansPerMonth.map((row) => [`${row._id.year}-${row._id.month}`, row.total])
  );
  const loansPerMonthSeries = [];
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    loansPerMonthSeries.push({
      label: `${NAMA_BULAN[date.getMonth()]} ${date.getFullYear()}`,
      total: monthlyMap.get(key) || 0,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      cards: {
        totalBooks,
        totalMembers,
        activeMembers,
        totalLoans,
        activeLoans,
        returnedLoans,
        overdueLoans,
        totalStock: stock.stock,
        availableBooks: stock.available,
        borrowedCopies: stock.stock - stock.available,
      },
      charts: {
        booksByCategory,
        loansPerMonth: loansPerMonthSeries,
        loanStatus: [
          { label: 'Dipinjam', total: activeLoans },
          { label: 'Dikembalikan', total: returnedLoans },
          { label: 'Terlambat', total: overdueLoans },
        ],
      },
      topBorrowedBooks,
      generatedAt: now,
    },
  });
});

module.exports = { getSummary };
