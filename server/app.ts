import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import incidentRoutes from './routes/incidentRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import adminRoutes from './routes/adminRoutes';
import { getDBStatus, retryAtlasConnection } from './config/db';
import { seedInitialData } from './scripts/seedAdmin';

const app = express();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/admin', adminRoutes);

// Health & Database / SMTP Status Endpoint
app.get('/api/status', (req: Request, res: Response) => {
  const db = getDBStatus();
  const smtpConfigured = Boolean(
    process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      !process.env.SMTP_USER.includes('your_email') &&
      !process.env.SMTP_PASS.includes('your_gmail')
  );

  res.json({
    success: true,
    application: 'RescueGrid Emergency Operations',
    version: '2.0.0',
    database: {
      type: 'MongoDB',
      connected: db.isConnected,
      connectionMode: db.connectionType, // 'atlas' or 'memory'
      clusterHost: db.host,
      databaseName: db.databaseName,
      atlasConfigured: db.atlasConfigured,
      ipWhitelistNeeded: db.ipWhitelistNeeded,
      outboundIp: '34.34.254.229',
      error: db.error,
    },
    smtp: {
      host: process.env.SMTP_HOST && !process.env.SMTP_HOST.includes('@') ? process.env.SMTP_HOST : 'smtp.gmail.com',
      port: process.env.SMTP_PORT || '587',
      isConfigured: smtpConfigured,
    },
  });
});

// Retry Atlas connection on-demand once user adds 0.0.0.0/0
app.post('/api/db/retry-atlas', async (req: Request, res: Response) => {
  const result = await retryAtlasConnection();
  if (result.success) {
    try {
      await seedInitialData();
    } catch {
      // Data may already exist
    }
    res.json({ success: true, message: result.message });
  } else {
    res.status(502).json({ success: false, error: result.error });
  }
});

// Manual database re-seed endpoint (Admin or Initial Setup)
app.post('/api/seed', async (req: Request, res: Response) => {
  try {
    await seedInitialData();
    res.json({ success: true, message: 'Database verified / seeded.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Centralized error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[RescueGrid API Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error occurred',
  });
});

export default app;
