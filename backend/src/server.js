const app = require('./app');
const env = require('./config/env');
const { connectDatabase } = require('./config/db');

async function start() {
  try {
    await connectDatabase();

    const server = app.listen(env.port, () => {
      console.log(`[server] Berjalan di http://localhost:${env.port} (${env.nodeEnv})`);
    });

    // Matikan server dengan rapi agar koneksi yang berjalan tidak terputus paksa.
    const shutdown = (signal) => {
      console.log(`\n[server] Menerima ${signal}, menutup server...`);
      server.close(() => process.exit(0));
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('[server] Gagal menjalankan aplikasi:', err.message);
    process.exit(1);
  }
}

start();
