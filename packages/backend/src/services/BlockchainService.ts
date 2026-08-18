import { ethers } from 'ethers';
import { provider, votingCoreContract } from '../config/blockchain';
import { logger } from '../config/logger';

export class BlockchainService {
  /**
   * General transaction submitter with retry logic and gas estimation
   */
  static async submitTransaction(
    contract: ethers.Contract,
    methodName: string,
    args: any[],
    options: ethers.Overrides = {}
  ): Promise<ethers.TransactionReceipt> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        // Estimate gas
        const estimatedGas = await (contract as any)[methodName].estimateGas(...args);
        
        // Add 20% buffer
        const gasLimit = (estimatedGas * 120n) / 100n;
        
        const txOptions = {
          ...options,
          gasLimit
        };

        const tx = await (contract as any)[methodName](...args, txOptions);
        logger.info(`Transaction ${tx.hash} submitted to network (${methodName})`);
        
        const receipt = await tx.wait();
        
        if (receipt.status !== 1) {
          throw new Error('Transaction reverted during execution');
        }

        return receipt;
      } catch (error: any) {
        attempt++;
        logger.warn(`Transaction attempt ${attempt} failed: ${error.message}`);
        
        if (attempt >= maxRetries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }

    throw new Error('Transaction failed after max retries');
  }

  /**
   * Listen to blockchain events for an election
   */
  static listenToVoteEvents(electionId: string, onVoteReceived: (data: any) => void) {
    if (!votingCoreContract || !votingCoreContract.filters || !votingCoreContract.filters.VoteCast) {
      logger.warn('VotingCore contract filters unavailable');
      return () => {};
    }

    const parsedId = parseInt(electionId, 10);
    const filter = votingCoreContract.filters.VoteCast(parsedId, null, null, null, null);
    
    votingCoreContract.on(filter, (eId: any, cId: any, boothId: string, timestamp: any, voteIdx: any, event: any) => {
      onVoteReceived({
        electionId: eId.toString(),
        candidateId: cId.toString(),
        boothId,
        timestamp: new Date(Number(timestamp) * 1000),
        voteIndex: voteIdx.toString(),
        txHash: event?.log?.transactionHash || ''
      });
    });

    logger.info(`Started listening to VoteCast events for election ${electionId}`);
    
    return () => {
      if (votingCoreContract) {
        votingCoreContract.off(filter);
      }
    };
  }

  /**
   * Estimate gas cost for an operation (in wei)
   */
  static async estimateGasCost(contract: ethers.Contract, method: string, args: any[]): Promise<bigint> {
    const gasLimit = await (contract as any)[method].estimateGas(...args);
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice ?? 0n;
    return gasLimit * gasPrice;
  }
}
