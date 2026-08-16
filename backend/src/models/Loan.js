const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Buku yang dipinjam wajib diisi'],
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Anggota peminjam wajib diisi'],
    },
    loanDate: { type: Date, default: Date.now },
    dueDate: {
      type: Date,
      required: [true, 'Tanggal jatuh tempo wajib diisi'],
    },
    returnDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['dipinjam', 'dikembalikan'],
      default: 'dipinjam',
      index: true,
    },
    note: { type: String, trim: true, default: '' },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Terlambat = masih dipinjam dan sudah melewati jatuh tempo.
loanSchema.virtual('isOverdue').get(function isOverdue() {
  return this.status === 'dipinjam' && this.dueDate < new Date();
});

module.exports = mongoose.model('Loan', loanSchema);
