import { ethers, upgrades } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

export async function deployAllContracts() {
  const [admin, ecMember, boothOfficer, machine, auditor] = await ethers.getSigners();

  const AC = await ethers.getContractFactory('EVMAccessControl');
  const accessControl = await upgrades.deployProxy(AC, [], { kind: 'uups' });
  const acAddr = await accessControl.getAddress();

  await accessControl.grantRole(await (accessControl as any).ELECTION_COMMISSION_ROLE(), ecMember.address);
  await (accessControl as any).connect(ecMember).grantMachineAccess(machine.address);
  await (accessControl as any).connect(ecMember).grantBoothOfficerRole(boothOfficer.address);
  await (accessControl as any).connect(ecMember).grantAuditorRole(auditor.address);

  const VR = await ethers.getContractFactory('VoterRegistry');
  const voterRegistry = await upgrades.deployProxy(VR, [acAddr], { kind: 'uups' });
  
  const CR = await ethers.getContractFactory('CandidateRegistry');
  const candidateRegistry = await upgrades.deployProxy(CR, [acAddr], { kind: 'uups' });

  const EM = await ethers.getContractFactory('ElectionManager');
  const electionManager = await upgrades.deployProxy(EM, [acAddr], { kind: 'uups' });

  const VC = await ethers.getContractFactory('VotingCore');
  const votingCore = await upgrades.deployProxy(VC, [
    acAddr, await voterRegistry.getAddress(), await candidateRegistry.getAddress(), await electionManager.getAddress()
  ], { kind: 'uups' });

  const RM = await ethers.getContractFactory('ResultsManager');
  const resultsManager = await upgrades.deployProxy(RM, [
    acAddr, await votingCore.getAddress(), await candidateRegistry.getAddress(), await electionManager.getAddress()
  ], { kind: 'uups' });

  const AT = await ethers.getContractFactory('AuditTrail');
  const auditTrail = await upgrades.deployProxy(AT, [acAddr], { kind: 'uups' });

  return {
    accessControl,
    voterRegistry,
    candidateRegistry,
    electionManager,
    votingCore,
    resultsManager,
    auditTrail,
    signers: { admin, ecMember, boothOfficer, machine, auditor }
  };
}
