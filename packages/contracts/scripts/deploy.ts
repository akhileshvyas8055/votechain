import { ethers, upgrades } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await ethers.provider.getBalance(deployer.address)).toString());

  const network = await ethers.provider.getNetwork();
  console.log(`Deploying to network: ${network.name} (${network.chainId})`);

  // 1. Deploy EVMAccessControl
  console.log('\nDeploying EVMAccessControl...');
  const EVMAccessControl = await ethers.getContractFactory('EVMAccessControl');
  const accessControl = await upgrades.deployProxy(EVMAccessControl, [], { kind: 'uups' });
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log('EVMAccessControl deployed to:', accessControlAddress);

  // 2. Deploy VoterRegistry
  console.log('\nDeploying VoterRegistry...');
  const VoterRegistry = await ethers.getContractFactory('VoterRegistry');
  const voterRegistry = await upgrades.deployProxy(VoterRegistry, [accessControlAddress], { kind: 'uups' });
  await voterRegistry.waitForDeployment();
  const voterRegistryAddress = await voterRegistry.getAddress();
  console.log('VoterRegistry deployed to:', voterRegistryAddress);

  // 3. Deploy CandidateRegistry
  console.log('\nDeploying CandidateRegistry...');
  const CandidateRegistry = await ethers.getContractFactory('CandidateRegistry');
  const candidateRegistry = await upgrades.deployProxy(CandidateRegistry, [accessControlAddress], { kind: 'uups' });
  await candidateRegistry.waitForDeployment();
  const candidateRegistryAddress = await candidateRegistry.getAddress();
  console.log('CandidateRegistry deployed to:', candidateRegistryAddress);

  // 4. Deploy ElectionManager
  console.log('\nDeploying ElectionManager...');
  const ElectionManager = await ethers.getContractFactory('ElectionManager');
  const electionManager = await upgrades.deployProxy(ElectionManager, [accessControlAddress], { kind: 'uups' });
  await electionManager.waitForDeployment();
  const electionManagerAddress = await electionManager.getAddress();
  console.log('ElectionManager deployed to:', electionManagerAddress);

  // 5. Deploy VotingCore
  console.log('\nDeploying VotingCore...');
  const VotingCore = await ethers.getContractFactory('VotingCore');
  const votingCore = await upgrades.deployProxy(
    VotingCore,
    [accessControlAddress, voterRegistryAddress, candidateRegistryAddress, electionManagerAddress],
    { kind: 'uups' }
  );
  await votingCore.waitForDeployment();
  const votingCoreAddress = await votingCore.getAddress();
  console.log('VotingCore deployed to:', votingCoreAddress);

  // 6. Deploy ResultsManager
  console.log('\nDeploying ResultsManager...');
  const ResultsManager = await ethers.getContractFactory('ResultsManager');
  const resultsManager = await upgrades.deployProxy(
    ResultsManager,
    [accessControlAddress, votingCoreAddress, candidateRegistryAddress, electionManagerAddress],
    { kind: 'uups' }
  );
  await resultsManager.waitForDeployment();
  const resultsManagerAddress = await resultsManager.getAddress();
  console.log('ResultsManager deployed to:', resultsManagerAddress);

  // 7. Deploy AuditTrail
  console.log('\nDeploying AuditTrail...');
  const AuditTrail = await ethers.getContractFactory('AuditTrail');
  const auditTrail = await upgrades.deployProxy(AuditTrail, [accessControlAddress], { kind: 'uups' });
  await auditTrail.waitForDeployment();
  const auditTrailAddress = await auditTrail.getAddress();
  console.log('AuditTrail deployed to:', auditTrailAddress);

  // Save deployment info
  const deployments = {
    network: network.name,
    chainId: network.chainId.toString(),
    contracts: {
      EVMAccessControl: accessControlAddress,
      VoterRegistry: voterRegistryAddress,
      CandidateRegistry: candidateRegistryAddress,
      ElectionManager: electionManagerAddress,
      VotingCore: votingCoreAddress,
      ResultsManager: resultsManagerAddress,
      AuditTrail: auditTrailAddress,
    },
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const networkName = network.chainId === 31337n ? 'localhost' : network.name;
  fs.writeFileSync(
    path.join(deploymentsDir, `${networkName}.json`),
    JSON.stringify(deployments, null, 2)
  );

  console.log(`\nDeployment details saved to deployments/${networkName}.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
