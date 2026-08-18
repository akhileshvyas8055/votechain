import { resultsManagerContract } from '../config/blockchain';
import { prisma } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import { logger } from '../config/logger';

export class ResultsService {
  /**
   * Get live results for an election.
   * Fetches from blockchain if available, or tallies from local PostgreSQL.
   */
  static async getLiveResults(electionId: string) {
    const cacheKey = `results:${electionId}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      if (resultsManagerContract && resultsManagerContract.target) {
        const parsedId = parseInt(electionId.replace(/\D/g, '') || '1', 10);
        const resultsRaw = await (resultsManagerContract as any).getResults(parsedId);
        
        const results = resultsRaw.map((r: any) => ({
          candidateId: r.candidateId.toString(),
          candidateName: r.candidateName,
          party: r.party,
          votes: Number(r.votes),
          percentage: Number(r.percentage) / 100
        }));

        await cacheSet(cacheKey, JSON.stringify(results), 30);
        return results;
      }
    } catch (error: any) {
      logger.warn('Failed to get results from blockchain, calculating from database:', error?.message || error);
    }

    // Database fallback tally calculation
    const candidates = await prisma.candidate.findMany({
      where: { electionId }
    });

    const totalVotes = await prisma.voteTransaction.count({
      where: { electionId }
    });

    const results = await Promise.all(
      candidates.map(async (c) => {
        const votes = await prisma.voteTransaction.count({
          where: { electionId, candidateId: c.id }
        });
        const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
        return {
          candidateId: c.id,
          candidateName: c.name,
          party: c.party,
          votes,
          percentage: Math.round(percentage * 100) / 100
        };
      })
    );

    await cacheSet(cacheKey, JSON.stringify(results), 30);
    return results;
  }

  /**
   * Get the winner of an election.
   */
  static async getWinner(electionId: string) {
    const results = await this.getLiveResults(electionId);
    if (!results || results.length === 0) {
      throw new Error('No candidate results available');
    }
    
    // Sort descending by votes
    const sorted = [...results].sort((a, b) => b.votes - a.votes);
    return sorted[0];
  }

  /**
   * Publish results officially.
   */
  static async publishResults(electionId: string) {
    try {
      if (resultsManagerContract && resultsManagerContract.target) {
        const parsedId = parseInt(electionId.replace(/\D/g, '') || '1', 10);
        const tx = await (resultsManagerContract as any).publishResults(parsedId);
        await tx.wait();
      }
    } catch (error: any) {
      logger.warn('Blockchain publishResults warning:', error?.message || error);
    }
    
    await prisma.election.update({
      where: { id: electionId },
      data: { status: 'ENDED' }
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
