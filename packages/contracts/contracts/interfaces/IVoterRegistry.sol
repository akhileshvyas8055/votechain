// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title IVoterRegistry
 * @author VoteChain Team
 * @notice Interface for the Voter Registry contract that manages voter
 *         registration, verification, and voting status tracking.
 * @dev All implementations must support UUPS upgradeable pattern.
 */
interface IVoterRegistry {
    // ═══════════════════════════════════════════
    //                  EVENTS
    // ═══════════════════════════════════════════

    /**
     * @notice Emitted when a new voter is registered.
     * @param voterId The unique voter identification string.
     * @param fingerprintHash The keccak256 hash of the voter's fingerprint.
     * @param constituency The constituency the voter belongs to.
     * @param registeredBy The address of the officer who registered the voter.
     * @param timestamp The block timestamp of registration.
     */
    event VoterRegistered(
        string indexed voterId,
        bytes32 indexed fingerprintHash,
        string constituency,
        address indexed registeredBy,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a voter's registration is revoked.
     * @param fingerprintHash The keccak256 hash of the voter's fingerprint.
     * @param revokedBy The address of the EC member who revoked the voter.
     * @param reason The reason for revocation.
     * @param timestamp The block timestamp of revocation.
     */
    event VoterRevoked(
        bytes32 indexed fingerprintHash,
        address indexed revokedBy,
        string reason,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a voter is marked as having voted.
     * @param fingerprintHash The keccak256 hash of the voter's fingerprint.
     * @param electionId The election in which the voter voted.
     * @param timestamp The block timestamp.
     */
    event VoterMarkedAsVoted(
        bytes32 indexed fingerprintHash,
        uint256 indexed electionId,
        uint256 timestamp
    );

    // ═══════════════════════════════════════════
    //              FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Register a new voter in the system.
     * @param voterId The unique voter identification string.
     * @param fingerprintHash The keccak256 hash of the voter's fingerprint template.
     * @param constituency The constituency the voter belongs to.
     */
    function registerVoter(
        string calldata voterId,
        bytes32 fingerprintHash,
        string calldata constituency
    ) external;

    /**
     * @notice Check if a voter is registered by their fingerprint hash.
     * @param fingerprintHash The keccak256 hash of the voter's fingerprint.
     * @return isRegistered True if the voter is registered and active.
     */
    function isVoterRegistered(bytes32 fingerprintHash) external view returns (bool isRegistered);

    /**
     * @notice Check if a voter has already cast their vote.
     * @param fingerprintHash The keccak256 hash of the voter's fingerprint.
     * @return hasVoted True if the voter has already voted.
     */
    function hasVoterVoted(bytes32 fingerprintHash) external view returns (bool hasVoted);

    /**
     * @notice Revoke a voter's registration.
     * @param fingerprintHash The keccak256 hash of the voter's fingerprint.
     * @param reason The reason for revoking the voter.
     */
    function revokeVoter(bytes32 fingerprintHash, string calldata reason) external;

    /**
     * @notice Get the constituency of a registered voter.
     * @param fingerprintHash The keccak256 hash of the voter's fingerprint.
     * @return constituency The constituency string of the voter.
     */
    function getVoterConstituency(bytes32 fingerprintHash) external view returns (string memory constituency);
}
