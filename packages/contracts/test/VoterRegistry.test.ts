import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { EVMAccessControl, VoterRegistry } from '../typechain-types';

describe('VoterRegistry', function () {
  let accessControl: EVMAccessControl;
  let voterRegistry: VoterRegistry;
  let admin: SignerWithAddress;
  let ecMember: SignerWithAddress;
  let boothOfficer: SignerWithAddress;
  let machine: SignerWithAddress;
  let auditor: SignerWithAddress;
  let other: SignerWithAddress;

  beforeEach(async function () {
    [admin, ecMember, boothOfficer, machine, auditor, other] = await ethers.getSigners();

    const EVMAccessControl = await ethers.getContractFactory('EVMAccessControl');
    accessControl = (await upgrades.deployProxy(EVMAccessControl, [], { kind: 'uups' })) as unknown as EVMAccessControl;

    // Grant roles
    await accessControl.grantRole(await accessControl.ELECTION_COMMISSION_ROLE(), ecMember.address);
    await accessControl.connect(ecMember).grantBoothOfficerRole(boothOfficer.address);
    await accessControl.connect(ecMember).grantMachineAccess(machine.address);
    await accessControl.connect(ecMember).grantAuditorRole(auditor.address);

    const VoterRegistry = await ethers.getContractFactory('VoterRegistry');
    const acAddress = await accessControl.getAddress();
    voterRegistry = (await upgrades.deployProxy(VoterRegistry, [acAddress], { kind: 'uups' })) as unknown as VoterRegistry;
  });

  describe('Deployment', function () {
    it('Should set the right access control', async function () {
      expect(await voterRegistry.accessControl()).to.equal(await accessControl.getAddress());
    });
  });

  describe('Registration', function () {
    const voterId = 'VOTER-001';
    const fingerprintHash = ethers.keccak256(ethers.toUtf8Bytes('fingerprint1'));
    const constituency = 'District-1';

    it('Should allow booth officer to register a voter', async function () {
      await expect(voterRegistry.connect(boothOfficer).registerVoter(voterId, fingerprintHash, constituency))
        .to.emit(voterRegistry, 'VoterRegistered')
        .withArgs(voterId, fingerprintHash, constituency, boothOfficer.address, (any: any) => true);

      expect(await voterRegistry.isVoterRegistered(fingerprintHash)).to.be.true;
    });

    it('Should revert if non-officer tries to register', async function () {
      await expect(
        voterRegistry.connect(other).registerVoter(voterId, fingerprintHash, constituency)
      ).to.be.revertedWithCustomError(voterRegistry, 'UnauthorizedCaller');
    });

    it('Should revert on duplicate registration', async function () {
      await voterRegistry.connect(boothOfficer).registerVoter(voterId, fingerprintHash, constituency);
      await expect(
        voterRegistry.connect(boothOfficer).registerVoter('VOTER-002', fingerprintHash, constituency)
      ).to.be.revertedWithCustomError(voterRegistry, 'VoterAlreadyRegistered');
    });
  });

  describe('Batch Registration', function () {
    it('Should batch register voters', async function () {
      const ids = ['V1', 'V2', 'V3'];
      const hashes = [
        ethers.keccak256(ethers.toUtf8Bytes('f1')),
        ethers.keccak256(ethers.toUtf8Bytes('f2')),
        ethers.keccak256(ethers.toUtf8Bytes('f3')),
      ];
      const consts = ['C1', 'C1', 'C2'];

      await expect(voterRegistry.connect(boothOfficer).batchRegisterVoters(ids, hashes, consts))
        .to.emit(voterRegistry, 'BatchVotersRegistered')
        .withArgs(3, boothOfficer.address, (any: any) => true);

      expect(await voterRegistry.isVoterRegistered(hashes[0])).to.be.true;
    });
  });

  describe('Voting Status', function () {
    const fingerprintHash = ethers.keccak256(ethers.toUtf8Bytes('f1'));

    beforeEach(async function () {
      await voterRegistry.connect(boothOfficer).registerVoter('V1', fingerprintHash, 'C1');
    });

    it('Should allow machine to mark voter as voted', async function () {
      await expect(voterRegistry.connect(machine).markVoterAsVoted(fingerprintHash, 1))
        .to.emit(voterRegistry, 'VoterMarkedAsVoted')
        .withArgs(fingerprintHash, 1, (any: any) => true);

      expect(await voterRegistry.hasVoterVoted(fingerprintHash)).to.be.true;
    });

    it('Should revert if already voted', async function () {
      await voterRegistry.connect(machine).markVoterAsVoted(fingerprintHash, 1);
      await expect(
        voterRegistry.connect(machine).markVoterAsVoted(fingerprintHash, 2)
      ).to.be.revertedWithCustomError(voterRegistry, 'VoterAlreadyVoted');
    });
  });

  describe('Access Control', function () {
    const fingerprintHash = ethers.keccak256(ethers.toUtf8Bytes('f1'));

    beforeEach(async function () {
      await voterRegistry.connect(boothOfficer).registerVoter('V1', fingerprintHash, 'C1');
    });

    it('Should allow auditor to read info', async function () {
      const info = await voterRegistry.connect(auditor).getVoterInfo(fingerprintHash);
      expect(info.voterId).to.equal('V1');
      expect(info.isRegistered).to.be.true;
    });

    it('Should allow EC to revoke voter', async function () {
      await expect(voterRegistry.connect(ecMember).revokeVoter(fingerprintHash, 'Fraud'))
        .to.emit(voterRegistry, 'VoterRevoked');

      expect(await voterRegistry.isVoterRegistered(fingerprintHash)).to.be.false;
    });
  });
});
