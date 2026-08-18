// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../access/EVMAccessControl.sol";
import "../interfaces/IElectionManager.sol";

/**
 * @title ElectionManager
 * @author VoteChain Team
 * @notice Manages the full lifecycle of elections including creation,
 *         status transitions, pausing, and multisig certification.
 * @dev UUPS Upgradeable. Uses EVMAccessControl for role-based access.
 *      Supports multisig certification requiring 3 of 5 EC members.
 */
contract ElectionManager is Initializable, UUPSUpgradeable, IElectionManager {
    // ═══════════════════════════════════════════
    //                  STRUCTS
    // ═══════════════════════════════════════════

    /**
     * @notice Full election data structure.
     */
    struct Election {
        uint256 id;
        string name;
        string constituency;
        uint256 startTime;
        uint256 endTime;
        ElectionStatus status;
        uint256 totalVotes;
        uint256[] candidateIds;
        string pauseReason;
        address createdBy;
        uint256 createdAt;
    }

    /**
     * @notice Certification tracking for multisig.
     */
    struct CertificationData {
        address[] signers;
        mapping(address => bool) hasSigned;
        bool isCertified;
    }

    // ═══════════════════════════════════════════
    //                  STATE
    // ═══════════════════════════════════════════

    EVMAccessControl public accessControl;

    uint256 public nextElectionId;

    mapping(uint256 => Election) private elections;

    mapping(uint256 => CertificationData) private certifications;

    uint256[] private activeElectionIds;

    uint256 public constant CERTIFICATION_THRESHOLD = 3;

    // ═══════════════════════════════════════════
    //              CUSTOM ERRORS
    // ═══════════════════════════════════════════

    error ElectionNotFound(uint256 electionId);
    error InvalidElectionStatus(uint256 electionId, ElectionStatus current, ElectionStatus required);
    error InvalidTimeRange(uint256 startTime, uint256 endTime);
    error ElectionAlreadyStarted(uint256 electionId);
    error ElectionNotActive(uint256 electionId);
    error ElectionNotEnded(uint256 electionId);
    error AlreadyCertified(uint256 electionId);
    error AlreadySigned(uint256 electionId, address signer);
    error EmptyStringNotAllowed(string field);
    error EmptyCandidateList();
    error UnauthorizedCaller(address caller, string requiredRole);
    error StartTimeInPast(uint256 startTime, uint256 currentTime);

    // ═══════════════════════════════════════════
    //              MODIFIERS
    // ═══════════════════════════════════════════

    modifier onlyElectionCommission() {
        if (!accessControl.hasRole(accessControl.ELECTION_COMMISSION_ROLE(), msg.sender)) {
            revert UnauthorizedCaller(msg.sender, "ELECTION_COMMISSION_ROLE");
        }
        _;
    }

    modifier electionExists(uint256 electionId) {
        if (elections[electionId].id == 0) {
            revert ElectionNotFound(electionId);
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
     * @notice Initialize the ElectionManager contract.
     * @param _accessControl Address of the EVMAccessControl contract.
     */
    function initialize(address _accessControl) public initializer {
        require(_accessControl != address(0), "ElectionManager: zero address");
        accessControl = EVMAccessControl(_accessControl);
        nextElectionId = 1;
    }

    // ═══════════════════════════════════════════
    //           ELECTION LIFECYCLE
    // ═══════════════════════════════════════════

    /**
     * @notice Create a new election.
     * @dev Only callable by ELECTION_COMMISSION_ROLE holders.
     * @param name The name of the election.
     * @param constituency The constituency for the election.
     * @param startTime The scheduled start time (unix timestamp).
     * @param endTime The scheduled end time (unix timestamp).
     * @param candidateIds Array of candidate IDs participating.
     * @return electionId The unique ID assigned to the new election.
     */
    function createElection(
        string calldata name,
        string calldata constituency,
        uint256 startTime,
        uint256 endTime,
        uint256[] calldata candidateIds
    ) external override onlyElectionCommission returns (uint256 electionId) {
        if (bytes(name).length == 0) revert EmptyStringNotAllowed("name");
        if (bytes(constituency).length == 0) revert EmptyStringNotAllowed("constituency");

        if (startTime >= endTime) revert InvalidTimeRange(startTime, endTime);
        if (startTime < block.timestamp) revert StartTimeInPast(startTime, block.timestamp);

        electionId = nextElectionId;
        nextElectionId++;

        elections[electionId] = Election({
            id: electionId,
            name: name,
            constituency: constituency,
            startTime: startTime,
            endTime: endTime,
            status: ElectionStatus.CREATED,
            totalVotes: 0,
            candidateIds: candidateIds,
            pauseReason: "",
            createdBy: msg.sender,
            createdAt: block.timestamp
        });

        emit ElectionCreated(electionId, name, constituency, msg.sender, startTime, endTime);

        return electionId;
    }

    /**
     * @notice Start an election, transitioning it to ACTIVE.
     * @dev Only callable by ELECTION_COMMISSION_ROLE holders.
     *      Election must be in CREATED or REGISTRATION status.
     * @param electionId The ID of the election to start.
     */
    function startElection(uint256 electionId) 
        external 
        override 
        onlyElectionCommission 
        electionExists(electionId) 
    {
        Election storage election = elections[electionId];

        if (election.status != ElectionStatus.CREATED && election.status != ElectionStatus.REGISTRATION) {
            revert InvalidElectionStatus(electionId, election.status, ElectionStatus.CREATED);
        }

        election.status = ElectionStatus.ACTIVE;
        activeElectionIds.push(electionId);

        emit ElectionStarted(electionId, msg.sender, block.timestamp);
    }

    /**
     * @notice Pause an active election.
     * @dev Only callable by ELECTION_COMMISSION_ROLE holders.
     * @param electionId The ID of the election to pause.
     * @param reason The reason for pausing.
     */
    function pauseElection(uint256 electionId, string calldata reason) 
        external 
        override 
        onlyElectionCommission 
        electionExists(electionId) 
    {
        Election storage election = elections[electionId];

        if (election.status != ElectionStatus.ACTIVE) {
            revert ElectionNotActive(electionId);
        }
        if (bytes(reason).length == 0) {
            revert EmptyStringNotAllowed("reason");
        }

        election.status = ElectionStatus.PAUSED;
        election.pauseReason = reason;

        emit ElectionPaused(electionId, msg.sender, reason, block.timestamp);
    }

    /**
     * @notice Resume a paused election.
     * @dev Only callable by ELECTION_COMMISSION_ROLE holders.
     * @param electionId The ID of the election to resume.
     */
    function resumeElection(uint256 electionId) 
        external 
        override 
        onlyElectionCommission 
        electionExists(electionId) 
    {
        Election storage election = elections[electionId];

        if (election.status != ElectionStatus.PAUSED) {
            revert InvalidElectionStatus(electionId, election.status, ElectionStatus.PAUSED);
        }

        election.status = ElectionStatus.ACTIVE;
        election.pauseReason = "";

        emit ElectionResumed(electionId, msg.sender, block.timestamp);
    }

    /**
     * @notice End an active or paused election.
     * @dev Only callable by ELECTION_COMMISSION_ROLE holders.
     * @param electionId The ID of the election to end.
     */
    function endElection(uint256 electionId) 
        external 
        override 
        onlyElectionCommission 
        electionExists(electionId) 
    {
        Election storage election = elections[electionId];

        if (election.status != ElectionStatus.ACTIVE && election.status != ElectionStatus.PAUSED) {
            revert InvalidElectionStatus(electionId, election.status, ElectionStatus.ACTIVE);
        }

        election.status = ElectionStatus.ENDED;

        // Remove from active elections
        _removeFromActiveElections(electionId);

        emit ElectionEnded(electionId, msg.sender, election.totalVotes, block.timestamp);
    }

    /**
     * @notice Certify election results (multisig: requires 3 of 5 EC members).
     * @dev Each EC member must call this function. Results are certified
     *      when the threshold of 3 signatures is reached.
     * @param electionId The ID of the election to certify.
     */
    function certifyResults(uint256 electionId) 
        external 
        onlyElectionCommission 
        electionExists(electionId) 
    {
        Election storage election = elections[electionId];

        if (election.status != ElectionStatus.ENDED) {
            revert ElectionNotEnded(electionId);
        }

        CertificationData storage cert = certifications[electionId];
        if (cert.isCertified) {
            revert AlreadyCertified(electionId);
        }
        if (cert.hasSigned[msg.sender]) {
            revert AlreadySigned(electionId, msg.sender);
        }

        cert.hasSigned[msg.sender] = true;
        cert.signers.push(msg.sender);

        if (cert.signers.length >= CERTIFICATION_THRESHOLD) {
            cert.isCertified = true;
            election.status = ElectionStatus.CERTIFIED;

            emit ElectionCertified(electionId, cert.signers, block.timestamp);
        }
    }

    // ═══════════════════════════════════════════
    //           VOTE COUNT TRACKING
    // ═══════════════════════════════════════════

    /**
     * @notice Increment the total vote count for an election.
     * @dev Called by the VotingCore contract via MACHINE_ROLE.
     * @param electionId The ID of the election.
     */
    function incrementTotalVotes(uint256 electionId) external electionExists(electionId) {
        if (!accessControl.hasRole(accessControl.MACHINE_ROLE(), msg.sender)) {
            revert UnauthorizedCaller(msg.sender, "MACHINE_ROLE");
        }
        elections[electionId].totalVotes++;
    }

    // ═══════════════════════════════════════════
    //           VIEW FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Get the current status of an election.
     * @param electionId The ID of the election.
     * @return status The current ElectionStatus.
     */
    function getElectionStatus(uint256 electionId) 
        external 
        view 
        override 
        electionExists(electionId) 
        returns (ElectionStatus status) 
    {
        return elections[electionId].status;
    }

    /**
     * @notice Check if an election is currently active.
     * @param electionId The ID of the election.
     * @return active True if the election is in ACTIVE status.
     */
    function isElectionActive(uint256 electionId) 
        external 
        view 
        override 
        returns (bool active) 
    {
        if (elections[electionId].id == 0) return false;
        return elections[electionId].status == ElectionStatus.ACTIVE;
    }

    /**
     * @notice Get full election details.
     * @param electionId The ID of the election.
     * @return election The Election struct.
     */
    function getElection(uint256 electionId) 
        external 
        view 
        electionExists(electionId) 
        returns (Election memory election) 
    {
        return elections[electionId];
    }

    /**
     * @notice Get all active election IDs.
     * @return ids Array of active election IDs.
     */
    function getActiveElections() external view returns (uint256[] memory ids) {
        return activeElectionIds;
    }

    /**
     * @notice Get the candidate IDs for an election.
     * @param electionId The election ID.
     * @return candidateIds Array of candidate IDs.
     */
    function getElectionCandidates(uint256 electionId) 
        external 
        view 
        electionExists(electionId) 
        returns (uint256[] memory candidateIds) 
    {
        return elections[electionId].candidateIds;
    }

    /**
     * @notice Get the constituency of an election.
     * @param electionId The election ID.
     * @return constituency The constituency string.
     */
    function getElectionConstituency(uint256 electionId) 
        external 
        view 
        electionExists(electionId) 
        returns (string memory constituency) 
    {
        return elections[electionId].constituency;
    }

    /**
     * @notice Check if results are certified.
     * @param electionId The election ID.
     * @return certified True if certified.
     */
    function isResultCertified(uint256 electionId) external view returns (bool certified) {
        return certifications[electionId].isCertified;
    }

    /**
     * @notice Get certification signers.
     * @param electionId The election ID.
     * @return signers Array of addresses that signed.
     */
    function getCertificationSigners(uint256 electionId) 
        external 
        view 
        returns (address[] memory signers) 
    {
        return certifications[electionId].signers;
    }

    // ═══════════════════════════════════════════
    //           INTERNAL FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @dev Remove an election from the active elections array.
     * @param electionId The election ID to remove.
     */
    function _removeFromActiveElections(uint256 electionId) internal {
        uint256 length = activeElectionIds.length;
        for (uint256 i = 0; i < length; i++) {
            if (activeElectionIds[i] == electionId) {
                activeElectionIds[i] = activeElectionIds[length - 1];
                activeElectionIds.pop();
                break;
            }
        }
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
