const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    memberCode: {
      type: String,
      required: [true, 'Kode anggota wajib diisi'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Nama anggota wajib diisi'],
      trim: true,
      maxlength: [80, 'Nama maksimal 80 karakter'],
    },
    email: {
      type: String,
      required: [true, 'Email anggota wajib diisi'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Format email tidak valid'],
    },
    phone: { type: String, trim: true, default: '' },
    faculty: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['aktif', 'nonaktif'],
      default: 'aktif',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Member', memberSchema);
