import { prisma } from '../config/database';
import { votingCoreContract } from '../config/blockchain';
import { CastVoteDTO, VoteReceipt } from '../types';
import { logger } from '../config/logger';
import { io } from '../server'; // Assuming WebSocket server instance is exported

export class VotingService {
  /**
   * Cast a vote. This is the most critical function.
   * Validates state locally, then calls the blockchain.
   */
  static async castVote(data: CastVoteDTO, boothId: string): Promise<VoteReceipt> {
    const { fingerprintHash, candidateId, electionId } = data;

    // 1. Initial Local Validation (Fail fast before blockchain)
    const election = await prisma.election.findUnique({ where: { id: electionId } });
    if (!election || election.status !== 'ACTIVE') {
      throw new Error('Election is not active');
    }

    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate || candidate.electionId !== electionId) {
      throw new Error('Invalid candidate');
    }

    // Secondary local check (Primary check is on blockchain)
    const existingTx = await prisma.voteTransaction.findFirst({
      where: { 
        electionId, 
        // In reality, we wouldn't store which voter cast which vote to maintain secrecy.
        // We rely on the blockchain to prevent double voting via the fingerprint hash.
      }
    });

    // 2. Submit to Blockchain
    let txHash = '';
    let blockNumber = 0n;
    
    try {
      // The fingerprintHash is expected to be a hex string starting with 0x (32 bytes)
      const fpHashHex = fingerprintHash.startsWith('0x') ? fingerprintHash : `0x${fingerprintHash}`;
      const blockchainCandidateId = candidate.blockchainCandidateId;
      const parsedElectionId = parseInt(electionId, 10);

      logger.info(`Submitting vote for election ${electionId} from booth ${boothId}...`);
      
      const tx = await votingCoreContract.castVote(
        fpHashHex,
        blockchainCandidateId,
        parsedElectionId,
        boothId
      );

      // Wait for confirmation
      const receipt = await tx.wait();
      
      txHash = receipt.hash;
      blockNumber = BigInt(receipt.blockNumber);
      
      logger.info(`Vote confirmed in block ${blockNumber}. TxHash: ${txHash}`);

    } catch (error: any) {
      logger.error('Vote submission to blockchain failed:', error);
      
      // Determine if it was a revert from our contract
      if (error.reason) {
        throw new Error(`Vote rejected: ${error.reason}`);
      }
      throw new Error('Failed to process vote on blockchain');
    }

    // 3. Store Transaction Record in DB (Metadata only, no voter linkage)
    await prisma.voteTransaction.create({
      data: {
        txHash,
        blockNumber,
        boothId,
        electionId,
        candidateId,
        timestamp: new Date(),
        status: 'CONFIRMED',
      }
    });

    // Update local election vote count
    await prisma.election.update({
      where: { id: electionId },
      data: { totalVotes: { increment: 1 } }
    });

    await prisma.booth.update({
      where: { id: boothId },
      data: { totalVotes: { increment: 1 } }
    });

    // 4. Emit WebSocket Event for Real-Time Updates
    if (io) {
      io.to(`election_${electionId}`).emit('vote_cast', {
        electionId,
        candidateId,
        boothId,
        timestamp: new Date().toISOString()
      });
    }

    // 5. Return Receipt
    return {
      txHash,
      boothId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verify a vote transaction locally using the txHash.
   */
  static async verifyVote(txHash: string) {
    const tx = await prisma.voteTransaction.findUnique({
      where: { txHash },
      include: { 
        election: { select: { name: true } },
        booth: { select: { location: true } }
      }
    });

    if (!tx) {
      return { verified: false, message: 'Transaction not found in local database' };
    }

    // Check blockchain
    try {
      // We would use the verifyVote function on the contract if we have the voteHash
      // Here we assume checking if the txHash is mined
      const receipt = await votingCoreContract.runner.provider?.getTransactionReceipt(txHash);
      
      if (receipt && receipt.status === 1) {
        return {
          verified: true,
          details: {
            election: tx.election.name,
            booth: tx.booth.location,
            timestamp: tx.timestamp,
            blockNumber: tx.blockNumber.toString()
          }
        };
      }
      return { verified: false, message: 'Transaction not confirmed on blockchain' };
    } catch (err) {
      return { verified: false, message: 'Error checking blockchain' };
    }
  }

  static async getBoothVoteCount(boothId: string, electionId: string): Promise<number> {
    return prisma.voteTransaction.count({
      where: { boothId, electionId }
    });
  }
}
