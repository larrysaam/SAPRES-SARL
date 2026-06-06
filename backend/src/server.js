import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import config from './config/env.js';

async function start() {
  try {
    await connectDB();
    const server = http.createServer(app);
    server.listen(config.port, () => {
      console.log(`✓ Server running on port ${config.port}`);
      console.log(`✓ Environment: ${config.env}`);
    });

    process.on('unhandledRejection', (err) => {
      console.error('✗ Unhandled Rejection:', err);
      server.close(() => process.exit(1));
    });

    process.on('SIGTERM', () => {
      console.log('✓ SIGTERM received, gracefully shutting down');
      server.close(() => process.exit(0));
    });
  } catch (err) {
    console.error('✗ Failed to start server:', err);
    process.exit(1);
  }
}

start();
