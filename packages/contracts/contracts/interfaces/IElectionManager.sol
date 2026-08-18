// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title IElectionManager
 * @author VoteChain Team
 * @notice Interface for the Election Manager contract that handles the
 *         full lifecycle of elections including creation, activation,
 *         pausing, ending, and certification.
 * @dev All implementations must support UUPS upgradeable pattern.
 */
interface IElectionManager {
    // ═══════════════════════════════════════════
    //                  ENUMS
    // ═══════════════════════════════════════════

    /**
     * @notice Possible states of an election.
     */
    enum ElectionStatus {
        CREATED,
        REGISTRATION,
        ACTIVE,
        PAUSED,
        ENDED,
        CERTIFIED
    }

    // ═══════════════════════════════════════════
    //                  EVENTS
    // ═══════════════════════════════════════════

    /**
     * @notice Emitted when a new election is created.
     * @param electionId The unique ID of the election.
     * @param name The name of the election.
     * @param constituency The constituency for the election.
     * @param createdBy The address that created the election.
     * @param startTime The scheduled start time.
     * @param endTime The scheduled end time.
     */
    event ElectionCreated(
        uint256 indexed electionId,
        string name,
        string constituency,
        address indexed createdBy,
        uint256 startTime,
        uint256 endTime
    );

    /**
     * @notice Emitted when an election transitions to ACTIVE.
     * @param electionId The unique ID of the election.
     * @param startedBy The address that started the election.
     * @param timestamp The block timestamp.
     */
    event ElectionStarted(
        uint256 indexed electionId,
        address indexed startedBy,
        uint256 timestamp
    );

    /**
     * @notice Emitted when an election is paused.
     * @param electionId The unique ID of the election.
     * @param pausedBy The address that paused the election.
     * @param reason The reason for pausing.
     * @param timestamp The block timestamp.
     */
    event ElectionPaused(
        uint256 indexed electionId,
        address indexed pausedBy,
        string reason,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a paused election is resumed.
     * @param electionId The unique ID of the election.
     * @param resumedBy The address that resumed the election.
     * @param timestamp The block timestamp.
     */
    event ElectionResumed(
        uint256 indexed electionId,
        address indexed resumedBy,
        uint256 timestamp
    );

    /**
     * @notice Emitted when an election ends.
     * @param electionId The unique ID of the election.
     * @param endedBy The address that ended the election.
     * @param totalVotes The total number of votes cast.
     * @param timestamp The block timestamp.
     */
    event ElectionEnded(
        uint256 indexed electionId,
        address indexed endedBy,
        uint256 totalVotes,
        uint256 timestamp
    );

    /**
     * @notice Emitted when election results are certified.
     * @param electionId The unique ID of the election.
     * @param certifiedBy The addresses that certified.
     * @param timestamp The block timestamp.
     */
    event ElectionCertified(
        uint256 indexed electionId,
        address[] certifiedBy,
        uint256 timestamp
    );

    // ═══════════════════════════════════════════
    //              FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Create a new election.
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
    ) external returns (uint256 electionId);

    /**
     * @notice Start an election, transitioning it to ACTIVE.
     * @param electionId The ID of the election to start.
     */
    function startElection(uint256 electionId) external;

    /**
     * @notice Pause an active election.
     * @param electionId The ID of the election to pause.
     * @param reason The reason for pausing.
     */
    function pauseElection(uint256 electionId, string calldata reason) external;

    /**
     * @notice Resume a paused election.
     * @param electionId The ID of the election to resume.
     */
    function resumeElection(uint256 electionId) external;

    /**
     * @notice End an active or paused election.
     * @param electionId The ID of the election to end.
     */
    function endElection(uint256 electionId) external;

    /**
     * @notice Get the current status of an election.
     * @param electionId The ID of the election.
     * @return status The current ElectionStatus.
     */
    function getElectionStatus(uint256 electionId) external view returns (ElectionStatus status);

    /**
     * @notice Check if an election is currently active (accepting votes).
     * @param electionId The ID of the election.
     * @return active True if the election is in ACTIVE status.
     */
    function isElectionActive(uint256 electionId) external view returns (bool active);
}
