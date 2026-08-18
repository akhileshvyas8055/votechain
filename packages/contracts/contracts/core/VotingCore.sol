// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "../access/EVMAccessControl.sol";
import "../interfaces/IVotingCore.sol";
import "./VoterRegistry.sol";
import "./CandidateRegistry.sol";
import "./ElectionManager.sol";

/**
 * @title VotingCore
 * @author VoteChain Team
 * @notice Core voting contract that handles vote casting, verification,
 *         and vote count management. This is the most critical contract
 *         in the VoteChain system.
 * @dev UUPS Upgradeable with ReentrancyGuard and Pausable.
 *      Uses MACHINE_ROLE for authorized EVM machines to submit votes.
 *      All vote data is stored immutably on-chain.
 */
contract VotingCore is
    Initializable,
    UUPSUpgradeable,
    ReentrancyGuard,
    PausableUpgradeable,
    IVotingCore
{
    // ═══════════════════════════════════════════
    //                  STRUCTS
    // ═══════════════════════════════════════════

    /**
     * @notice Represents a single vote record.
     */
    struct VoteRecord {
        uint256 electionId;
        uint256 candidateId;
        string boothId;
        uint256 timestamp;
        bytes32 voteHash;
    }

    // ═══════════════════════════════════════════
    //                  STATE
    // ═══════════════════════════════════════════

    EVMAccessControl public accessControl;
    VoterRegistry public voterRegistry;
    CandidateRegistry public candidateRegistry;
    ElectionManager public electionManager;

    /// @notice Mapping: electionId => candidateId => vote count.
    mapping(uint256 => mapping(uint256 => uint256)) private voteCounts;

    /// @notice Mapping: fingerprintHash => electionId => has voted.
    mapping(bytes32 => mapping(uint256 => bool)) private hasVotedInElection;

    /// @notice Mapping: vote hash => VoteRecord for verification.
    mapping(bytes32 => VoteRecord) private voteRecords;

    /// @notice Mapping: electionId => total votes cast.
    mapping(uint256 => uint256) private electionTotalVotes;

    /// @notice Sequential vote index per election.
    mapping(uint256 => uint256) private electionVoteIndex;

    /// @notice Mapping: electionId => booth => vote count.
    mapping(uint256 => mapping(bytes32 => uint256)) private boothVoteCounts;

    // ═══════════════════════════════════════════
    //              CUSTOM ERRORS
    // ═══════════════════════════════════════════

    error ElectionNotActive(uint256 electionId);
    error VoterNotRegistered(bytes32 fingerprintHash);
    error VoterAlreadyVotedInElection(bytes32 fingerprintHash, uint256 electionId);
    error CandidateNotValid(uint256 candidateId);
    error CandidateNotInConstituency(uint256 candidateId, string voterConstituency, string candidateConstituency);
    error VoteRecordNotFound(bytes32 voteHash);
    error UnauthorizedCaller(address caller, string requiredRole);
    error ContractPaused();
    error EmptyBoothId();

    // ═══════════════════════════════════════════
    //              MODIFIERS
    // ═══════════════════════════════════════════

    modifier onlyMachine() {
        if (!accessControl.hasRole(accessControl.MACHINE_ROLE(), msg.sender)) {
            revert UnauthorizedCaller(msg.sender, "MACHINE_ROLE");
        }
        _;
    }

    modifier onlyElectionCommission() {
        if (!accessControl.hasRole(accessControl.ELECTION_COMMISSION_ROLE(), msg.sender)) {
            revert UnauthorizedCaller(msg.sender, "ELECTION_COMMISSION_ROLE");
        }
        _;
    }

    // ═══════════════════════════════════════════
    //              INITIALIZATION
    // ═══════════════════════════════════════════

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the VotingCore contract.
     * @param _accessControl Address of the EVMAccessControl contract.
     * @param _voterRegistry Address of the VoterRegistry contract.
     * @param _candidateRegistry Address of the CandidateRegistry contract.
     * @param _electionManager Address of the ElectionManager contract.
     */
    function initialize(
        address _accessControl,
        address _voterRegistry,
        address _candidateRegistry,
        address _electionManager
    ) public initializer {
        require(_accessControl != address(0), "VotingCore: zero accessControl");
        require(_voterRegistry != address(0), "VotingCore: zero voterRegistry");
        require(_candidateRegistry != address(0), "VotingCore: zero candidateRegistry");
        require(_electionManager != address(0), "VotingCore: zero electionManager");

        __Pausable_init();

        accessControl = EVMAccessControl(_accessControl);
        voterRegistry = VoterRegistry(_voterRegistry);
        candidateRegistry = CandidateRegistry(_candidateRegistry);
        electionManager = ElectionManager(_electionManager);
    }

    // ═══════════════════════════════════════════
    //           VOTE CASTING (CRITICAL)
    // ═══════════════════════════════════════════

    /**
     * @notice Cast a vote for a candidate in an election.
     * @dev Only callable by authorized EVM machines (MACHINE_ROLE).
     *      Performs comprehensive validation:
     *      1. Election must be ACTIVE
     *      2. Voter must be registered
     *      3. Voter must not have voted in this election
     *      4. Candidate must be valid and active
     *      5. Candidate must be in voter's constituency
     *      Uses nonReentrant to prevent reentrancy attacks.
     * @param fingerprintHash The keccak256 hash of the voter's fingerprint.
     * @param candidateId The ID of the candidate being voted for.
     * @param electionId The ID of the election.
     * @param boothId The identifier of the booth where the vote is cast.
     */
    function castVote(
        bytes32 fingerprintHash,
        uint256 candidateId,
        uint256 electionId,
        string calldata boothId
    ) external override onlyMachine nonReentrant whenNotPaused {
        // Validate booth ID
        if (bytes(boothId).length == 0) {
            revert EmptyBoothId();
        }

        // 1. Check election is active
        if (!electionManager.isElectionActive(electionId)) {
            emit VoteRejected(fingerprintHash, electionId, "Election not active", block.timestamp);
            revert ElectionNotActive(electionId);
        }

        // 2. Check voter is registered
        if (!voterRegistry.isVoterRegistered(fingerprintHash)) {
            emit VoteRejected(fingerprintHash, electionId, "Voter not registered", block.timestamp);
            revert VoterNotRegistered(fingerprintHash);
        }

        // 3. Check voter hasn't already voted in this election
        if (hasVotedInElection[fingerprintHash][electionId]) {
            emit DuplicateVoteAttempt(fingerprintHash, electionId, boothId, block.timestamp);
            revert VoterAlreadyVotedInElection(fingerprintHash, electionId);
        }

        // 4. Check candidate is valid and active
        if (!candidateRegistry.validateCandidate(candidateId)) {
            emit VoteRejected(fingerprintHash, electionId, "Invalid candidate", block.timestamp);
            revert CandidateNotValid(candidateId);
        }

        // 5. Check candidate is in voter's constituency
        string memory voterConstituency = voterRegistry.getVoterConstituency(fingerprintHash);
        string memory candidateConstituency = candidateRegistry.getCandidateConstituency(candidateId);

        if (keccak256(abi.encodePacked(voterConstituency)) != keccak256(abi.encodePacked(candidateConstituency))) {
            emit VoteRejected(fingerprintHash, electionId, "Constituency mismatch", block.timestamp);
            revert CandidateNotInConstituency(candidateId, voterConstituency, candidateConstituency);
        }

        // ═══ All validations passed - Record the vote ═══

        // Mark voter as voted in this election
        hasVotedInElection[fingerprintHash][electionId] = true;

        // Mark voter as voted in VoterRegistry
        voterRegistry.markVoterAsVoted(fingerprintHash, electionId);

        // Increment vote count for candidate
        voteCounts[electionId][candidateId]++;

        // Increment total votes
        electionTotalVotes[electionId]++;

        // Increment vote index
        uint256 voteIdx = electionVoteIndex[electionId];
        electionVoteIndex[electionId] = voteIdx + 1;

        // Increment booth vote count
        bytes32 boothHash = keccak256(abi.encodePacked(boothId));
        boothVoteCounts[electionId][boothHash]++;

        // Update election manager total votes
        electionManager.incrementTotalVotes(electionId);

        // Generate vote hash for verification
        bytes32 voteHash = keccak256(
            abi.encodePacked(
                electionId,
                candidateId,
                boothId,
                block.timestamp,
                voteIdx,
                blockhash(block.number - 1)
            )
        );

        // Store vote record (without voter identity for privacy)
        voteRecords[voteHash] = VoteRecord({
            electionId: electionId,
            candidateId: candidateId,
            boothId: boothId,
            timestamp: block.timestamp,
            voteHash: voteHash
        });

        // Emit vote cast event
        emit VoteCast(electionId, candidateId, boothId, block.timestamp, voteIdx);
    }

    // ═══════════════════════════════════════════
    //           VERIFICATION FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Verify that a vote transaction was successfully recorded.
     * @param txFingerprint The vote hash used to identify the vote.
     * @return isValid True if the vote record exists.
     */
    function verifyVote(bytes32 txFingerprint) external view override returns (bool isValid) {
        return voteRecords[txFingerprint].timestamp != 0;
    }

    /**
     * @notice Get a vote record by its hash.
     * @param voteHash The hash of the vote.
     * @return record The VoteRecord.
     */
    function getVoteRecord(bytes32 voteHash) external view returns (VoteRecord memory record) {
        if (voteRecords[voteHash].timestamp == 0) {
            revert VoteRecordNotFound(voteHash);
        }
        return voteRecords[voteHash];
    }

    // ═══════════════════════════════════════════
    //           COUNT FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Get the vote count for a specific candidate in an election.
     * @param electionId The ID of the election.
     * @param candidateId The ID of the candidate.
     * @return count The number of votes.
     */
    function getVoteCount(
        uint256 electionId,
        uint256 candidateId
    ) external view override returns (uint256 count) {
        return voteCounts[electionId][candidateId];
    }

    /**
     * @notice Get the total number of votes cast in an election.
     * @param electionId The ID of the election.
     * @return totalVotes The total votes cast.
     */
    function getTotalVotesForElection(
        uint256 electionId
    ) external view override returns (uint256 totalVotes) {
        return electionTotalVotes[electionId];
    }

    /**
     * @notice Get the leading candidate in an election.
     * @dev Returns the candidate ID with the highest vote count.
     *      In case of a tie, returns the first candidate with the max votes.
     * @param electionId The ID of the election.
     * @return leadingCandidateId The candidate ID with the most votes.
     * @return leadingVoteCount The number of votes for the leading candidate.
     */
    function getLeadingCandidate(
        uint256 electionId
    ) external view returns (uint256 leadingCandidateId, uint256 leadingVoteCount) {
        uint256[] memory candidateIds = electionManager.getElectionCandidates(electionId);

        leadingCandidateId = 0;
        leadingVoteCount = 0;

        for (uint256 i = 0; i < candidateIds.length; i++) {
            uint256 count = voteCounts[electionId][candidateIds[i]];
            if (count > leadingVoteCount) {
                leadingVoteCount = count;
                leadingCandidateId = candidateIds[i];
            }
        }

        return (leadingCandidateId, leadingVoteCount);
    }

    /**
     * @notice Get vote count for a specific booth in an election.
     * @param electionId The election ID.
     * @param boothId The booth identifier.
     * @return count The number of votes from that booth.
     */
    function getBoothVoteCount(
        uint256 electionId,
        string calldata boothId
    ) external view returns (uint256 count) {
        bytes32 boothHash = keccak256(abi.encodePacked(boothId));
        return boothVoteCounts[electionId][boothHash];
    }

    /**
     * @notice Check if a voter has voted in a specific election.
     * @param fingerprintHash The voter's fingerprint hash.
     * @param electionId The election ID.
     * @return voted True if the voter has voted.
     */
    function hasVoterVotedInElection(
        bytes32 fingerprintHash,
        uint256 electionId
    ) external view returns (bool voted) {
        return hasVotedInElection[fingerprintHash][electionId];
    }

    // ═══════════════════════════════════════════
    //           EMERGENCY FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Pause the voting contract in case of emergency.
     * @dev Only callable by ELECTION_COMMISSION_ROLE holders.
     *      When paused, no votes can be cast.
     */
    function emergencyPause() external onlyElectionCommission {
        _pause();
    }

    /**
     * @notice Unpause the voting contract after emergency.
     * @dev Only callable by ELECTION_COMMISSION_ROLE holders.
     */
    function emergencyUnpause() external onlyElectionCommission {
        _unpause();
    }

    // ═══════════════════════════════════════════
    //           UPGRADE AUTHORIZATION
    // ═══════════════════════════════════════════

    function _authorizeUpgrade(address newImplementation) internal override {
        if (!accessControl.hasRole(accessControl.DEFAULT_ADMIN_ROLE(), msg.sender)) {
            revert UnauthorizedCaller(msg.sender, "DEFAULT_ADMIN_ROLE");
        }
    }
}
