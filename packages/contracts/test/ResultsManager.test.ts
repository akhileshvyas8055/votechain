import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import {
  EVMAccessControl,
  CandidateRegistry,
  ElectionManager,
  VotingCore,
  ResultsManager,
  VoterRegistry
} from '../typechain-types';
import { time } from '@nomicfoundation/hardhat-network-helpers';

describe('ResultsManager', function () {
  let accessControl: EVMAccessControl;
  let candidateRegistry: CandidateRegistry;
  let electionManager: ElectionManager;
  let votingCore: VotingCore;
  let resultsManager: ResultsManager;
  let voterRegistry: VoterRegistry;

  let ecMember: SignerWithAddress;
  let machine: SignerWithAddress;
  let boothOfficer: SignerWithAddress;

  const CONSTITUENCY = 'Dist-1';
  let electionId = 1n;
  let c1: bigint, c2: bigint;

  beforeEach(async function () {
    const [admin, ec, mach, officer] = await ethers.getSigners();
    ecMember = ec;
    machine = mach;
    boothOfficer = officer;

    const AC = await ethers.getContractFactory('EVMAccessControl');
    accessControl = (await upgrades.deployProxy(AC, [], { kind: 'uups' })) as unknown as EVMAccessControl;
    const acAddr = await accessControl.getAddress();

    await accessControl.grantRole(await accessControl.ELECTION_COMMISSION_ROLE(), ecMember.address);
    await accessControl.connect(ecMember).grantMachineAccess(machine.address);
    await accessControl.connect(ecMember).grantBoothOfficerRole(boothOfficer.address);

    const VR = await ethers.getContractFactory('VoterRegistry');
    voterRegistry = (await upgrades.deployProxy(VR, [acAddr], { kind: 'uups' })) as unknown as VoterRegistry;
    
    const CR = await ethers.getContractFactory('CandidateRegistry');
    candidateRegistry = (await upgrades.deployProxy(CR, [acAddr], { kind: 'uups' })) as unknown as CandidateRegistry;

    const EM = await ethers.getContractFactory('ElectionManager');
    electionManager = (await upgrades.deployProxy(EM, [acAddr], { kind: 'uups' })) as unknown as ElectionManager;

    const VC = await ethers.getContractFactory('VotingCore');
    votingCore = (await upgrades.deployProxy(VC, [
      acAddr, await voterRegistry.getAddress(), await candidateRegistry.getAddress(), await electionManager.getAddress()
    ], { kind: 'uups' })) as unknown as VotingCore;

    const RM = await ethers.getContractFactory('ResultsManager');
    resultsManager = (await upgrades.deployProxy(RM, [
      acAddr, await votingCore.getAddress(), await candidateRegistry.getAddress(), await electionManager.getAddress()
    ], { kind: 'uups' })) as unknown as ResultsManager;

    // Setup Scenario
    await candidateRegistry.connect(ecMember).addCandidate('A', 'P1', 'S1', 'hash1', CONSTITUENCY);
    await candidateRegistry.connect(ecMember).addCandidate('B', 'P2', 'S2', 'hash2', CONSTITUENCY);
    c1 = 1n; c2 = 2n;

    const start = (await time.latest()) + 60;
    await electionManager.connect(ecMember).createElection('Elec', CONSTITUENCY, start, start + 3600, [c1, c2]);
    await time.increaseTo(start + 1);
    await electionManager.connect(ecMember).startElection(electionId);

    // Cast some votes
    const fp1 = ethers.keccak256(ethers.toUtf8Bytes('v1'));
    const fp2 = ethers.keccak256(ethers.toUtf8Bytes('v2'));
    const fp3 = ethers.keccak256(ethers.toUtf8Bytes('v3'));

    await voterRegistry.connect(boothOfficer).batchRegisterVoters(
      ['v1','v2','v3'], [fp1, fp2, fp3], [CONSTITUENCY, CONSTITUENCY, CONSTITUENCY]
    );

    await votingCore.connect(machine).castVote(fp1, c1, electionId, 'b1');
    await votingCore.connect(machine).castVote(fp2, c1, electionId, 'b1'); // c1 gets 2
    await votingCore.connect(machine).castVote(fp3, c2, electionId, 'b2'); // c2 gets 1

    await electionManager.connect(ecMember).endElection(electionId);
  });

  it('Should compute results correctly and sort', async function () {
    const results = await resultsManager.getResults(electionId);
    expect(results.length).to.equal(2);
    
    // c1 should win (2 votes out of 3 = 66.66% = 6666 basis points)
    expect(results[0].candidateId).to.equal(c1);
    expect(results[0].votes).to.equal(2);
    expect(results[0].percentage).to.equal(6666);

    expect(results[1].candidateId).to.equal(c2);
    expect(results[1].votes).to.equal(1);
    expect(results[1].percentage).to.equal(3333);
  });

  it('Should determine winner correctly', async function () {
    const winner = await resultsManager.getWinner(electionId);
    expect(winner.candidateId).to.equal(c1);
    expect(winner.votes).to.equal(2);
  });

  it('Should publish results and generate hash', async function () {
    const tx = await resultsManager.connect(ecMember).publishResults(electionId);
    const receipt = await tx.wait();
    const event = receipt?.logs.find((e: any) => e.fragment?.name === 'ResultsPublished');
    
    expect((event as any).args[0]).to.equal(electionId);
    expect(await resultsManager.isPublished(electionId)).to.be.true;
    expect(await resultsManager.verifyResultIntegrity(electionId)).to.be.true;
  });

  it('Should revert if publishing before election ends', async function () {
    // create a new one that isn't ended
    const start = (await time.latest()) + 60;
    await electionManager.connect(ecMember).createElection('E2', CONSTITUENCY, start, start + 3600, [c1]);
    await expect(
      resultsManager.connect(ecMember).publishResults(2)
    ).to.be.revertedWithCustomError(resultsManager, 'ElectionNotEnded');
  });
});
