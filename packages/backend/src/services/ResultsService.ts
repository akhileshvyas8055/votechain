import { resultsManagerContract, electionManagerContract } from '../config/blockchain';
import { prisma } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import { logger } from '../config/logger';

export class ResultsService {
  /**
   * Get live results for an election.
   * Fetches from blockchain and caches in Redis for 30s.
   */
  static async getLiveResults(electionId: string) {
    const cacheKey = `results:${electionId}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const parsedId = parseInt(electionId, 10);
      
      // Fetch from blockchain contract
      const resultsRaw = await resultsManagerContract.getResults(parsedId);
      
      const results = resultsRaw.map((r: any) => ({
        candidateId: r.candidateId.toString(),
        candidateName: r.candidateName,
        party: r.party,
        votes: Number(r.votes),
        percentage: Number(r.percentage) / 100 // Convert basis points to standard percentage
      }));

      // Cache for 30 seconds
      await cacheSet(cacheKey, JSON.stringify(results), 30);
      
      return results;
    } catch (error) {
      logger.error('Failed to get results from blockchain:', error);
      throw new Error('Failed to retrieve live results');
    }
  }

  /**
   * Get the winner of an election.
   */
  static async getWinner(electionId: string) {
    try {
      const parsedId = parseInt(electionId, 10);
      const winner = await resultsManagerContract.getWinner(parsedId);
      
      return {
        candidateId: winner.candidateId.toString(),
        candidateName: winner.candidateName,
        party: winner.party,
        votes: Number(winner.votes),
        percentage: Number(winner.percentage) / 100
      };
    } catch (error) {
      logger.error('Failed to get winner:', error);
      throw new Error('Failed to retrieve winner or election not ended');
    }
  }

  /**
   * Publish results officially.
   */
  static async publishResults(electionId: string) {
    const parsedId = parseInt(electionId, 10);
    const tx = await resultsManagerContract.publishResults(parsedId);
    await tx.wait();
    
    // Update DB status if needed
    await prisma.election.update({
      where: { id: electionId },
      data: { status: 'CERTIFIED' } // Assuming publish is part of certification process
    });
    
    return true;
  }

  /**
   * Get booth-wise results from DB for detailed analytics.
   */
  static async getBoothWiseResults(electionId: string) {
    const booths = await prisma.booth.findMany({
      where: { electionId },
      include: {
        voteTransactions: {
          select: { candidateId: true }
        }
      }
    });

    const candidateVotesByBooth: any = {};
    
    for (const booth of booths) {
      candidateVotesByBooth[booth.id] = {
        boothName: booth.name,
        location: booth.location,
        totalVotes: booth.totalVotes,
        candidates: {}
      };

      for (const tx of booth.voteTransactions) {
        if (!candidateVotesByBooth[booth.id].candidates[tx.candidateId]) {
          candidateVotesByBooth[booth.id].candidates[tx.candidateId] = 0;
        }
        candidateVotesByBooth[booth.id].candidates[tx.candidateId]++;
      }
    }

    return candidateVotesByBooth;
  }
}
