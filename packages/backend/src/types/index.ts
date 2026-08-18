import { Request } from 'express';
import { ElectionOfficer, OfficerRole, ElectionStatus as PrismaElectionStatus } from '@prisma/client';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: any;
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface JWTPayload {
  officerId: string;
  email: string;
  role: OfficerRole;
}

export interface MachineAuthPayload {
  boothCode: string;
  machineId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  machine?: MachineAuthPayload;
  reqId?: string;
}

export enum ElectionStatus {
  CREATED = 'CREATED',
  REGISTRATION = 'REGISTRATION',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
  CERTIFIED = 'CERTIFIED',
}

// Map Prisma status to our Enum
export const mapStatus = (status: PrismaElectionStatus): ElectionStatus => {
  return status as unknown as ElectionStatus;
};

// DTOs
export interface CreateElectionDTO {
  name: string;
  constituency: string;
  description?: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  candidateIds: string[];
}

export interface RegisterVoterDTO {
  voterIdNumber: string;
  name: string;
  dateOfBirth: string; // ISO Date
  constituency: string;
  district: string;
  state: string;
  fingerprintTemplateBase64: string; // Raw template from SDK
  aadhaarHash?: string;
}

export interface CastVoteDTO {
  fingerprintHash: string; // Pre-hashed or base64 raw template
  candidateId: string;
  electionId: string;
}

export interface VoteReceipt {
  txHash: string;
  boothId: string;
  timestamp: string;
}

export interface BlockchainVoteData {
  electionId: string;
  candidateId: string;
  boothId: string;
  timestamp: Date;
  txHash: string;
}
