import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import {
  EVMAccessControl,
  VoterRegistry,
  CandidateRegistry,
  ElectionManager,
  VotingCore,
} from '../typechain-types';

describe('VotingCore', function () {
  let accessControl: EVMAccessControl;
  let voterRegistry: VoterRegistry;
  let candidateRegistry: CandidateRegistry;
  let electionManager: ElectionManager;
  let votingCore: VotingCore;

  let admin: SignerWithAddress;
  let ecMember: SignerWithAddress;
  let boothOfficer: SignerWithAddress;
  let machine: SignerWithAddress;

  const CONSTITUENCY = 'District-1';
  const ELECTION_NAME = 'General Election 2024';
  const BOOTH_ID = 'B-001';
  let electionId: bigint;
  let candidateId: bigint;
  let fingerprintHash: string;

  beforeEach(async function () {
    [admin, ecMember, boothOfficer, machine] = await ethers.getSigners();

    // Deploy Access Control
    const EVMAccessControl = await ethers.getContractFactory('EVMAccessControl');
    accessControl = (await upgrades.deployProxy(EVMAccessControl, [], { kind: 'uups' })) as unknown as EVMAccessControl;
    const acAddr = await accessControl.getAddress();

    // Grant roles
    await accessControl.grantRole(await accessControl.ELECTION_COMMISSION_ROLE(), ecMember.address);
    await accessControl.connect(ecMember).grantBoothOfficerRole(boothOfficer.address);
    await accessControl.connect(ecMember).grantMachineAccess(machine.address);

    // Deploy Registries
    const VoterRegistry = await ethers.getContractFactory('VoterRegistry');
    voterRegistry = (await upgrades.deployProxy(VoterRegistry, [acAddr], { kind: 'uups' })) as unknown as VoterRegistry;
    const vrAddr = await voterRegistry.getAddress();

    const CandidateRegistry = await ethers.getContractFactory('CandidateRegistry');
    candidateRegistry = (await upgrades.deployProxy(CandidateRegistry, [acAddr], { kind: 'uups' })) as unknown as CandidateRegistry;
    const crAddr = await candidateRegistry.getAddress();

    const ElectionManager = await ethers.getContractFactory('ElectionManager');
    electionManager = (await upgrades.deployProxy(ElectionManager, [acAddr], { kind: 'uups' })) as unknown as ElectionManager;
    const emAddr = await electionManager.getAddress();

    // Deploy Voting Core
    const VotingCore = await ethers.getContractFactory('VotingCore');
    votingCore = (await upgrades.deployProxy(VotingCore, [acAddr, vrAddr, crAddr, emAddr], { kind: 'uups' })) as unknown as VotingCore;

    // Setup Test Data
    // 1. Add Candidate
    const addTx = await candidateRegistry.connect(ecMember).addCandidate('John Doe', 'Party A', 'Sun', 'ipfs_hash', CONSTITUENCY);
    const receipt = await addTx.wait();
    const event = receipt?.logs.find((e: any) => e.fragment?.name === 'CandidateAdded');
    candidateId = (event as any).args[0];

    // 2. Create Election
    const startTime = Math.floor(Date.now() / 1000) + 60; // 1 min from now
    const endTime = startTime + 3600; // 1 hour duration
    const createTx = await electionManager.connect(ecMember).createElection(ELECTION_NAME, CONSTITUENCY, startTime, endTime, [candidateId]);
    const emReceipt = await createTx.wait();
    const emEvent = emReceipt?.logs.find((e: any) => e.fragment?.name === 'ElectionCreated');
    electionId = (emEvent as any).args[0];

    // 3. Register Voter
    fingerprintHash = ethers.keccak256(ethers.toUtf8Bytes('voter_fingerprint'));
    await voterRegistry.connect(boothOfficer).registerVoter('V-001', fingerprintHash, CONSTITUENCY);
  });

  describe('Vote Casting', function () {
    it('Should allow machine to cast valid vote', async function () {
      // Start election
      await electionManager.connect(ecMember).startElection(electionId);

      await expect(votingCore.connect(machine).castVote(fingerprintHash, candidateId, electionId, BOOTH_ID))
        .to.emit(votingCore, 'VoteCast')
        .withArgs(electionId, candidateId, BOOTH_ID, (any: any) => true, 0);

      expect(await votingCore.getVoteCount(electionId, candidateId)).to.equal(1);
      expect(await votingCore.getTotalVotesForElection(electionId)).to.equal(1);
      expect(await voterRegistry.hasVoterVoted(fingerprintHash)).to.be.true;
    });

    it('Should prevent duplicate voting', async function () {
      await electionManager.connect(ecMember).startElection(electionId);
      await votingCore.connect(machine).castVote(fingerprintHash, candidateId, electionId, BOOTH_ID);

      await expect(
        votingCore.connect(machine).castVote(fingerprintHash, candidateId, electionId, BOOTH_ID)
      ).to.be.revertedWithCustomError(votingCore, 'VoterAlreadyVotedInElection');
    });

    it('Should revert if election is not active', async function () {
      await expect(
        votingCore.connect(machine).castVote(fingerprintHash, candidateId, electionId, BOOTH_ID)
      ).to.be.revertedWithCustomError(votingCore, 'ElectionNotActive');
    });

    it('Should revert if voter is not registered', async function () {
      await electionManager.connect(ecMember).startElection(electionId);
      const unregisteredHash = ethers.keccak256(ethers.toUtf8Bytes('fake'));

      await expect(
        votingCore.connect(machine).castVote(unregisteredHash, candidateId, electionId, BOOTH_ID)
      ).to.be.revertedWithCustomError(votingCore, 'VoterNotRegistered');
    });

    it('Should revert if candidate constituency mismatch', async function () {
      // Register voter in different constituency
      const fpHash2 = ethers.keccak256(ethers.toUtf8Bytes('v2'));
      await voterRegistry.connect(boothOfficer).registerVoter('V-002', fpHash2, 'Other-District');
      
      await electionManager.connect(ecMember).startElection(electionId);

      await expect(
        votingCore.connect(machine).castVote(fpHash2, candidateId, electionId, BOOTH_ID)
      ).to.be.revertedWithCustomError(votingCore, 'CandidateNotInConstituency');
    });
  });

  describe('Pausability', function () {
    it('Should not allow voting when paused', async function () {
      await electionManager.connect(ecMember).startElection(electionId);
      await votingCore.connect(ecMember).emergencyPause();

      await expect(
        votingCore.connect(machine).castVote(fingerprintHash, candidateId, electionId, BOOTH_ID)
      ).to.be.revertedWithCustomError(votingCore, 'EnforcedPause');
    });
  });
});
