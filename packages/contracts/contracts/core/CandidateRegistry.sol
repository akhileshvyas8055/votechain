// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../access/EVMAccessControl.sol";

/**
 * @title CandidateRegistry
 * @author VoteChain Team
 * @notice Manages candidate registration, removal, and querying for elections.
 *         Stores candidate metadata including IPFS photo hashes.
 * @dev UUPS Upgradeable. Uses EVMAccessControl for role-based access.
 */
contract CandidateRegistry is Initializable, UUPSUpgradeable {
    // ═══════════════════════════════════════════
    //                  STRUCTS
    // ═══════════════════════════════════════════

    /**
     * @notice Represents a registered candidate.
     */
    struct Candidate {
        uint256 id;
        string name;
        string party;
        string symbol;
        string photoIPFSHash;
        string constituency;
        bool isActive;
        uint256 nominationTimestamp;
        address addedBy;
    }

    // ═══════════════════════════════════════════
    //                  STATE
    // ═══════════════════════════════════════════

    /// @notice Reference to the access control contract.
    EVMAccessControl public accessControl;

    /// @notice Auto-incrementing candidate ID counter.
    uint256 public nextCandidateId;

    /// @notice Mapping from candidate ID to candidate data.
    mapping(uint256 => Candidate) private candidates;

    /// @notice Mapping from constituency hash to array of candidate IDs.
    mapping(bytes32 => uint256[]) private constituencyCandidates;

    /// @notice Total number of active candidates.
    uint256 public totalActiveCandidates;

    // ═══════════════════════════════════════════
    //              CUSTOM ERRORS
    // ═══════════════════════════════════════════

    error CandidateNotFound(uint256 candidateId);
    error CandidateNotActive(uint256 candidateId);
    error CandidateAlreadyInactive(uint256 candidateId);
    error EmptyStringNotAllowed(string field);
    error UnauthorizedCaller(address caller, string requiredRole);

    // ═══════════════════════════════════════════
    //                  EVENTS
    // ═══════════════════════════════════════════

    /**
     * @notice Emitted when a new candidate is added.
     */
    event CandidateAdded(
        uint256 indexed candidateId,
        string name,
        string party,
        string constituency,
        address indexed addedBy,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a candidate is removed (deactivated).
     */
    event CandidateRemoved(
        uint256 indexed candidateId,
        string name,
        address indexed removedBy,
        string reason,
        uint256 timestamp
    );

    /**
     * @notice Emitted when candidate info is updated.
     */
    event CandidateUpdated(
        uint256 indexed candidateId,
        string field,
        address indexed updatedBy,
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
     * @notice Initialize the CandidateRegistry contract.
     * @param _accessControl Address of the EVMAccessControl contract.
     */
    function initialize(address _accessControl) public initializer {
        require(_accessControl != address(0), "CandidateRegistry: zero address");


        accessControl = EVMAccessControl(_accessControl);
        nextCandidateId = 1; // Start from 1 (0 is reserved as invalid)
        totalActiveCandidates = 0;
    }

    // ═══════════════════════════════════════════
    //           CANDIDATE MANAGEMENT
    // ═══════════════════════════════════════════

    /**
     * @notice Add a new candidate to the registry.
     * @dev Only callable by ELECTION_COMMISSION_ROLE holders.
     * @param name The candidate's full name.
     * @param party The political party name.
     * @param symbol The election symbol.
     * @param photoIPFSHash The IPFS hash of the candidate's photo.
     * @param constituency The constituency the candidate is contesting from.
     * @return candidateId The unique ID assigned to the candidate.
     */
    function addCandidate(
        string calldata name,
        string calldata party,
        string calldata symbol,
        string calldata photoIPFSHash,
        string calldata constituency
    ) external onlyElectionCommission returns (uint256 candidateId) {
        if (bytes(name).length == 0) revert EmptyStringNotAllowed("name");
        if (bytes(party).length == 0) revert EmptyStringNotAllowed("party");
        if (bytes(symbol).length == 0) revert EmptyStringNotAllowed("symbol");
        if (bytes(constituency).length == 0) revert EmptyStringNotAllowed("constituency");

        candidateId = nextCandidateId;
        nextCandidateId++;

        candidates[candidateId] = Candidate({
            id: candidateId,
            name: name,
            party: party,
            symbol: symbol,
            photoIPFSHash: photoIPFSHash,
            constituency: constituency,
            isActive: true,
            nominationTimestamp: block.timestamp,
            addedBy: msg.sender
        });

        bytes32 constituencyHash = keccak256(abi.encodePacked(constituency));
        constituencyCandidates[constituencyHash].push(candidateId);

        totalActiveCandidates++;

        emit CandidateAdded(candidateId, name, party, constituency, msg.sender, block.timestamp);

        return candidateId;
    }

    /**
     * @notice Remove (deactivate) a candidate from the registry.
     * @dev Only callable by ELECTION_COMMISSION_ROLE holders.
     *      Does not delete the candidate data, only sets isActive to false.
     * @param candidateId The ID of the candidate to remove.
     * @param reason The reason for removal.
     */
    function removeCandidate(
        uint256 candidateId,
        string calldata reason
    ) external onlyElectionCommission {
        Candidate storage candidate = candidates[candidateId];

        if (candidate.id == 0) revert CandidateNotFound(candidateId);
        if (!candidate.isActive) revert CandidateAlreadyInactive(candidateId);
        if (bytes(reason).length == 0) revert EmptyStringNotAllowed("reason");

        candidate.isActive = false;
        totalActiveCandidates--;

        emit CandidateRemoved(candidateId, candidate.name, msg.sender, reason, block.timestamp);
    }

    /**
     * @notice Update a candidate's photo IPFS hash.
     * @dev Only callable by ELECTION_COMMISSION_ROLE holders.
     * @param candidateId The ID of the candidate.
     * @param newPhotoIPFSHash The new IPFS hash.
     */
    function updateCandidatePhoto(
        uint256 candidateId,
        string calldata newPhotoIPFSHash
    ) external onlyElectionCommission {
        Candidate storage candidate = candidates[candidateId];
        if (candidate.id == 0) revert CandidateNotFound(candidateId);
        if (!candidate.isActive) revert CandidateNotActive(candidateId);

        candidate.photoIPFSHash = newPhotoIPFSHash;
        emit CandidateUpdated(candidateId, "photoIPFSHash", msg.sender, block.timestamp);
    }

    // ═══════════════════════════════════════════
    //           VIEW FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Get candidate details by ID.
     * @param candidateId The ID of the candidate.
     * @return candidate The Candidate struct.
     */
    function getCandidate(uint256 candidateId) external view returns (Candidate memory candidate) {
        if (candidates[candidateId].id == 0) revert CandidateNotFound(candidateId);
        return candidates[candidateId];
    }

    /**
     * @notice Get all candidate IDs for a constituency.
     * @param constituency The constituency name.
     * @return candidateIds Array of candidate IDs.
     */
    function getCandidatesByConstituency(
        string calldata constituency
    ) external view returns (uint256[] memory candidateIds) {
        bytes32 constituencyHash = keccak256(abi.encodePacked(constituency));
        return constituencyCandidates[constituencyHash];
    }

    /**
     * @notice Get active candidates for a constituency.
     * @param constituency The constituency name.
     * @return activeCandidates Array of active Candidate structs.
     */
    function getActiveCandidatesByConstituency(
        string calldata constituency
    ) external view returns (Candidate[] memory activeCandidates) {
        bytes32 constituencyHash = keccak256(abi.encodePacked(constituency));
        uint256[] storage allIds = constituencyCandidates[constituencyHash];

        // First pass: count active candidates
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allIds.length; i++) {
            if (candidates[allIds[i]].isActive) {
                activeCount++;
            }
        }

        // Second pass: populate array
        activeCandidates = new Candidate[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < allIds.length; i++) {
            if (candidates[allIds[i]].isActive) {
                activeCandidates[idx] = candidates[allIds[i]];
                idx++;
            }
        }

        return activeCandidates;
    }

    /**
     * @notice Validate that a candidate exists and is active.
     * @param candidateId The ID of the candidate.
     * @return isValid True if the candidate exists and is active.
     */
    function validateCandidate(uint256 candidateId) external view returns (bool isValid) {
        Candidate storage candidate = candidates[candidateId];
        return candidate.id != 0 && candidate.isActive;
    }

    /**
     * @notice Get the constituency of a candidate.
     * @param candidateId The candidate ID.
     * @return constituency The constituency string.
     */
    function getCandidateConstituency(uint256 candidateId) external view returns (string memory constituency) {
        if (candidates[candidateId].id == 0) revert CandidateNotFound(candidateId);
        return candidates[candidateId].constituency;
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
