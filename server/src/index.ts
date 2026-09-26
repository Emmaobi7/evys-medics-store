import { app } from './app';
import { config } from './config/env';
import { pool } from './db/connection';

const PORT = config.port;

const server = app.listen(PORT, async () => {
  console.log(`=========================================`);
  console.log(`🏥 Evy's Projects API Server running`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
  console.log(`📦 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📂 DB Schema: ${config.dbSchema}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`=========================================`);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    await pool.end();
    console.log('[Server] Database pool closed.');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('[Server] SIGINT received. Shutting down gracefully...');
  server.close(async () => {
    await pool.end();
    console.log('[Server] Database pool closed.');
    process.exit(0);
  });
});
