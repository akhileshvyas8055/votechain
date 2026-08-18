import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import * as dotenv from 'dotenv';

dotenv.config();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || '0x' + '0'.repeat(64);
const POLYGON_MUMBAI_RPC = process.env.POLYGON_RPC_URL || 'https://rpc-mumbai.maticvigil.com';
const POLYGON_MAINNET_RPC = process.env.POLYGON_MAINNET_RPC_URL || 'https://polygon-rpc.com';
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || '';
const REPORT_GAS = process.env.REPORT_GAS === 'true';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.22',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      evmVersion: 'paris',
      metadata: {
        bytecodeHash: 'ipfs',
      },
    },
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: false,
      gas: 'auto',
      gasPrice: 'auto',
      mining: {
        auto: true,
        interval: 0,
      },
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    },
    polygon_mumbai: {
      url: POLYGON_MUMBAI_RPC,
      chainId: 80001,
      accounts: PRIVATE_KEY !== '0x' + '0'.repeat(64) ? [PRIVATE_KEY] : [],
      gasPrice: 'auto',
      verify: {
        etherscan: {
          apiUrl: 'https://api-testnet.polygonscan.com',
          apiKey: POLYGONSCAN_API_KEY,
        },
      },
    },
    polygon_mainnet: {
      url: POLYGON_MAINNET_RPC,
      chainId: 137,
      accounts: PRIVATE_KEY !== '0x' + '0'.repeat(64) ? [PRIVATE_KEY] : [],
      gasPrice: 'auto',
      verify: {
        etherscan: {
          apiUrl: 'https://api.polygonscan.com',
          apiKey: POLYGONSCAN_API_KEY,
        },
      },
    },
  },
  etherscan: {
    apiKey: {
      polygon: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
    },
  },
  gasReporter: {
    enabled: REPORT_GAS,
    currency: 'USD',
    gasPrice: 30,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || '',
    outputFile: 'gas-report.txt',
    noColors: true,
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    electionCommission1: {
      default: 1,
    },
    electionCommission2: {
      default: 2,
    },
    electionCommission3: {
      default: 3,
    },
    boothOfficer: {
      default: 4,
    },
    auditor: {
      default: 5,
    },
    machine: {
      default: 6,
    },
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6',
  },
  mocha: {
    timeout: 120000,
  },
};

export default config;
