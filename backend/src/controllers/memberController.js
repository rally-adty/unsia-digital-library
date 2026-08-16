const Member = require('../models/Member');
const Loan = require('../models/Loan');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/members
const getMembers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filter = {};

  if (req.query.search) {
    const keyword = new RegExp(req.query.search.trim(), 'i');
    filter.$or = [{ name: keyword }, { memberCode: keyword }, { email: keyword }];
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const [items, total] = await Promise.all([
    Member.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Member.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  });
});

// GET /api/members/:id
const getMemberById = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) throw ApiError.notFound('Anggota tidak ditemukan');

  res.status(200).json({ success: true, data: member });
});

// POST /api/members
const createMember = asyncHandler(async (req, res) => {
  const { memberCode, name, email, phone, faculty, status } = req.body;

  const duplicate = await Member.findOne({
    $or: [{ memberCode: memberCode.toUpperCase() }, { email: email.toLowerCase() }],
  });
  if (duplicate) throw ApiError.conflict('Kode anggota atau email sudah terdaftar');

  const member = await Member.create({ memberCode, name, email, phone, faculty, status });

  res.status(201).json({ success: true, message: 'Anggota berhasil ditambahkan', data: member });
});

// PUT /api/members/:id
const updateMember = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) throw ApiError.notFound('Anggota tidak ditemukan');

  const { memberCode, name, email, phone, faculty, status } = req.body;

  if (memberCode || email) {
    const duplicate = await Member.findOne({
      _id: { $ne: member._id },
      $or: [
        ...(memberCode ? [{ memberCode: memberCode.toUpperCase() }] : []),
        ...(email ? [{ email: email.toLowerCase() }] : []),
      ],
    });
    if (duplicate) throw ApiError.conflict('Kode anggota atau email sudah dipakai anggota lain');
  }

  if (memberCode !== undefined) member.memberCode = memberCode;
  if (name !== undefined) member.name = name;
  if (email !== undefined) member.email = email;
  if (phone !== undefined) member.phone = phone;
  if (faculty !== undefined) member.faculty = faculty;
  if (status !== undefined) member.status = status;

  await member.save();

  res.status(200).json({ success: true, message: 'Anggota berhasil diperbarui', data: member });
});

// DELETE /api/members/:id
const deleteMember = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) throw ApiError.notFound('Anggota tidak ditemukan');

  const activeLoan = await Loan.countDocuments({ member: member._id, status: 'dipinjam' });
  if (activeLoan > 0) {
    throw ApiError.badRequest('Anggota masih memiliki peminjaman aktif dan tidak bisa dihapus');
  }

  await member.deleteOne();

  res
    .status(200)
    .json({ success: true, message: 'Anggota berhasil dihapus', data: { id: member._id } });
});

module.exports = { getMembers, getMemberById, createMember, updateMember, deleteMember };
