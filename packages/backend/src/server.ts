import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { env } from './config/env';
import { logger, stream } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { validateBlockchainConnection } from './config/blockchain';

// Routes
import authRoutes from './routes/auth';
import electionRoutes from './routes/elections';
import voterRoutes from './routes/voters';
import votingRoutes from './routes/voting';

const app = express();
const httpServer = createServer(app);

// WebSocket setup for real-time updates (e.g. live vote counts)
export const io = new Server(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  logger.info(`WebSocket connected: ${socket.id}`);
  
  socket.on('join_election_room', (electionId) => {
    socket.join(`election_${electionId}`);
    logger.info(`Socket ${socket.id} joined room election_${electionId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`WebSocket disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors({ origin: env.CORS_ORIGIN.split(',') }));
app.use(compression()); // Gzip response body
app.use(express.json({ limit: '10mb' })); // Support large payloads (for biometric data)
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream })); // HTTP request logging

// Request ID middleware for tracing
app.use((req, res, next) => {
  (req as any).reqId = Math.random().toString(36).substring(7);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
const API_PREFIX = '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/elections`, electionRoutes);
app.use(`${API_PREFIX}/voters`, voterRoutes);
app.use(`${API_PREFIX}/voting`, votingRoutes);

// Global Error Handler (must be last middleware)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Validate critical external connections before starting
    await validateBlockchainConnection();
    
    httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`🔗 API Gateway: http://localhost:${env.PORT}${API_PREFIX}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
