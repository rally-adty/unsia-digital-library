const express = require('express');
const authRoutes = require('./authRoutes');
const bookRoutes = require('./bookRoutes');
const memberRoutes = require('./memberRoutes');
const loanRoutes = require('./loanRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API UNSIA Digital Library berjalan' });
});

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/members', memberRoutes);
router.use('/loans', loanRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
