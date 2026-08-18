import { prisma } from '../config/database';
import { electionManagerContract } from '../config/blockchain';
import { CreateElectionDTO } from '../types';
import { logger } from '../config/logger';
import { ElectionStatus } from '@prisma/client';

export class ElectionService {
  /**
   * Create a new election in DB and on Blockchain if available.
   */
  static async createElection(data: CreateElectionDTO, createdBy: string) {
    const blockchainCandidateIds: number[] = [];
    const nowUnix = Math.floor(Date.now() / 1000);
    
    let startUnix = Math.floor(new Date(data.startTime).getTime() / 1000);
    let endUnix = Math.floor(new Date(data.endTime).getTime() / 1000);

    // Ensure startUnix is in the future for contract validation
    if (isNaN(startUnix) || startUnix <= nowUnix) {
      startUnix = nowUnix + 10; // offset by 10 seconds to satisfy startTime >= block.timestamp
    }
    if (isNaN(endUnix) || endUnix <= startUnix) {
      endUnix = startUnix + 86400; // default to 24 hours duration
    }

    let electionIdOnChain: string = `ELEC-${Date.now()}`;

    // 1. Attempt on Blockchain if contract is valid
    try {
      if (electionManagerContract && electionManagerContract.target) {
        const tx = await electionManagerContract.createElection(
          data.name,
          data.constituency,
          startUnix,
          endUnix,
          blockchainCandidateIds
        );
        
        logger.info(`Blockchain election creation tx sent: ${tx.hash}`);
        const receipt = await tx.wait();
        
        const event = receipt?.logs?.find((log: any) => {
          try {
            const parsed = electionManagerContract.interface.parseLog(log);
            return parsed?.name === 'ElectionCreated';
          } catch (e) {
            return false;
          }
        });

        if (event) {
          const parsedLog = electionManagerContract.interface.parseLog(event);
          if (parsedLog?.args && parsedLog.args[0] !== undefined) {
            electionIdOnChain = parsedLog.args[0].toString();
          }
        }
      }
    } catch (error: any) {
      logger.warn('Blockchain election creation warning (using database persistence):', error?.reason || error?.message || error);
    }

    // 2. Always Create in Database
    const election = await prisma.election.create({
      data: {
        id: electionIdOnChain,
        name: data.name,
        constituency: data.constituency,
        description: data.description || '',
        startTime: new Date(startUnix * 1000),
        endTime: new Date(endUnix * 1000),
        chainId: 80001,
        createdBy: createdBy || 'ADMIN',
        status: ElectionStatus.CREATED,
      },
    });

    logger.info(`Election created successfully with ID: ${election.id}`);
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

    // Call blockchain safely
    try {
      if (electionManagerContract && electionManagerContract.target) {
        const numericId = parseInt(electionId.replace(/\D/g, '') || '1', 10);
        const tx = await electionManagerContract.startElection(numericId);
        await tx.wait();
      }
    } catch (error: any) {
      logger.warn('Blockchain startElection warning:', error?.message || error);
    }

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
    try {
      if (electionManagerContract && electionManagerContract.target) {
        const numericId = parseInt(electionId.replace(/\D/g, '') || '1', 10);
        const tx = await electionManagerContract.pauseElection(numericId, reason || 'Maintenance');
        await tx.wait();
      }
    } catch (error: any) {
      logger.warn('Blockchain pauseElection warning:', error?.message || error);
    }

    return prisma.election.update({
      where: { id: electionId },
      data: { status: ElectionStatus.PAUSED },
    });
  }

  /**
   * End an election.
   */
  static async endElection(electionId: string) {
    try {
      if (electionManagerContract && electionManagerContract.target) {
        const numericId = parseInt(electionId.replace(/\D/g, '') || '1', 10);
        const tx = await electionManagerContract.endElection(numericId);
        await tx.wait();
      }
    } catch (error: any) {
      logger.warn('Blockchain endElection warning:', error?.message || error);
    }

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

