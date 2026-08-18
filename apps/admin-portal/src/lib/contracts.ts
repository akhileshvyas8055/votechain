import { ethers } from 'ethers';

export const VOTING_CORE_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_VOTING_CORE || '0x0000000000000000000000000000000000000000';
export const ELECTION_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ELECTION_MANAGER || '0x0000000000000000000000000000000000000000';

export const MinimalElectionABI = [
  'function getElectionStatus(uint256 electionId) external view returns (uint8)',
  'function certifyResults(uint256 electionId) external',
];

export function getContractInstance(address: string, abi: any, signerOrProvider: any) {
  return new ethers.Contract(address, abi, signerOrProvider);
}
