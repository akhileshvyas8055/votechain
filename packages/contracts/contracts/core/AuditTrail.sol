// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../access/EVMAccessControl.sol";

/**
 * @title AuditTrail
 * @author VoteChain Team
 * @notice Immutable on-chain audit log for all critical actions in the
 *         VoteChain system. Provides tamper-proof record keeping and
 *         chain-of-hash integrity verification.
 * @dev UUPS Upgradeable. Each audit entry includes a hash chain to
 *      detect any tampering with historical records.
 */
contract AuditTrail is Initializable, UUPSUpgradeable {
    // ═══════════════════════════════════════════
    //                  ENUMS
    // ═══════════════════════════════════════════

    /**
     * @notice Types of auditable actions.
     */
    enum ActionType {
        VOTER_REGISTERED,
        VOTE_CAST,
        ELECTION_CREATED,
        ELECTION_STARTED,
        ELECTION_PAUSED,
        ELECTION_RESUMED,
        ELECTION_ENDED,
        CANDIDATE_ADDED,
        CANDIDATE_REMOVED,
        RESULTS_PUBLISHED,
        RESULTS_CERTIFIED,
        EMERGENCY_PAUSE,
        EMERGENCY_UNPAUSE,
        ROLE_GRANTED,
        ROLE_REVOKED
    }

    // ═══════════════════════════════════════════
    //                  STRUCTS
    // ═══════════════════════════════════════════

    /**
     * @notice Represents a single audit entry.
     */
    struct AuditEntry {
        uint256 id;
        ActionType action;
        address performer;
        bytes32 entityHash;
        uint256 timestamp;
        string boothId;
        bytes32 dataHash;
        bytes32 previousEntryHash;
    }

    // ═══════════════════════════════════════════
    //                  STATE
    // ═══════════════════════════════════════════

    EVMAccessControl public accessControl;

    /// @notice Array of all audit entries.
    AuditEntry[] private auditLog;

    /// @notice Hash of the last audit entry (chain of hashes).
    bytes32 public lastEntryHash;

    /// @notice Mapping: electionId hash => array of audit entry indices.
    mapping(bytes32 => uint256[]) private electionAuditIndices;

    /// @notice Total number of audit entries.
    uint256 public totalEntries;

    // ═══════════════════════════════════════════
    //              CUSTOM ERRORS
    // ═══════════════════════════════════════════

    error UnauthorizedCaller(address caller);
    error InvalidIndexRange(uint256 fromIndex, uint256 toIndex);
    error IntegrityCheckFailed(uint256 entryIndex);

    // ═══════════════════════════════════════════
    //                  EVENTS
    // ═══════════════════════════════════════════

    /**
     * @notice Emitted when a new audit entry is logged.
     */
    event AuditEntryLogged(
        uint256 indexed entryId,
        ActionType indexed action,
        address indexed performer,
        bytes32 entityHash,
        uint256 timestamp
    );

    // ═══════════════════════════════════════════
    //              INITIALIZATION
    // ═══════════════════════════════════════════

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the AuditTrail contract.
     * @param _accessControl Address of the EVMAccessControl contract.
     */
    function initialize(address _accessControl) public initializer {
        require(_accessControl != address(0), "AuditTrail: zero address");
        accessControl = EVMAccessControl(_accessControl);
        lastEntryHash = bytes32(0);
        totalEntries = 0;
    }

    // ═══════════════════════════════════════════
    //           LOGGING FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Log a new audit action.
     * @dev Can be called by any authorized contract or role holder.
     *      Creates a chain of hashes by including the previous entry's hash.
     * @param action The type of action being logged.
     * @param entityHash A hash identifying the entity involved.
     * @param boothId The booth identifier (if applicable, empty string otherwise).
     * @param dataHash A hash of any additional data.
     */
    function logAction(
        ActionType action,
        bytes32 entityHash,
        string calldata boothId,
        bytes32 dataHash
    ) external {
        // Verify caller has at least one role
        bool isAuthorized = accessControl.hasRole(accessControl.DEFAULT_ADMIN_ROLE(), msg.sender) ||
            accessControl.hasRole(accessControl.ELECTION_COMMISSION_ROLE(), msg.sender) ||
            accessControl.hasRole(accessControl.BOOTH_OFFICER_ROLE(), msg.sender) ||
            accessControl.hasRole(accessControl.MACHINE_ROLE(), msg.sender) ||
            accessControl.hasRole(accessControl.AUDITOR_ROLE(), msg.sender);

        if (!isAuthorized) {
            revert UnauthorizedCaller(msg.sender);
        }

        uint256 entryId = totalEntries;

        // Create chain of hashes
        bytes32 entryHash = keccak256(
            abi.encodePacked(
                entryId,
                action,
                msg.sender,
                entityHash,
                block.timestamp,
                boothId,
                dataHash,
                lastEntryHash
            )
        );

        AuditEntry memory entry = AuditEntry({
            id: entryId,
            action: action,
            performer: msg.sender,
            entityHash: entityHash,
            timestamp: block.timestamp,
            boothId: boothId,
            dataHash: dataHash,
            previousEntryHash: lastEntryHash
        });

        auditLog.push(entry);
        lastEntryHash = entryHash;
        totalEntries++;

        // Index by election if entityHash represents an election
        electionAuditIndices[entityHash].push(entryId);

        emit AuditEntryLogged(entryId, action, msg.sender, entityHash, block.timestamp);
    }

    /**
     * @notice Log an action for a specific election.
     * @param action The action type.
     * @param electionId The election ID.
     * @param dataHash Additional data hash.
     */
    function logElectionAction(
        ActionType action,
        uint256 electionId,
        bytes32 dataHash
    ) external {
        bool isAuthorized = accessControl.hasRole(accessControl.ELECTION_COMMISSION_ROLE(), msg.sender) ||
            accessControl.hasRole(accessControl.MACHINE_ROLE(), msg.sender);

        if (!isAuthorized) {
            revert UnauthorizedCaller(msg.sender);
        }

        bytes32 entityHash = keccak256(abi.encodePacked("election", electionId));

        uint256 entryId = totalEntries;

        bytes32 entryHash = keccak256(
            abi.encodePacked(
                entryId,
                action,
                msg.sender,
                entityHash,
                block.timestamp,
                "",
                dataHash,
                lastEntryHash
            )
        );

        AuditEntry memory entry = AuditEntry({
            id: entryId,
            action: action,
            performer: msg.sender,
            entityHash: entityHash,
            timestamp: block.timestamp,
            boothId: "",
            dataHash: dataHash,
            previousEntryHash: lastEntryHash
        });

        auditLog.push(entry);
        lastEntryHash = entryHash;
        totalEntries++;
        electionAuditIndices[entityHash].push(entryId);

        emit AuditEntryLogged(entryId, action, msg.sender, entityHash, block.timestamp);
    }

    // ═══════════════════════════════════════════
    //           VIEW FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Get audit log entries within a range.
     * @param fromIndex The starting index (inclusive).
     * @param toIndex The ending index (inclusive).
     * @return entries Array of AuditEntry structs.
     */
    function getAuditLog(
        uint256 fromIndex,
        uint256 toIndex
    ) external view returns (AuditEntry[] memory entries) {
        if (fromIndex > toIndex || toIndex >= totalEntries) {
            revert InvalidIndexRange(fromIndex, toIndex);
        }

        uint256 count = toIndex - fromIndex + 1;
        entries = new AuditEntry[](count);

        for (uint256 i = 0; i < count; i++) {
            entries[i] = auditLog[fromIndex + i];
        }

        return entries;
    }

    /**
     * @notice Get audit entries for a specific election.
     * @param electionId The election ID.
     * @return entries Array of AuditEntry structs for the election.
     */
    function getAuditByElection(uint256 electionId) external view returns (AuditEntry[] memory entries) {
        bytes32 entityHash = keccak256(abi.encodePacked("election", electionId));
        uint256[] storage indices = electionAuditIndices[entityHash];

        entries = new AuditEntry[](indices.length);
        for (uint256 i = 0; i < indices.length; i++) {
            entries[i] = auditLog[indices[i]];
        }

        return entries;
    }

    /**
     * @notice Get a single audit entry by index.
     * @param index The index of the entry.
     * @return entry The AuditEntry.
     */
    function getAuditEntry(uint256 index) external view returns (AuditEntry memory entry) {
        require(index < totalEntries, "AuditTrail: index out of bounds");
        return auditLog[index];
    }

    /**
     * @notice Verify the integrity of the audit chain.
     * @dev Recomputes hashes from the beginning and verifies chain continuity.
     *      Gas-intensive: should only be called off-chain or in tests.
     * @return isValid True if the entire audit chain is intact.
     */
    function verifyAuditIntegrity() external view returns (bool isValid) {
        if (totalEntries == 0) return true;

        bytes32 computedHash = bytes32(0);

        for (uint256 i = 0; i < totalEntries; i++) {
            AuditEntry storage entry = auditLog[i];

            // Verify chain link
            if (entry.previousEntryHash != computedHash) {
                return false;
            }

            computedHash = keccak256(
                abi.encodePacked(
                    entry.id,
                    entry.action,
                    entry.performer,
                    entry.entityHash,
                    entry.timestamp,
                    entry.boothId,
                    entry.dataHash,
                    entry.previousEntryHash
                )
            );
        }

        // Final hash should match lastEntryHash
        return computedHash == lastEntryHash;
    }

    /**
     * @notice Verify integrity of a specific entry.
     * @param index The index of the entry to verify.
     * @return isValid True if the entry's chain link is valid.
     */
    function verifyEntryIntegrity(uint256 index) external view returns (bool isValid) {
        require(index < totalEntries, "AuditTrail: index out of bounds");

        AuditEntry storage entry = auditLog[index];

        if (index == 0) {
            return entry.previousEntryHash == bytes32(0);
        }

        // Recompute hash of previous entry
        AuditEntry storage prevEntry = auditLog[index - 1];
        bytes32 prevHash = keccak256(
            abi.encodePacked(
                prevEntry.id,
                prevEntry.action,
                prevEntry.performer,
                prevEntry.entityHash,
                prevEntry.timestamp,
                prevEntry.boothId,
                prevEntry.dataHash,
                prevEntry.previousEntryHash
            )
        );

        return entry.previousEntryHash == prevHash;
    }

    // ═══════════════════════════════════════════
    //           UPGRADE AUTHORIZATION
    // ═══════════════════════════════════════════

    function _authorizeUpgrade(address newImplementation) internal override {
        if (!accessControl.hasRole(accessControl.DEFAULT_ADMIN_ROLE(), msg.sender)) {
            revert UnauthorizedCaller(msg.sender);
        }
    }
}
