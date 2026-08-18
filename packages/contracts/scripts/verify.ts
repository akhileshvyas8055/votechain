import { ethers, upgrades } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const network = await ethers.provider.getNetwork();
  const networkName = network.chainId === 31337n ? 'localhost' : network.name;
  
  const deploymentsPath = path.join(__dirname, `../deployments/${networkName}.json`);
  if (!fs.existsSync(deploymentsPath)) {
    console.error(`Deployment file not found at ${deploymentsPath}`);
    process.exit(1);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
  const contracts = deployments.contracts;

  console.log('Verifying contracts on Polygonscan...');

  try {
    // 1. Verify EVMAccessControl
    console.log(`Verifying EVMAccessControl at ${contracts.EVMAccessControl}...`);
    // Note: for proxy contracts, we often need hardhat-upgrades verification task or to get implementation address
    const accessControlImpl = await upgrades.erc1967.getImplementationAddress(contracts.EVMAccessControl);
    await hre.run('verify:verify', {
      address: accessControlImpl,
      constructorArguments: [],
    });
    console.log('EVMAccessControl verified');
  } catch (e: any) {
    console.error('Verification failed for EVMAccessControl:', e.message);
  }

  try {
    const voterRegistryImpl = await upgrades.erc1967.getImplementationAddress(contracts.VoterRegistry);
    await hre.run('verify:verify', {
      address: voterRegistryImpl,
      constructorArguments: [],
    });
    console.log('VoterRegistry verified');
  } catch (e: any) {
    console.error('Verification failed for VoterRegistry:', e.message);
  }

  try {
    const candidateRegistryImpl = await upgrades.erc1967.getImplementationAddress(contracts.CandidateRegistry);
    await hre.run('verify:verify', {
      address: candidateRegistryImpl,
      constructorArguments: [],
    });
    console.log('CandidateRegistry verified');
  } catch (e: any) {
    console.error('Verification failed for CandidateRegistry:', e.message);
  }

  try {
    const electionManagerImpl = await upgrades.erc1967.getImplementationAddress(contracts.ElectionManager);
    await hre.run('verify:verify', {
      address: electionManagerImpl,
      constructorArguments: [],
    });
    console.log('ElectionManager verified');
  } catch (e: any) {
    console.error('Verification failed for ElectionManager:', e.message);
  }

  try {
    const votingCoreImpl = await upgrades.erc1967.getImplementationAddress(contracts.VotingCore);
    await hre.run('verify:verify', {
      address: votingCoreImpl,
      constructorArguments: [],
    });
    console.log('VotingCore verified');
  } catch (e: any) {
    console.error('Verification failed for VotingCore:', e.message);
  }

  try {
    const resultsManagerImpl = await upgrades.erc1967.getImplementationAddress(contracts.ResultsManager);
    await hre.run('verify:verify', {
      address: resultsManagerImpl,
      constructorArguments: [],
    });
    console.log('ResultsManager verified');
  } catch (e: any) {
    console.error('Verification failed for ResultsManager:', e.message);
  }

  try {
    const auditTrailImpl = await upgrades.erc1967.getImplementationAddress(contracts.AuditTrail);
    await hre.run('verify:verify', {
      address: auditTrailImpl,
      constructorArguments: [],
    });
    console.log('AuditTrail verified');
  } catch (e: any) {
    console.error('Verification failed for AuditTrail:', e.message);
  }

  console.log('Verification process completed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
