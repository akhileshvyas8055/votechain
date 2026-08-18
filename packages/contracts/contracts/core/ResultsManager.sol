// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../access/EVMAccessControl.sol";
import "./VotingCore.sol";
import "./CandidateRegistry.sol";
import "./ElectionManager.sol";

/**
 * @title ResultsManager
 * @author VoteChain Team
 * @notice Manages election results computation, publication, and certification.
 *         Provides result integrity verification via cryptographic hashes.
 * @dev UUPS Upgradeable. Reads data from VotingCore and CandidateRegistry.
 */
contract ResultsManager is Initializable, UUPSUpgradeable {
    // ═══════════════════════════════════════════
    //                  STRUCTS
    // ═══════════════════════════════════════════

    /**
     * @notice Represents a single candidate's result.
     */
    struct Result {
        uint256 candidateId;
        string candidateName;
        string party;
        uint256 votes;
        uint256 percentage; // Stored as basis points (100% = 10000)
    }

    // ═══════════════════════════════════════════
    //                  STATE
    // ═══════════════════════════════════════════

    EVMAccessControl public accessControl;
    VotingCore public votingCore;
    CandidateRegistry public candidateRegistry;
    ElectionManager public electionManager;

    /// @notice Mapping: electionId => whether results are published.
    mapping(uint256 => bool) public isPublished;

    /// @notice Mapping: electionId => whether results are certified.
    mapping(uint256 => bool) public isCertified;

    /// @notice Mapping: electionId => results hash for integrity verification.
    mapping(uint256 => bytes32) public resultHashes;

    /// @notice Mapping: electionId => publication timestamp.
    mapping(uint256 => uint256) public publishedAt;

    // ═══════════════════════════════════════════
    //              CUSTOM ERRORS
    // ═══════════════════════════════════════════

    error ElectionNotEnded(uint256 electionId);
    error ResultsAlreadyPublished(uint256 electionId);
    error ResultsNotPublished(uint256 electionId);
    error ResultsAlreadyCertified(uint256 electionId);
    error NoVotesCast(uint256 electionId);
    error UnauthorizedCaller(address caller, string requiredRole);

    // ═══════════════════════════════════════════
    //                  EVENTS
    // ═══════════════════════════════════════════

    /**
     * @notice Emitted when results are published for an election.
     */
    event ResultsPublished(
        uint256 indexed electionId,
        bytes32 resultHash,
        address indexed publishedBy,
        uint256 timestamp
    );

    /**
     * @notice Emitted when results are officially certified.
     */
    event ResultsCertified(
        uint256 indexed electionId,
        bytes32 resultHash,
        address indexed certifiedBy,
        uint256 timestamp
    );

    // ═══════════════════════════════════════════
    //              MODIFIERS
    // ═══════════════════════════════════════════

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
     * @notice Initialize the ResultsManager contract.
     * @param _accessControl Address of the EVMAccessControl contract.
     * @param _votingCore Address of the VotingCore contract.
     * @param _candidateRegistry Address of the CandidateRegistry contract.
     * @param _electionManager Address of the ElectionManager contract.
     */
    function initialize(
        address _accessControl,
        address _votingCore,
        address _candidateRegistry,
        address _electionManager
    ) public initializer {
        require(_accessControl != address(0), "ResultsManager: zero accessControl");
        require(_votingCore != address(0), "ResultsManager: zero votingCore");
        require(_candidateRegistry != address(0), "ResultsManager: zero candidateRegistry");
        require(_electionManager != address(0), "ResultsManager: zero electionManager");


        accessControl = EVMAccessControl(_accessControl);
        votingCore = VotingCore(_votingCore);
        candidateRegistry = CandidateRegistry(_candidateRegistry);
        electionManager = ElectionManager(_electionManager);
    }

    // ═══════════════════════════════════════════
    //           RESULTS FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Get the results for an election.
     * @dev Returns results for all candidates with vote counts and percentages.
     * @param electionId The ID of the election.
     * @return results Array of Result structs sorted by vote count (descending).
     */
    function getResults(uint256 electionId) external view returns (Result[] memory results) {
        uint256[] memory candidateIds = electionManager.getElectionCandidates(electionId);
        uint256 totalVotes = votingCore.getTotalVotesForElection(electionId);

        results = new Result[](candidateIds.length);

        for (uint256 i = 0; i < candidateIds.length; i++) {
            CandidateRegistry.Candidate memory candidate = candidateRegistry.getCandidate(candidateIds[i]);
            uint256 votes = votingCore.getVoteCount(electionId, candidateIds[i]);

            uint256 percentage = 0;
            if (totalVotes > 0) {
                percentage = (votes * 10000) / totalVotes; // Basis points
            }

            results[i] = Result({
                candidateId: candidateIds[i],
                candidateName: candidate.name,
                party: candidate.party,
                votes: votes,
                percentage: percentage
            });
        }

        // Sort results by votes (descending) - insertion sort for small arrays
        for (uint256 i = 1; i < results.length; i++) {
            Result memory key = results[i];
            int256 j = int256(i) - 1;
            while (j >= 0 && results[uint256(j)].votes < key.votes) {
                results[uint256(j + 1)] = results[uint256(j)];
                j--;
            }
            results[uint256(j + 1)] = key;
        }

        return results;
    }

    /**
     * @notice Get the winner of an election.
     * @dev Returns the candidate with the most votes.
     *      In case of a tie, returns the first candidate with max votes.
     * @param electionId The ID of the election.
     * @return winner The Result struct of the winning candidate.
     */
    function getWinner(uint256 electionId) external view returns (Result memory winner) {
        uint256[] memory candidateIds = electionManager.getElectionCandidates(electionId);
        uint256 totalVotes = votingCore.getTotalVotesForElection(electionId);

        uint256 maxVotes = 0;
        uint256 winnerId = 0;

        for (uint256 i = 0; i < candidateIds.length; i++) {
            uint256 votes = votingCore.getVoteCount(electionId, candidateIds[i]);
            if (votes > maxVotes) {
                maxVotes = votes;
                winnerId = candidateIds[i];
            }
        }

        if (winnerId == 0) {
            revert NoVotesCast(electionId);
        }

        CandidateRegistry.Candidate memory candidate = candidateRegistry.getCandidate(winnerId);

        uint256 percentage = 0;
        if (totalVotes > 0) {
            percentage = (maxVotes * 10000) / totalVotes;
        }

        winner = Result({
            candidateId: winnerId,
            candidateName: candidate.name,
            party: candidate.party,
            votes: maxVotes,
            percentage: percentage
        });

        return winner;
    }

    /**
     * @notice Publish results for an election.
     * @dev Only callable by ELECTION_COMMISSION_ROLE after election has ended.
     *      Generates a result hash for integrity verification.
     * @param electionId The ID of the election.
     */
    function publishResults(uint256 electionId) external onlyElectionCommission {
        IElectionManager.ElectionStatus status = electionManager.getElectionStatus(electionId);

        if (status != IElectionManager.ElectionStatus.ENDED && status != IElectionManager.ElectionStatus.CERTIFIED) {
            revert ElectionNotEnded(electionId);
        }
        if (isPublished[electionId]) {
            revert ResultsAlreadyPublished(electionId);
        }

        bytes32 resultHash = generateResultHash(electionId);

        isPublished[electionId] = true;
        resultHashes[electionId] = resultHash;
        publishedAt[electionId] = block.timestamp;

        emit ResultsPublished(electionId, resultHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Certify published results.
     * @dev Only callable by ELECTION_COMMISSION_ROLE after results are published.
     * @param electionId The ID of the election.
     */
    function certifyResults(uint256 electionId) external onlyElectionCommission {
        if (!isPublished[electionId]) {
            revert ResultsNotPublished(electionId);
        }
        if (isCertified[electionId]) {
            revert ResultsAlreadyCertified(electionId);
        }

        isCertified[electionId] = true;

        emit ResultsCertified(electionId, resultHashes[electionId], msg.sender, block.timestamp);
    }

    /**
     * @notice Check if results are certified for an election.
     * @param electionId The election ID.
     * @return certified True if certified.
     */
    function isResultCertified(uint256 electionId) external view returns (bool certified) {
        return isCertified[electionId];
    }

    /**
     * @notice Generate a cryptographic hash of the results for integrity verification.
     * @dev Hash includes all candidate vote counts and the total votes.
     *      Can be independently verified by any party.
     * @param electionId The ID of the election.
     * @return hash The keccak256 hash of the results data.
     */
    function generateResultHash(uint256 electionId) public view returns (bytes32 hash) {
        uint256[] memory candidateIds = electionManager.getElectionCandidates(electionId);
        uint256 totalVotes = votingCore.getTotalVotesForElection(electionId);

        bytes memory data = abi.encodePacked(electionId, totalVotes);

        for (uint256 i = 0; i < candidateIds.length; i++) {
            uint256 votes = votingCore.getVoteCount(electionId, candidateIds[i]);
            data = abi.encodePacked(data, candidateIds[i], votes);
        }

        return keccak256(data);
    }

    /**
     * @notice Verify the integrity of published results.
     * @dev Regenerates the result hash and compares with stored hash.
     * @param electionId The election ID.
     * @return isValid True if the results haven't been tampered with.
     */
    function verifyResultIntegrity(uint256 electionId) external view returns (bool isValid) {
        if (!isPublished[electionId]) {
            return false;
        }
        bytes32 currentHash = generateResultHash(electionId);
        return currentHash == resultHashes[electionId];
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
