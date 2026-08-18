// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title IVotingCore
 * @author VoteChain Team
 * @notice Interface for the core voting contract that handles vote casting,
 *         verification, and vote count retrieval.
 * @dev All implementations must support UUPS upgradeable pattern with
 *      reentrancy protection and pausability.
 */
interface IVotingCore {
    // ═══════════════════════════════════════════
    //                  EVENTS
    // ═══════════════════════════════════════════

    /**
     * @notice Emitted when a vote is successfully cast.
     * @param electionId The election in which the vote was cast.
     * @param candidateId The candidate who received the vote.
     * @param boothId The booth from which the vote was cast.
     * @param timestamp The block timestamp of the vote.
     * @param voteIndex The sequential index of this vote in the election.
     */
    event VoteCast(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        string boothId,
        uint256 timestamp,
        uint256 voteIndex
    );

    /**
     * @notice Emitted when a vote is rejected due to validation failure.
     * @param fingerprintHash The fingerprint hash of the voter.
     * @param electionId The election for which the vote was rejected.
     * @param reason The reason code for rejection.
     * @param timestamp The block timestamp.
     */
    event VoteRejected(
        bytes32 indexed fingerprintHash,
        uint256 indexed electionId,
        string reason,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a duplicate vote attempt is detected.
     * @param fingerprintHash The fingerprint hash of the voter attempting to vote again.
     * @param electionId The election for which the duplicate was attempted.
     * @param boothId The booth from which the attempt was made.
     * @param timestamp The block timestamp.
     */
    event DuplicateVoteAttempt(
        bytes32 indexed fingerprintHash,
        uint256 indexed electionId,
        string boothId,
        uint256 timestamp
    );

    // ═══════════════════════════════════════════
    //              FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Cast a vote for a candidate in an election.
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
    ) external;

    /**
     * @notice Verify that a vote transaction was successfully recorded.
     * @param txFingerprint The keccak256 hash used to identify the vote transaction.
     * @return isValid True if the vote was recorded and is valid.
     */
    function verifyVote(bytes32 txFingerprint) external view returns (bool isValid);

    /**
     * @notice Get the vote count for a specific candidate in an election.
     * @param electionId The ID of the election.
     * @param candidateId The ID of the candidate.
     * @return count The number of votes the candidate has received.
     */
    function getVoteCount(uint256 electionId, uint256 candidateId) external view returns (uint256 count);

    /**
     * @notice Get the total number of votes cast in an election.
     * @param electionId The ID of the election.
     * @return totalVotes The total number of votes cast.
     */
    function getTotalVotesForElection(uint256 electionId) external view returns (uint256 totalVotes);
}
