import { prisma } from '../config/database';
import { electionManagerContract } from '../config/blockchain';
import { CreateElectionDTO } from '../types';
import { logger } from '../config/logger';
import { ElectionStatus } from '@prisma/client';

export class ElectionService {
  /**
   * Create a new election in DB and on Blockchain.
   */
  static async createElection(data: CreateElectionDTO, createdBy: string) {
    const blockchainCandidateIds: number[] = [];
    const startUnix = Math.floor(new Date(data.startTime).getTime() / 1000);
    const endUnix = Math.floor(new Date(data.endTime).getTime() / 1000);

    // 1. Create on Blockchain
    let electionIdOnChain: number;
    try {
      const tx = await electionManagerContract.createElection(
        data.name,
        data.constituency,
        startUnix,
        endUnix,
        blockchainCandidateIds
      );
      
      const receipt = await tx.wait();
      
      // Parse event to get the election ID
      // This requires the contract ABI to have the event properly parsed by ethers
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = electionManagerContract.interface.parseLog(log);
          return parsed?.name === 'ElectionCreated';
        } catch (e) {
          return false;
        }
      });

      if (!event) throw new Error('ElectionCreated event not found in receipt');
      
      const parsedLog = electionManagerContract.interface.parseLog(event);
      electionIdOnChain = Number(parsedLog?.args[0]);
      
    } catch (error: any) {
      logger.error('Blockchain election creation failed:', error);
      throw new Error(`Blockchain error: ${error.reason || error.message}`);
    }

    // 2. Create in DB
    const election = await prisma.election.create({
      data: {
        id: electionIdOnChain.toString(), // Keep synchronized with on-chain ID
        name: data.name,
        constituency: data.constituency,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        chainId: 80001,
        createdBy,
        status: ElectionStatus.CREATED,
      },
    });


    return election;
  }

  /**
   * Start an election.
   */
  static async startElection(electionId: string) {
    const election = await prisma.election.findUnique({ where: { id: electionId } });
    if (!election) throw new Error('Election not found');

    if (election.status !== ElectionStatus.CREATED && election.status !== ElectionStatus.REGISTRATION) {
      throw new Error(`Cannot start election from status ${election.status}`);
    }

    // Call blockchain
    const tx = await electionManagerContract.startElection(parseInt(electionId, 10));
    await tx.wait();

    // Update DB
    return prisma.election.update({
      where: { id: electionId },
      data: { status: ElectionStatus.ACTIVE },
    });
  }

  /**
   * Pause an election.
   */
  static async pauseElection(electionId: string, reason: string) {
    // Blockchain call
    const tx = await electionManagerContract.pauseElection(parseInt(electionId, 10), reason);
    await tx.wait();

    // DB Update
    return prisma.election.update({
      where: { id: electionId },
      data: { status: ElectionStatus.PAUSED },
    });
  }

  /**
   * End an election.
   */
  static async endElection(electionId: string) {
    // Blockchain call
    const tx = await electionManagerContract.endElection(parseInt(electionId, 10));
    await tx.wait();

    // DB Update
    return prisma.election.update({
      where: { id: electionId },
      data: { status: ElectionStatus.ENDED },
    });
  }

  /**
   * Get active elections.
   */
  static async getActiveElections() {
    return prisma.election.findMany({
      where: { status: ElectionStatus.ACTIVE },
      include: { candidates: true, booths: true },
    });
  }
}
