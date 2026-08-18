// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../access/EVMAccessControl.sol";
import "../interfaces/IVoterRegistry.sol";

/**
 * @title VoterRegistry
 * @author VoteChain Team
 * @notice Manages voter registration, status tracking, and constituency
 *         assignment. Stores voter data on-chain with fingerprint hashes
 *         for identity verification.
 * @dev UUPS Upgradeable. Uses EVMAccessControl for role-based access.
 *      Fingerprint data is stored as keccak256 hashes for privacy.
 */
contract VoterRegistry is
    Initializable,
    UUPSUpgradeable,
    IVoterRegistry
{
    // ═══════════════════════════════════════════
    //                  STRUCTS
    // ═══════════════════════════════════════════

    /**
     * @notice Represents a registered voter.
     * @param voterId The unique voter identification string.
     * @param fingerprintHash The keccak256 hash of the fingerprint template.
     * @param isRegistered Whether the voter is currently registered and active.
     * @param hasVoted Whether the voter has cast their vote.
     * @param constituency The constituency the voter belongs to.
     * @param registeredAt The timestamp when the voter was registered.
     * @param registeredBy The address that registered this voter.
     */
    struct Voter {
        string voterId;
        bytes32 fingerprintHash;
        bool isRegistered;
        bool hasVoted;
        string constituency;
        uint256 registeredAt;
        address registeredBy;
    }

    // ═══════════════════════════════════════════
    //                  STATE
    // ═══════════════════════════════════════════

    /// @notice Reference to the access control contract.
    EVMAccessControl public accessControl;

    /// @notice Mapping from fingerprint hash to voter data.
    mapping(bytes32 => Voter) private voters;

    /// @notice Mapping to check if a voter ID string already exists.
    mapping(bytes32 => bool) private voterIdExists;

    /// @notice Total number of registered voters.
    uint256 public totalRegisteredVoters;

    /// @notice Total number of voters who have voted.
    uint256 public totalVotedVoters;

    /// @notice Mapping of constituency to voter count.
    mapping(bytes32 => uint256) public constituencyVoterCount;

    // ═══════════════════════════════════════════
    //              CUSTOM ERRORS
    // ═══════════════════════════════════════════

    /// @notice Voter with this fingerprint hash is already registered.
    error VoterAlreadyRegistered(bytes32 fingerprintHash);

    /// @notice Voter ID string is already in use.
    error VoterIdAlreadyExists(string voterId);

    /// @notice No voter found with the given fingerprint hash.
    error VoterNotFound(bytes32 fingerprintHash);

    /// @notice Voter has already cast their vote.
    error VoterAlreadyVoted(bytes32 fingerprintHash);



    /// @notice Invalid input: empty string provided.
    error EmptyStringNotAllowed(string field);

    /// @notice Invalid input: zero bytes32 provided.
    error ZeroHashNotAllowed();

    /// @notice Caller does not have the required role.
    error UnauthorizedCaller(address caller, string requiredRole);

    /// @notice Batch size exceeds maximum allowed.
    error BatchSizeTooLarge(uint256 provided, uint256 maximum);

    // ═══════════════════════════════════════════
    //              EVENTS (additional)
    // ═══════════════════════════════════════════

    /**
     * @notice Emitted when a batch of voters is registered.
     * @param count The number of voters registered in the batch.
     * @param registeredBy The address that performed the batch registration.
     * @param timestamp The block timestamp.
     */
    event BatchVotersRegistered(
        uint256 count,
        address indexed registeredBy,
        uint256 timestamp
    );

    // ═══════════════════════════════════════════
    //              MODIFIERS
    // ═══════════════════════════════════════════

    /**
     * @dev Ensures caller has the BOOTH_OFFICER_ROLE.
     */
    modifier onlyBoothOfficer() {
        if (!accessControl.hasRole(accessControl.BOOTH_OFFICER_ROLE(), msg.sender)) {
            revert UnauthorizedCaller(msg.sender, "BOOTH_OFFICER_ROLE");
        }
        _;
    }

    /**
     * @dev Ensures caller has the ELECTION_COMMISSION_ROLE.
     */
    modifier onlyElectionCommission() {
        if (!accessControl.hasRole(accessControl.ELECTION_COMMISSION_ROLE(), msg.sender)) {
            revert UnauthorizedCaller(msg.sender, "ELECTION_COMMISSION_ROLE");
        }
        _;
    }

    /**
     * @dev Ensures caller has the MACHINE_ROLE.
     */
    modifier onlyMachine() {
        if (!accessControl.hasRole(accessControl.MACHINE_ROLE(), msg.sender)) {
            revert UnauthorizedCaller(msg.sender, "MACHINE_ROLE");
        }
        _;
    }

    /**
     * @dev Ensures caller has the AUDITOR_ROLE.
     */
    modifier onlyAuditor() {
        if (!accessControl.hasRole(accessControl.AUDITOR_ROLE(), msg.sender)) {
            revert UnauthorizedCaller(msg.sender, "AUDITOR_ROLE");
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
     * @notice Initialize the VoterRegistry contract.
     * @param _accessControl Address of the EVMAccessControl contract.
     */
    function initialize(address _accessControl) public initializer {
        if (_accessControl == address(0)) {
            revert ZeroHashNotAllowed();
        }


        accessControl = EVMAccessControl(_accessControl);
        totalRegisteredVoters = 0;
        totalVotedVoters = 0;
    }

    // ═══════════════════════════════════════════
    //           REGISTRATION FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Register a new voter in the system.
     * @dev Only callable by addresses with BOOTH_OFFICER_ROLE.
     * @param voterId The unique voter identification string.
     * @param fingerprintHash The keccak256 hash of the voter's fingerprint template.
     * @param constituency The constituency the voter belongs to.
     */
    function registerVoter(
        string calldata voterId,
        bytes32 fingerprintHash,
        string calldata constituency
    ) external override onlyBoothOfficer {
        _registerVoterInternal(voterId, fingerprintHash, constituency);
    }

    /**
     * @notice Register multiple voters in a single transaction (gas optimized).
     * @dev Only callable by addresses with BOOTH_OFFICER_ROLE.
     *      Maximum batch size is 100 to prevent gas limit issues.
     * @param voterIds Array of voter ID strings.
     * @param fingerprintHashes Array of fingerprint hashes.
     * @param constituencies Array of constituency strings.
     */
    function batchRegisterVoters(
        string[] calldata voterIds,
        bytes32[] calldata fingerprintHashes,
        string[] calldata constituencies
    ) external onlyBoothOfficer {
        uint256 length = voterIds.length;

        if (length != fingerprintHashes.length || length != constituencies.length) {
            revert BatchSizeTooLarge(length, 0); // Array length mismatch
        }
        if (length > 100) {
            revert BatchSizeTooLarge(length, 100);
        }
        if (length == 0) {
            revert BatchSizeTooLarge(0, 100);
        }

        for (uint256 i = 0; i < length; ) {
            _registerVoterInternal(voterIds[i], fingerprintHashes[i], constituencies[i]);
            unchecked { ++i; }
        }

        emit BatchVotersRegistered(length, msg.sender, block.timestamp);
    }

    /**
     * @notice Internal function to register a single voter.
     * @param voterId The unique voter identification string.
     * @param fingerprintHash The keccak256 hash of the fingerprint template.
     * @param constituency The constituency the voter belongs to.
     */
    function _registerVoterInternal(
        string calldata voterId,
        bytes32 fingerprintHash,
        string calldata constituency
    ) internal {
        // Input validation
        if (bytes(voterId).length == 0) {
            revert EmptyStringNotAllowed("voterId");
        }
        if (fingerprintHash == bytes32(0)) {
            revert ZeroHashNotAllowed();
        }
        if (bytes(constituency).length == 0) {
            revert EmptyStringNotAllowed("constituency");
        }

        // Check duplicates
        bytes32 voterIdHash = keccak256(abi.encodePacked(voterId));
        if (voterIdExists[voterIdHash]) {
            revert VoterIdAlreadyExists(voterId);
        }
        if (voters[fingerprintHash].isRegistered) {
            revert VoterAlreadyRegistered(fingerprintHash);
        }

        // Register voter
        voters[fingerprintHash] = Voter({
            voterId: voterId,
            fingerprintHash: fingerprintHash,
            isRegistered: true,
            hasVoted: false,
            constituency: constituency,
            registeredAt: block.timestamp,
            registeredBy: msg.sender
        });

        voterIdExists[voterIdHash] = true;
        totalRegisteredVoters++;
        constituencyVoterCount[keccak256(abi.encodePacked(constituency))]++;

        emit VoterRegistered(voterId, fingerprintHash, constituency, msg.sender, block.timestamp);
    }

    // ═══════════════════════════════════════════
    //           VOTING STATUS FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Mark a voter as having voted. Called by VotingCore contract.
     * @dev Only callable by addresses with MACHINE_ROLE.
     * @param fingerprintHash The fingerprint hash of the voter.
     * @param electionId The ID of the election.
     */
    function markVoterAsVoted(
        bytes32 fingerprintHash,
        uint256 electionId
    ) external onlyMachine {
        Voter storage voter = voters[fingerprintHash];

        if (!voter.isRegistered) {
            revert VoterNotFound(fingerprintHash);
        }
        if (voter.hasVoted) {
            revert VoterAlreadyVoted(fingerprintHash);
        }

        voter.hasVoted = true;
        totalVotedVoters++;

        emit VoterMarkedAsVoted(fingerprintHash, electionId, block.timestamp);
    }

    // ═══════════════════════════════════════════
    //           VIEW FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Check if a voter is registered by their fingerprint hash.
     * @param fingerprintHash The keccak256 hash of the voter's fingerprint.
     * @return isReg True if the voter is registered and active.
     */
    function isVoterRegistered(bytes32 fingerprintHash) external view override returns (bool isReg) {
        return voters[fingerprintHash].isRegistered;
    }

    /**
     * @notice Check if a voter has already cast their vote.
     * @param fingerprintHash The keccak256 hash of the voter's fingerprint.
     * @return voted True if the voter has already voted.
     */
    function hasVoterVoted(bytes32 fingerprintHash) external view override returns (bool voted) {
        return voters[fingerprintHash].hasVoted;
    }

    /**
     * @notice Get the constituency of a registered voter.
     * @param fingerprintHash The keccak256 hash of the voter's fingerprint.
     * @return constituency The constituency string of the voter.
     */
    function getVoterConstituency(bytes32 fingerprintHash) external view override returns (string memory constituency) {
        Voter storage voter = voters[fingerprintHash];
        if (!voter.isRegistered) {
            revert VoterNotFound(fingerprintHash);
        }
        return voter.constituency;
    }

    /**
     * @notice Get detailed voter information (auditor only).
     * @dev Only callable by addresses with AUDITOR_ROLE.
     * @param fingerprintHash The keccak256 hash of the voter's fingerprint.
     * @return voterId The voter's ID string.
     * @return isRegistered Whether the voter is registered.
     * @return hasVotedStatus Whether the voter has voted.
     * @return constituency The voter's constituency.
     * @return registeredAt The registration timestamp.
     * @return registeredBy The registering officer's address.
     */
    function getVoterInfo(bytes32 fingerprintHash)
        external
        view
        onlyAuditor
        returns (
            string memory voterId,
            bool isRegistered,
            bool hasVotedStatus,
            string memory constituency,
            uint256 registeredAt,
            address registeredBy
        )
    {
        Voter storage voter = voters[fingerprintHash];
        if (voter.registeredAt == 0) {
            revert VoterNotFound(fingerprintHash);
        }

        return (
            voter.voterId,
            voter.isRegistered,
            voter.hasVoted,
            voter.constituency,
            voter.registeredAt,
            voter.registeredBy
        );
    }

    // ═══════════════════════════════════════════
    //           REVOCATION FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Revoke a voter's registration.
     * @dev Only callable by addresses with ELECTION_COMMISSION_ROLE.
     * @param fingerprintHash The keccak256 hash of the voter's fingerprint.
     * @param reason The reason for revoking the voter.
     */
    function revokeVoter(
        bytes32 fingerprintHash,
        string calldata reason
    ) external override onlyElectionCommission {
        Voter storage voter = voters[fingerprintHash];

        if (!voter.isRegistered) {
            revert VoterNotFound(fingerprintHash);
        }
        if (bytes(reason).length == 0) {
            revert EmptyStringNotAllowed("reason");
        }

        voter.isRegistered = false;
        totalRegisteredVoters--;
        constituencyVoterCount[keccak256(abi.encodePacked(voter.constituency))]--;

        emit VoterRevoked(fingerprintHash, msg.sender, reason, block.timestamp);
    }

    // ═══════════════════════════════════════════
    //           STATISTICS
    // ═══════════════════════════════════════════

    /**
     * @notice Get the number of registered voters in a constituency.
     * @param constituency The constituency name.
     * @return count The number of registered voters.
     */
    function getConstituencyVoterCount(string calldata constituency) external view returns (uint256 count) {
        return constituencyVoterCount[keccak256(abi.encodePacked(constituency))];
    }

    /**
     * @notice Get voter turnout statistics.
     * @return registered Total registered voters.
     * @return voted Total voters who have voted.
     */
    function getVoterTurnout() external view returns (uint256 registered, uint256 voted) {
        return (totalRegisteredVoters, totalVotedVoters);
    }

    // ═══════════════════════════════════════════
    //           UPGRADE AUTHORIZATION
    // ═══════════════════════════════════════════

    /**
     * @notice Authorize an upgrade to a new implementation.
     * @dev Only the DEFAULT_ADMIN_ROLE can authorize upgrades.
     */
    function _authorizeUpgrade(address newImplementation) internal override {
        if (!accessControl.hasRole(accessControl.DEFAULT_ADMIN_ROLE(), msg.sender)) {
            revert UnauthorizedCaller(msg.sender, "DEFAULT_ADMIN_ROLE");
        }
    }
}
