import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.string().optional().transform((val: string | undefined) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val: string | undefined) => (val ? parseInt(val, 10) : 10)),
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const Verify2FASchema = z.object({
  body: z.object({
    officerId: z.string().min(1, 'Invalid officer ID'),
    code: z.string().length(6, '2FA code must be 6 digits'),
  }),
});

export const CreateElectionSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    constituency: z.string().min(2, 'Constituency is required'),
    description: z.string().optional(),
    startTime: z.string(),
    endTime: z.string(),
    candidateIds: z.array(z.string()).optional().default([]),
  }),
});

export const RegisterVoterSchema = z.object({
  body: z.object({
    voterIdNumber: z.string().min(3, 'Voter ID is required'),
    name: z.string().min(2, 'Name is required'),
    dateOfBirth: z.string(),
    constituency: z.string().min(2, 'Constituency is required'),
    district: z.string().min(2, 'District is required'),
    state: z.string().min(2, 'State is required'),
    fingerprintTemplateBase64: z.string().optional().default(''),
    aadhaarHash: z.string().optional(),
  }),
});

export const CastVoteSchema = z.object({
  body: z.object({
    fingerprintHash: z.string().min(32, 'Invalid fingerprint hash'),
    candidateId: z.string().cuid('Invalid candidate ID'),
    electionId: z.string().cuid('Invalid election ID'),
  }),
});

export const RegisterCandidateSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    party: z.string().min(2, 'Party name is required'),
    symbol: z.string().min(2, 'Symbol is required'),
    constituency: z.string().min(2, 'Constituency is required'),
    photoBase64: z.string().optional(), // Will be uploaded to IPFS
  }),
});

export const RegisterBoothSchema = z.object({
  body: z.object({
    boothCode: z.string().min(3, 'Booth code is required'),
    name: z.string().min(3, 'Name is required'),
    location: z.string().min(3, 'Location is required'),
    district: z.string().min(2, 'District is required'),
    state: z.string().min(2, 'State is required'),
    officerId: z.string().cuid('Invalid officer ID'),
  }),
});

export const MachineTokenRequestSchema = z.object({
  body: z.object({
    boothCode: z.string().min(3, 'Booth code is required'),
    machineSecret: z.string().min(10, 'Machine secret is required'),
  }),
});
