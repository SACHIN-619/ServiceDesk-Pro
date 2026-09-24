import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { checkSLABreaches } from './services/slaEngine.js';

import http from 'http';
import { initSocket } from './services/socketService.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import slaRoutes from './routes/slaRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import kbRoutes from './routes/kbRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

// Connect MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or requests without origin header (e.g. mobile apps, curl, health checks)
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback allow
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Status & Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'ServiceDesk Pro ITSM Backend API',
    version: '1.0.0',
    documentation: '/api/health',
    timestamp: new Date()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'ServiceDesk Pro ITSM Backend API',
    timestamp: new Date()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sla', slaRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// Background SLA Breach Monitoring Job (runs every 2 minutes)
setInterval(() => {
  checkSLABreaches();
}, 2 * 60 * 1000);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`[ServiceDesk Pro Server]: Listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  console.log(`[Health Endpoint]: http://localhost:${PORT}/api/health`);
});
