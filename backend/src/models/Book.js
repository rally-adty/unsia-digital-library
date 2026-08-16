const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Judul buku wajib diisi'],
      trim: true,
      maxlength: [150, 'Judul maksimal 150 karakter'],
    },
    author: {
      type: String,
      required: [true, 'Penulis wajib diisi'],
      trim: true,
      maxlength: [100, 'Nama penulis maksimal 100 karakter'],
    },
    category: {
      type: String,
      required: [true, 'Kategori wajib diisi'],
      trim: true,
      maxlength: [50, 'Kategori maksimal 50 karakter'],
      index: true,
    },
    isbn: {
      type: String,
      required: [true, 'ISBN wajib diisi'],
      unique: true,
      trim: true,
    },
    publisher: { type: String, trim: true, default: '' },
    year: {
      type: Number,
      min: [1500, 'Tahun terbit tidak masuk akal'],
      max: [new Date().getFullYear() + 1, 'Tahun terbit melebihi tahun berjalan'],
    },
    stock: {
      type: Number,
      required: [true, 'Jumlah stok wajib diisi'],
      min: [0, 'Stok tidak boleh negatif'],
      default: 1,
    },
    available: {
      type: Number,
      min: [0, 'Jumlah tersedia tidak boleh negatif'],
      default: 0,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Buku baru: seluruh stok dianggap tersedia.
bookSchema.pre('validate', function syncAvailable(next) {
  if (this.isNew && (this.available === undefined || this.available === 0)) {
    this.available = this.stock;
  }
  if (this.available > this.stock) {
    this.available = this.stock;
  }
  return next();
});

module.exports = mongoose.model('Book', bookSchema);
