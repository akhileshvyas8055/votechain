import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment variables schema with validation.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.string().default('12').transform((val) => parseInt(val, 10)),

  // Blockchain
  POLYGON_RPC_URL: z.string().url(),
  POLYGON_CHAIN_ID: z.string().transform((val) => parseInt(val, 10)),
  EVM_MACHINE_SIGNING_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Must be a valid private key'),

  // Smart Contracts
  CONTRACT_VOTER_REGISTRY: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  CONTRACT_CANDIDATE_REGISTRY: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  CONTRACT_ELECTION_MANAGER: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  CONTRACT_VOTING_CORE: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  CONTRACT_RESULTS_MANAGER: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  CONTRACT_AUDIT_TRAIL: z.string().regex(/^0x[a-fA-F0-9]{40}$/),

  // IPFS
  IPFS_URL: z.string().url().optional(),

  // Crypto
  ENCRYPTION_KEY: z.string().length(64, 'Must be 32 bytes hex encoded'),
  FINGERPRINT_SALT: z.string().min(16),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform((val) => parseInt(val, 10)),
});

// Validate the environment variables
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  _env.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = _env.data;
