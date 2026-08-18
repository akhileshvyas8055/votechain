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
import { prisma } from './config/database';

// Add database sync logic
const syncToDB = async (key: string, data: any) => {
  try {
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value: JSON.stringify(data), updatedBy: 'system' },
      create: { key, value: JSON.stringify(data), updatedBy: 'system' }
    });
  } catch (err) {
    console.error(`[DB SYNC ERROR] Failed to sync ${key}:`, err);
  }
};

const loadFromDB = async () => {
  try {
    console.log('[DB] Loading state from Supabase PostgreSQL...');
    const configs = await prisma.systemConfig.findMany();
    for (const conf of configs) {
      if (conf.key.startsWith('votechain_')) {
        memoryStore[conf.key] = JSON.parse(conf.value);
      }
    }
    console.log('[DB] State successfully loaded into memoryStore.');
  } catch (err) {
    console.error('[DB ERROR] Failed to load state from DB:', err);
  }
};

// Load data on startup
loadFromDB();

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

// Mock sync for local frontend-only testing
const memoryStore: Record<string, any> = {};
app.post('/api/mock/sync', (req, res) => {
  const { key, data } = req.body;
  if (key) {
    memoryStore[key] = data;
    syncToDB(key, data);
  }
  res.json({ success: true });
});
app.get('/api/mock/elections/active', (req, res) => {
  const elections = memoryStore['votechain_elections'] || [];
  const active = elections.find((e: any) => e.status === 'ACTIVE' || e.status === 'CREATED');
  if (active) {
    res.json({ success: true, data: active });
  } else {
    res.json({ success: false, message: 'No active election' });
  }
});
app.post('/api/mock/voter/verify-fingerprint', (req, res) => {
  const { voterId } = req.body;
  const voters = memoryStore['votechain_voters'] || [];
  const voter = voters.find((v: any) => v.voterIdNumber === voterId || v.id === voterId);
  
  if (!voter) {
    return res.json({ success: false, message: 'Fingerprint Not Registered' });
  }
  if (voter.hasVoted) {
    return res.json({ success: false, message: 'Vote Already Cast' });
  }
  
  return res.json({ success: true, data: voter });
});

app.post('/api/mock/vote/cast', (req, res) => {
  const { electionId, candidateId, voterId } = req.body;
  console.log(`[VOTE DEBUG] Request received: electionId=${electionId}, candidateId=${candidateId}, voterId=${voterId}`);
  
  const elections = memoryStore['votechain_elections'] || [];
  const voters = memoryStore['votechain_voters'] || [];
  
  const election = elections.find((e: any) => e.id === electionId);
  const voter = voters.find((v: any) => v.voterIdNumber === voterId || v.id === voterId);
  
  if (!election || !voter) {
    console.log('[VOTE DEBUG] Validation failed: Election or Voter not found');
    return res.json({ success: false, message: 'Invalid data' });
  }
  if (voter.hasVoted) {
    console.log('[VOTE DEBUG] Voter has already voted');
    return res.json({ success: false, message: 'Vote Already Cast' });
  }

  // Update vote in memory
  voter.hasVoted = true;
  voter.votedElectionId = electionId;
  
  const cand = election.candidates.find((c: any) => c.id === candidateId);
  if (cand) {
    cand.votes += 1;
    console.log(`[VOTE DEBUG] Candidate ${cand.name} (${cand.id}) votes incremented to ${cand.votes}`);
  } else {
    console.log(`[VOTE DEBUG] WARNING: Candidate ID ${candidateId} not found in election ${electionId}!`);
  }
  election.totalVotes += 1;
  console.log(`[VOTE DEBUG] Election total votes incremented to ${election.totalVotes}`);
  
  // Add audit log
  const audits = memoryStore['votechain_audit'] || [];
  const hash = '0x' + Math.random().toString(16).substring(2,15) + Math.random().toString(16).substring(2,15);
  audits.unshift({
    id: `AUDIT-${Date.now()}`,
    action: 'VOTE_CAST',
    entityType: 'Vote',
    entityId: `${electionId}/${candidateId}`,
    performedBy: voterId,
    timestamp: new Date().toISOString(),
    txHash: hash,
    status: 'CONFIRMED'
  });
  memoryStore['votechain_audit'] = audits;

  // Sync state to DB
  syncToDB('votechain_voters', voters);
  syncToDB('votechain_elections', elections);
  syncToDB('votechain_audit', audits);
  
  res.json({ success: true, message: 'Vote Successfully Cast' });
});

app.get('/api/mock/data', (req, res) => {
  res.json({
    elections: memoryStore['votechain_elections'],
    voters: memoryStore['votechain_voters'],
    audit: memoryStore['votechain_audit']
  });
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
    try {
      await validateBlockchainConnection();
    } catch (bcError) {
      logger.warn('Blockchain connection failed, but starting server anyway for UI testing:', bcError);
    }
    
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

// Trigger nodemon restart

// CORS and RPC fix restart

// Final restart trigger
