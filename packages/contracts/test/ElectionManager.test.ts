import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { EVMAccessControl, ElectionManager } from '../typechain-types';
import { time } from '@nomicfoundation/hardhat-network-helpers';

describe('ElectionManager', function () {
  let accessControl: EVMAccessControl;
  let electionManager: ElectionManager;
  let admin: SignerWithAddress;
  let ecMember1: SignerWithAddress;
  let ecMember2: SignerWithAddress;
  let ecMember3: SignerWithAddress;
  let other: SignerWithAddress;

  beforeEach(async function () {
    [admin, ecMember1, ecMember2, ecMember3, other] = await ethers.getSigners();

    const EVMAccessControl = await ethers.getContractFactory('EVMAccessControl');
    accessControl = (await upgrades.deployProxy(EVMAccessControl, [], { kind: 'uups' })) as unknown as EVMAccessControl;
    
    await accessControl.grantRole(await accessControl.ELECTION_COMMISSION_ROLE(), ecMember1.address);
    await accessControl.grantRole(await accessControl.ELECTION_COMMISSION_ROLE(), ecMember2.address);
    await accessControl.grantRole(await accessControl.ELECTION_COMMISSION_ROLE(), ecMember3.address);

    const ElectionManager = await ethers.getContractFactory('ElectionManager');
    const acAddr = await accessControl.getAddress();
    electionManager = (await upgrades.deployProxy(ElectionManager, [acAddr], { kind: 'uups' })) as unknown as ElectionManager;
  });

  describe('Lifecycle', function () {
    const name = 'Local Election';
    const constituency = 'Ward-1';
    let startTime: number;
    let endTime: number;
    const candidates = [1n, 2n];

    beforeEach(async function () {
      startTime = (await time.latest()) + 3600; // 1 hour from now
      endTime = startTime + 86400; // 1 day duration
    });

    it('Should create election correctly', async function () {
      await expect(electionManager.connect(ecMember1).createElection(name, constituency, startTime, endTime, candidates))
        .to.emit(electionManager, 'ElectionCreated')
        .withArgs(1, name, constituency, ecMember1.address, startTime, endTime);

      const status = await electionManager.getElectionStatus(1);
      expect(status).to.equal(0); // CREATED
    });

    it('Should revert if start time is in the past', async function () {
      const pastTime = (await time.latest()) - 3600;
      await expect(
        electionManager.connect(ecMember1).createElection(name, constituency, pastTime, endTime, candidates)
      ).to.be.revertedWithCustomError(electionManager, 'StartTimeInPast');
    });

    it('Should start an election', async function () {
      await electionManager.connect(ecMember1).createElection(name, constituency, startTime, endTime, candidates);
      await expect(electionManager.connect(ecMember1).startElection(1))
        .to.emit(electionManager, 'ElectionStarted');
      
      expect(await electionManager.isElectionActive(1)).to.be.true;
    });

    it('Should pause and resume election', async function () {
      await electionManager.connect(ecMember1).createElection(name, constituency, startTime, endTime, candidates);
      await electionManager.connect(ecMember1).startElection(1);

      await expect(electionManager.connect(ecMember1).pauseElection(1, 'Machine issue'))
        .to.emit(electionManager, 'ElectionPaused');
      expect(await electionManager.isElectionActive(1)).to.be.false;

      await expect(electionManager.connect(ecMember1).resumeElection(1))
        .to.emit(electionManager, 'ElectionResumed');
      expect(await electionManager.isElectionActive(1)).to.be.true;
    });
  });

  describe('Multisig Certification', function () {
    beforeEach(async function () {
      const startTime = (await time.latest()) + 3600;
      const endTime = startTime + 86400;
      await electionManager.connect(ecMember1).createElection('Test', 'Test-C', startTime, endTime, [1n]);
      await electionManager.connect(ecMember1).startElection(1);
      await electionManager.connect(ecMember1).endElection(1);
    });

    it('Should require 3 signatures to certify', async function () {
      await electionManager.connect(ecMember1).certifyResults(1);
      expect(await electionManager.isResultCertified(1)).to.be.false;

      await electionManager.connect(ecMember2).certifyResults(1);
      expect(await electionManager.isResultCertified(1)).to.be.false;

      await expect(electionManager.connect(ecMember3).certifyResults(1))
        .to.emit(electionManager, 'ElectionCertified');
      
      expect(await electionManager.isResultCertified(1)).to.be.true;
    });

    it('Should prevent double signing', async function () {
      await electionManager.connect(ecMember1).certifyResults(1);
      await expect(
        electionManager.connect(ecMember1).certifyResults(1)
      ).to.be.revertedWithCustomError(electionManager, 'AlreadySigned');
    });
  });
});
