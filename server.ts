import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });

import express from 'express';
import app from './server/app';
import { connectDB } from './server/config/db';
import { seedInitialData } from './server/scripts/seedAdmin';
import { createServer as createViteServer } from 'vite';
import path from 'path';

const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseInt(process.env.PORT || '3000', 10);

function listenOnAvailablePort(port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, HOST, () => {
      resolve(port);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.warn(`[RescueGrid] Port ${port} is already in use. Trying ${port + 1}...`);
        resolve(listenOnAvailablePort(port + 1));
        return;
      }

      reject(error);
    });
  });
}

async function startServer() {
  try {
    // 1. Connect to MongoDB (Atlas if MONGODB_URI is provided, otherwise in-memory MongoDB)
    await connectDB();

    // 2. Automatically seed initial admin and sample data if collections are empty
    await seedInitialData();

    // 3. Mount Vite middlewares in development
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          host: HOST,
          port: Number(process.env.VITE_PORT || '5173'),
          strictPort: false,
          hmr: {
            host: 'localhost',
            port: Number(process.env.VITE_HMR_PORT || '24678'),
          },
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      // Production static serving
      const distPath = path.resolve(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }

    const actualPort = await listenOnAvailablePort(PORT);
    console.log(`[RescueGrid] Server successfully running on http://${HOST}:${actualPort}`);
    console.log(`[RescueGrid] Connected to MongoDB Atlas architecture with real Mongoose models.`);
  } catch (err: any) {
    console.error('[RescueGrid FATAL] Server startup failed:', err);
    process.exit(1);
  }
}

startServer();
