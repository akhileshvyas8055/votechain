import { ethers } from 'ethers';
import { env } from './env';
import { logger } from './logger';

// Dummy ABIs - in a real scenario these would be imported from the compiled artifacts
const VotingCoreABI = [
  'function castVote(bytes32 fingerprintHash, uint256 candidateId, uint256 electionId, string boothId) external',
  'function verifyVote(bytes32 txFingerprint) external view returns (bool)',
  'function getVoteCount(uint256 electionId, uint256 candidateId) external view returns (uint256)',
  'function getTotalVotesForElection(uint256 electionId) external view returns (uint256)',
  'event VoteCast(uint256 indexed electionId, uint256 indexed candidateId, string boothId, uint256 timestamp, uint256 voteIndex)',
];

const VoterRegistryABI = [
  'function registerVoter(string voterId, bytes32 fingerprintHash, string constituency) external',
  'function batchRegisterVoters(string[] voterIds, bytes32[] fingerprintHashes, string[] constituencies) external',
  'function isVoterRegistered(bytes32 fingerprintHash) external view returns (bool)',
];

const CandidateRegistryABI = [
  'function getCandidate(uint256 candidateId) external view returns (tuple(uint256 id, string name, string party, string symbol, string photoIPFSHash, string constituency, bool isActive, uint256 nominationTimestamp, address addedBy))',
];

const ElectionManagerABI = [
  'function createElection(string name, string constituency, uint256 startTime, uint256 endTime, uint256[] candidateIds) external returns (uint256)',
  'function startElection(uint256 electionId) external',
  'function endElection(uint256 electionId) external',
  'function getElectionStatus(uint256 electionId) external view returns (uint8)',
];

const ResultsManagerABI = [
  'function getResults(uint256 electionId) external view returns (tuple(uint256 candidateId, string candidateName, string party, uint256 votes, uint256 percentage)[])',
];

const AuditTrailABI = [
  'function logAction(uint8 action, bytes32 entityHash, string boothId, bytes32 dataHash) external',
];

// Initialize Provider
export const provider = new ethers.JsonRpcProvider(env.POLYGON_RPC_URL, env.POLYGON_CHAIN_ID);

// Initialize Signer for the Machine
export const machineSigner = new ethers.Wallet(env.EVM_MACHINE_SIGNING_KEY, provider);

// Initialize Contracts
export const votingCoreContract = new ethers.Contract(env.CONTRACT_VOTING_CORE, VotingCoreABI, machineSigner);
export const voterRegistryContract = new ethers.Contract(env.CONTRACT_VOTER_REGISTRY, VoterRegistryABI, machineSigner);
export const candidateRegistryContract = new ethers.Contract(env.CONTRACT_CANDIDATE_REGISTRY, CandidateRegistryABI, provider);
export const electionManagerContract = new ethers.Contract(env.CONTRACT_ELECTION_MANAGER, ElectionManagerABI, machineSigner);
export const resultsManagerContract = new ethers.Contract(env.CONTRACT_RESULTS_MANAGER, ResultsManagerABI, provider);
export const auditTrailContract = new ethers.Contract(env.CONTRACT_AUDIT_TRAIL, AuditTrailABI, machineSigner);

/**
 * Checks connection to the blockchain node
 */
export async function validateBlockchainConnection() {
  try {
    const network = await provider.getNetwork();
    logger.info(`✅ Connected to blockchain: ${network.name} (Chain ID: ${network.chainId})`);
  } catch (error) {
    logger.error('❌ Failed to connect to blockchain node:', error);
    throw error;
  }
}
