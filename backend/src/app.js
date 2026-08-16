const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- Keamanan dasar ---
app.use(helmet()); // header keamanan HTTP
app.use(
  cors({
    origin(origin, callback) {
      // Origin kosong = request non-browser (Postman/cURL), tetap diizinkan.
      if (!origin || env.corsOrigin.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} tidak diizinkan oleh kebijakan CORS`));
    },
    credentials: true,
  })
);

// --- Parser & logging ---
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// --- Routing ---
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Secure UNSIA Digital Library API',
    docs: '/api/health',
  });
});
app.use('/api', routes);

// --- Penanganan error ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
