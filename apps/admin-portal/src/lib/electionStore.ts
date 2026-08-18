'use client';

/**
 * ElectionStore — Frontend-first data persistence layer.
 * All election, candidate, voter, and vote data is persisted in localStorage.
 * When the backend API is available, data is synced there too.
 * This ensures the app works fully even without Docker/PostgreSQL/Redis.
 */

export interface Candidate {
  id: string;
  name: string;
  party: string;
  symbol: string;
  votes: number;
}

export interface Voter {
  id: string;
  voterIdNumber: string;
  name: string;
  dateOfBirth: string;
  constituency: string;
  district: string;
  state: string;
  registeredAt: string;
  hasVoted: boolean;
  votedElectionId?: string;
}

export interface Election {
  id: string;
  name: string;
  constituency: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'CREATED' | 'REGISTRATION' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'CERTIFIED';
  totalVotes: number;
  candidates: Candidate[];
  contractAddress: string;
  txHash: string;
  chainId: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  timestamp: string;
  txHash: string;
  status: 'CONFIRMED' | 'PENDING';
}

const KEYS = {
  ELECTIONS: 'votechain_elections',
  VOTERS: 'votechain_voters',
  AUDIT: 'votechain_audit',
};

function read<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
  // Sync to backend for EVM machine
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  fetch(`${apiUrl}/api/mock/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, data })
  }).catch(() => {});
}

// Auto-sync on load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    ['votechain_elections', 'votechain_voters'].forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        fetch(`${apiUrl}/api/mock/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, data: JSON.parse(data) })
        }).catch(() => {});
      }
    });
  }, 1000);

  // Poll backend for new votes
  setInterval(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(`${apiUrl}/api/mock/data`)
      .then(res => res.json())
      .then(data => {
        if (data.elections) localStorage.setItem('votechain_elections', JSON.stringify(data.elections));
        if (data.voters) localStorage.setItem('votechain_voters', JSON.stringify(data.voters));
        if (data.audit) localStorage.setItem('votechain_audit', JSON.stringify(data.audit));
        // Force Next.js re-render by triggering a fake storage event
        window.dispatchEvent(new Event('storage'));
      })
      .catch(() => {});
  }, 5000);
}

function generateTxHash(): string {
  const hex = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) hash += hex[Math.floor(Math.random() * 16)];
  return hash;
}

function generateAddress(): string {
  const hex = '0123456789abcdef';
  let addr = '0x';
  for (let i = 0; i < 40; i++) addr += hex[Math.floor(Math.random() * 16)];
  return addr;
}

// ─── Election Operations ───────────────────────────

export function getAllElections(): Election[] {
  return read<Election>(KEYS.ELECTIONS, []);
}

export function getElectionById(id: string): Election | undefined {
  return getAllElections().find((e) => e.id === id);
}

export function getElectionsByStatus(status: Election['status']): Election[] {
  return getAllElections().filter((e) => e.status === status);
}

export function createElection(data: {
  name: string;
  constituency: string;
  description: string;
  startTime: string;
  endTime: string;
  candidates: Array<{ name: string; party: string; symbol: string }>;
}): Election {
  const elections = getAllElections();
  const now = new Date().toISOString();
  const txHash = generateTxHash();
  const contractAddress = generateAddress();

  const election: Election = {
    id: `ELEC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    name: data.name,
    constituency: data.constituency,
    description: data.description,
    startTime: data.startTime,
    endTime: data.endTime,
    status: 'CREATED',
    totalVotes: 0,
    candidates: data.candidates.map((c, i) => ({
      id: `CAND-${Date.now()}-${i}`,
      name: c.name,
      party: c.party,
      symbol: c.symbol || '🗳️',
      votes: 0,
    })),
    contractAddress,
    txHash,
    chainId: 80001,
    createdBy: 'Election Commissioner',
    createdAt: now,
    updatedAt: now,
  };

  elections.unshift(election);
  write(KEYS.ELECTIONS, elections);

  // Add audit entry
  addAuditEntry({
    action: 'ELECTION_CREATED',
    entityType: 'Election',
    entityId: election.id,
    performedBy: 'Election Commissioner',
  });

  return election;
}

export function updateElectionStatus(id: string, status: Election['status']): Election | null {
  const elections = getAllElections();
  const idx = elections.findIndex((e) => e.id === id);
  if (idx === -1) return null;

  const election = elections[idx];
  if (!election) return null;

  election.status = status;
  election.updatedAt = new Date().toISOString();
  write(KEYS.ELECTIONS, elections);

  addAuditEntry({
    action: `ELECTION_${status}`,
    entityType: 'Election',
    entityId: id,
    performedBy: 'Election Commissioner',
  });

  return election;
}

export function addCandidateToElection(electionId: string, candidate: { name: string; party: string; symbol: string }): Candidate | null {
  const elections = getAllElections();
  const idx = elections.findIndex((e) => e.id === electionId);
  if (idx === -1) return null;

  const newCand: Candidate = {
    id: `CAND-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: candidate.name,
    party: candidate.party,
    symbol: candidate.symbol || '🗳️',
    votes: 0,
  };

  const election = elections[idx];
  if (!election) return null;

  election.candidates.push(newCand);
  election.updatedAt = new Date().toISOString();
  write(KEYS.ELECTIONS, elections);

  addAuditEntry({
    action: 'CANDIDATE_ADDED',
    entityType: 'Candidate',
    entityId: newCand.id,
    performedBy: 'Election Commissioner',
  });

  return newCand;
}

export function castVote(electionId: string, candidateId: string, voterId: string): boolean {
  const elections = getAllElections();
  const idx = elections.findIndex((e) => e.id === electionId);
  if (idx === -1) return false;

  const election = elections[idx];
  if (!election || election.status !== 'ACTIVE') return false;

  const candIdx = election.candidates.findIndex((c) => c.id === candidateId);
  if (candIdx === -1) return false;

  // Check voter eligibility
  const voters = getAllVoters();
  const voter = voters.find((v) => v.id === voterId || v.voterIdNumber === voterId);
  if (voter?.hasVoted) return false;

  // Record vote
  const cand = election.candidates[candIdx];
  if (!cand) return false;
  
  cand.votes += 1;
  election.totalVotes += 1;
  elections[idx] = election;
  write(KEYS.ELECTIONS, elections);

  // Mark voter as voted
  if (voter) {
    voter.hasVoted = true;
    voter.votedElectionId = electionId;
    write(KEYS.VOTERS, voters);
  }

  addAuditEntry({
    action: 'VOTE_CAST',
    entityType: 'Vote',
    entityId: `${electionId}/${candidateId}`,
    performedBy: voterId,
  });

  return true;
}

// ─── Voter Operations ──────────────────────────────

export function getAllVoters(): Voter[] {
  return read<Voter>(KEYS.VOTERS, []);
}

export function registerVoter(data: {
  voterIdNumber: string;
  name: string;
  dateOfBirth: string;
  constituency: string;
  district: string;
  state: string;
}): Voter {
  const voters = getAllVoters();

  // Check duplicate
  const existing = voters.find((v) => v.voterIdNumber === data.voterIdNumber);
  if (existing) throw new Error(`Voter ${data.voterIdNumber} is already registered`);

  const voter: Voter = {
    id: `VOTER-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...data,
    registeredAt: new Date().toISOString(),
    hasVoted: false,
  };

  voters.push(voter);
  write(KEYS.VOTERS, voters);

  addAuditEntry({
    action: 'VOTER_REGISTERED',
    entityType: 'Voter',
    entityId: voter.id,
    performedBy: 'Booth Officer',
  });

  return voter;
}

// ─── Audit Operations ──────────────────────────────

export function getAllAuditEntries(): AuditEntry[] {
  return read<AuditEntry>(KEYS.AUDIT, []);
}

export function addAuditEntry(data: {
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
}): AuditEntry {
  const entries = getAllAuditEntries();
  const entry: AuditEntry = {
    id: `AUDIT-${Date.now()}`,
    ...data,
    timestamp: new Date().toISOString(),
    txHash: generateTxHash(),
    status: 'CONFIRMED',
  };

  entries.unshift(entry);
  if (entries.length > 100) entries.length = 100; // Keep last 100
  write(KEYS.AUDIT, entries);
  return entry;
}

// ─── Dashboard Stats ───────────────────────────────

export function getDashboardStats() {
  const elections = getAllElections();
  const voters = getAllVoters();

  return {
    totalElections: elections.length,
    activePolls: elections.filter((e) => e.status === 'ACTIVE').length,
    upcomingElections: elections.filter((e) => e.status === 'CREATED' || e.status === 'REGISTRATION').length,
    completedElections: elections.filter((e) => e.status === 'ENDED' || e.status === 'CERTIFIED').length,
    totalVoters: voters.length,
    totalVotes: elections.reduce((sum, e) => sum + e.totalVotes, 0),
  };
}
