/**
 * Mengisi database dengan data contoh agar dashboard dan grafik langsung terlihat.
 * Jalankan: npm run seed
 * PERINGATAN: seluruh isi koleksi User, Book, Member, dan Loan akan dikosongkan dulu.
 */
const { connectDatabase, disconnectDatabase } = require('./config/db');
const User = require('./models/User');
const Book = require('./models/Book');
const Member = require('./models/Member');
const Loan = require('./models/Loan');

const users = [
  { name: 'Admin Perpustakaan', email: 'admin@unsia.ac.id', password: 'admin123', role: 'admin' },
  { name: 'Petugas Sirkulasi', email: 'petugas@unsia.ac.id', password: 'petugas123', role: 'petugas' },
];

const books = [
  { title: 'Algoritma dan Pemrograman', author: 'Rinaldi Munir', category: 'Informatika', isbn: '9786021514011', publisher: 'Informatika Bandung', year: 2019, stock: 5 },
  { title: 'Basis Data Relasional', author: 'Fathansyah', category: 'Informatika', isbn: '9789797561246', publisher: 'Informatika Bandung', year: 2018, stock: 4 },
  { title: 'Jaringan Komputer Dasar', author: 'Andrew S. Tanenbaum', category: 'Jaringan', isbn: '9780132126953', publisher: 'Pearson', year: 2020, stock: 3 },
  { title: 'Keamanan Sistem Informasi', author: 'William Stallings', category: 'Keamanan', isbn: '9780134794105', publisher: 'Pearson', year: 2021, stock: 3 },
  { title: 'Rekayasa Perangkat Lunak', author: 'Ian Sommerville', category: 'Informatika', isbn: '9780133943030', publisher: 'Pearson', year: 2017, stock: 6 },
  { title: 'Statistika untuk Penelitian', author: 'Sugiyono', category: 'Statistika', isbn: '9789798433641', publisher: 'Alfabeta', year: 2019, stock: 4 },
  { title: 'Manajemen Proyek TI', author: 'Kathy Schwalbe', category: 'Manajemen', isbn: '9781337101356', publisher: 'Cengage', year: 2018, stock: 2 },
  { title: 'Kecerdasan Buatan Modern', author: 'Stuart Russell', category: 'Kecerdasan Buatan', isbn: '9780134610993', publisher: 'Pearson', year: 2021, stock: 3 },
  { title: 'Pemrograman Web Lanjut', author: 'Abdul Kadir', category: 'Informatika', isbn: '9789792977820', publisher: 'Andi', year: 2020, stock: 5 },
  { title: 'Etika Profesi Teknologi', author: 'Teguh Wahyono', category: 'Manajemen', isbn: '9789792916041', publisher: 'Andi', year: 2016, stock: 2 },
];

const members = [
  { memberCode: 'AGT-001', name: 'Rizky Ramadhan', email: 'rizky@student.unsia.ac.id', phone: '081234567801', faculty: 'Ilmu Komputer', status: 'aktif' },
  { memberCode: 'AGT-002', name: 'Siti Nurhaliza', email: 'siti@student.unsia.ac.id', phone: '081234567802', faculty: 'Ilmu Komputer', status: 'aktif' },
  { memberCode: 'AGT-003', name: 'Bagus Prasetyo', email: 'bagus@student.unsia.ac.id', phone: '081234567803', faculty: 'Ekonomi Digital', status: 'aktif' },
  { memberCode: 'AGT-004', name: 'Dewi Lestari', email: 'dewi@student.unsia.ac.id', phone: '081234567804', faculty: 'Komunikasi', status: 'aktif' },
  { memberCode: 'AGT-005', name: 'Fajar Nugroho', email: 'fajar@student.unsia.ac.id', phone: '081234567805', faculty: 'Ilmu Komputer', status: 'nonaktif' },
  { memberCode: 'AGT-006', name: 'Intan Permata', email: 'intan@student.unsia.ac.id', phone: '081234567806', faculty: 'Ekonomi Digital', status: 'aktif' },
];

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function monthsAgo(months, day) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - months, day);
}

async function run() {
  await connectDatabase();

  console.log('[seed] Mengosongkan koleksi lama...');
  await Promise.all([
    User.deleteMany({}),
    Book.deleteMany({}),
    Member.deleteMany({}),
    Loan.deleteMany({}),
  ]);

  // create() dipakai (bukan insertMany) agar hook hashing password ikut berjalan.
  const createdUsers = await User.create(users);
  const createdBooks = await Book.create(books);
  const createdMembers = await Member.create(members);
  const admin = createdUsers[0];

  // Sebaran peminjaman 5 bulan ke belakang supaya grafik per bulan tidak datar.
  const plan = [
    { book: 0, member: 0, loanDate: monthsAgo(4, 5), status: 'dikembalikan' },
    { book: 1, member: 1, loanDate: monthsAgo(4, 18), status: 'dikembalikan' },
    { book: 2, member: 2, loanDate: monthsAgo(3, 3), status: 'dikembalikan' },
    { book: 4, member: 0, loanDate: monthsAgo(3, 21), status: 'dikembalikan' },
    { book: 3, member: 3, loanDate: monthsAgo(2, 9), status: 'dikembalikan' },
    { book: 0, member: 5, loanDate: monthsAgo(2, 14), status: 'dikembalikan' },
    { book: 7, member: 1, loanDate: monthsAgo(1, 6), status: 'dikembalikan' },
    { book: 8, member: 2, loanDate: monthsAgo(1, 22), status: 'dipinjam', dueDate: daysFromNow(-4) }, // terlambat
    { book: 5, member: 3, loanDate: daysFromNow(-10), status: 'dipinjam', dueDate: daysFromNow(4) },
    { book: 4, member: 1, loanDate: daysFromNow(-6), status: 'dipinjam', dueDate: daysFromNow(8) },
    { book: 6, member: 5, loanDate: daysFromNow(-3), status: 'dipinjam', dueDate: daysFromNow(11) },
    { book: 0, member: 3, loanDate: daysFromNow(-1), status: 'dipinjam', dueDate: daysFromNow(13) },
  ];

  const loans = [];
  for (const item of plan) {
    const book = createdBooks[item.book];
    const loanDate = item.loanDate;
    const dueDate = item.dueDate || new Date(loanDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    loans.push({
      book: book._id,
      member: createdMembers[item.member]._id,
      loanDate,
      dueDate,
      status: item.status,
      returnDate:
        item.status === 'dikembalikan'
          ? new Date(loanDate.getTime() + 7 * 24 * 60 * 60 * 1000)
          : null,
      handledBy: admin._id,
    });

    // Hanya peminjaman yang masih berjalan yang menahan stok.
    if (item.status === 'dipinjam') {
      book.available = Math.max(0, book.available - 1);
    }
  }

  await Loan.insertMany(loans);
  await Promise.all(createdBooks.map((book) => book.save()));

  console.log(`[seed] Selesai: ${createdUsers.length} user, ${createdBooks.length} buku, ${createdMembers.length} anggota, ${loans.length} peminjaman.`);
  console.log('[seed] Akun uji -> admin@unsia.ac.id / admin123  |  petugas@unsia.ac.id / petugas123');

  await disconnectDatabase();
}

run().catch(async (err) => {
  console.error('[seed] Gagal:', err);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
