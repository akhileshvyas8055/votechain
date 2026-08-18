// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title EVMAccessControl
 * @author VoteChain Team
 * @notice Role-based access control contract for the VoteChain EVM system.
 *         Defines roles for Election Commission members, booth officers,
 *         auditors, and EVM machines.
 * @dev Extends OpenZeppelin's AccessControlUpgradeable with custom roles.
 *      Uses UUPS upgradeable pattern for future improvements.
 */
contract EVMAccessControl is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    // ═══════════════════════════════════════════
    //                  ROLES
    // ═══════════════════════════════════════════

    /**
     * @notice Role for Election Commission members who manage elections.
     * @dev Can create/manage elections, manage candidates, certify results.
     */
    bytes32 public constant ELECTION_COMMISSION_ROLE = keccak256("ELECTION_COMMISSION_ROLE");

    /**
     * @notice Role for booth officers who register voters at polling booths.
     * @dev Can register voters and manage booth operations.
     */
    bytes32 public constant BOOTH_OFFICER_ROLE = keccak256("BOOTH_OFFICER_ROLE");

    /**
     * @notice Role for auditors who can view audit trails and verify data.
     * @dev Read-only access to sensitive voter information and audit logs.
     */
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    /**
     * @notice Role for EVM machines that submit votes to the blockchain.
     * @dev Can cast votes on behalf of authenticated voters.
     */
    bytes32 public constant MACHINE_ROLE = keccak256("MACHINE_ROLE");

    // ═══════════════════════════════════════════
    //                  EVENTS
    // ═══════════════════════════════════════════

    /**
     * @notice Emitted when a new machine is granted access.
     * @param machine The address of the machine.
     * @param grantedBy The admin who granted access.
     * @param timestamp The block timestamp.
     */
    event MachineAccessGranted(
        address indexed machine,
        address indexed grantedBy,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a machine's access is revoked.
     * @param machine The address of the machine.
     * @param revokedBy The admin who revoked access.
     * @param timestamp The block timestamp.
     */
    event MachineAccessRevoked(
        address indexed machine,
        address indexed revokedBy,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a booth officer is granted access.
     * @param officer The address of the officer.
     * @param grantedBy The admin who granted access.
     * @param timestamp The block timestamp.
     */
    event BoothOfficerGranted(
        address indexed officer,
        address indexed grantedBy,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a booth officer's access is revoked.
     * @param officer The address of the officer.
     * @param revokedBy The admin who revoked access.
     * @param timestamp The block timestamp.
     */
    event BoothOfficerRevoked(
        address indexed officer,
        address indexed revokedBy,
        uint256 timestamp
    );

    /**
     * @notice Emitted when an auditor is granted access.
     * @param auditor The address of the auditor.
     * @param grantedBy The admin who granted access.
     * @param timestamp The block timestamp.
     */
    event AuditorGranted(
        address indexed auditor,
        address indexed grantedBy,
        uint256 timestamp
    );

    // ═══════════════════════════════════════════
    //              CUSTOM ERRORS
    // ═══════════════════════════════════════════

    /// @notice Thrown when the zero address is provided.
    error ZeroAddressNotAllowed();

    /// @notice Thrown when trying to grant a role that the address already has.
    error RoleAlreadyGranted(address account, bytes32 role);

    /// @notice Thrown when trying to revoke a role the address doesn't have.
    error RoleNotGranted(address account, bytes32 role);

    // ═══════════════════════════════════════════
    //              INITIALIZATION
    // ═══════════════════════════════════════════

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the access control contract.
     * @dev Sets up the deployer as DEFAULT_ADMIN and ELECTION_COMMISSION.
     *      Must be called exactly once via the proxy.
     */
    function initialize() public initializer {
        __AccessControl_init();

        // Deployer gets admin and EC role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ELECTION_COMMISSION_ROLE, msg.sender);

        // Set role admins
        _setRoleAdmin(BOOTH_OFFICER_ROLE, ELECTION_COMMISSION_ROLE);
        _setRoleAdmin(MACHINE_ROLE, ELECTION_COMMISSION_ROLE);
        _setRoleAdmin(AUDITOR_ROLE, ELECTION_COMMISSION_ROLE);
    }

    // ═══════════════════════════════════════════
    //              MACHINE MANAGEMENT
    // ═══════════════════════════════════════════

    /**
     * @notice Grant machine access to an EVM machine address.
     * @dev Only callable by ELECTION_COMMISSION_ROLE holders.
     * @param machine The address of the EVM machine to authorize.
     */
    function grantMachineAccess(address machine) external onlyRole(ELECTION_COMMISSION_ROLE) {
        if (machine == address(0)) {
            revert ZeroAddressNotAllowed();
        }
        if (hasRole(MACHINE_ROLE, machine)) {
            revert RoleAlreadyGranted(machine, MACHINE_ROLE);
        }

        _grantRole(MACHINE_ROLE, machine);
        emit MachineAccessGranted(machine, msg.sender, block.timestamp);
    }

    /**
     * @notice Revoke machine access from an EVM machine address.
     * @dev Only callable by ELECTION_COMMISSION_ROLE holders.
     * @param machine The address of the EVM machine to deauthorize.
     */
    function revokeMachineAccess(address machine) external onlyRole(ELECTION_COMMISSION_ROLE) {
        if (machine == address(0)) {
            revert ZeroAddressNotAllowed();
        }
        if (!hasRole(MACHINE_ROLE, machine)) {
            revert RoleNotGranted(machine, MACHINE_ROLE);
        }

        _revokeRole(MACHINE_ROLE, machine);
        emit MachineAccessRevoked(machine, msg.sender, block.timestamp);
    }

    // ═══════════════════════════════════════════
    //           BOOTH OFFICER MANAGEMENT
    // ═══════════════════════════════════════════

    /**
     * @notice Grant booth officer role to an address.
     * @dev Only callable by ELECTION_COMMISSION_ROLE holders.
     * @param officer The address of the booth officer.
     */
    function grantBoothOfficerRole(address officer) external onlyRole(ELECTION_COMMISSION_ROLE) {
        if (officer == address(0)) {
            revert ZeroAddressNotAllowed();
        }
        if (hasRole(BOOTH_OFFICER_ROLE, officer)) {
            revert RoleAlreadyGranted(officer, BOOTH_OFFICER_ROLE);
        }

        _grantRole(BOOTH_OFFICER_ROLE, officer);
        emit BoothOfficerGranted(officer, msg.sender, block.timestamp);
    }

    /**
     * @notice Revoke booth officer role from an address.
     * @dev Only callable by ELECTION_COMMISSION_ROLE holders.
     * @param officer The address of the booth officer.
     */
    function revokeBoothOfficerRole(address officer) external onlyRole(ELECTION_COMMISSION_ROLE) {
        if (officer == address(0)) {
            revert ZeroAddressNotAllowed();
        }
        if (!hasRole(BOOTH_OFFICER_ROLE, officer)) {
            revert RoleNotGranted(officer, BOOTH_OFFICER_ROLE);
        }

        _revokeRole(BOOTH_OFFICER_ROLE, officer);
        emit BoothOfficerRevoked(officer, msg.sender, block.timestamp);
    }

    // ═══════════════════════════════════════════
    //           AUDITOR MANAGEMENT
    // ═══════════════════════════════════════════

    /**
     * @notice Grant auditor role to an address.
     * @dev Only callable by ELECTION_COMMISSION_ROLE holders.
     * @param auditor The address to grant auditor access.
     */
    function grantAuditorRole(address auditor) external onlyRole(ELECTION_COMMISSION_ROLE) {
        if (auditor == address(0)) {
            revert ZeroAddressNotAllowed();
        }
        if (hasRole(AUDITOR_ROLE, auditor)) {
            revert RoleAlreadyGranted(auditor, AUDITOR_ROLE);
        }

        _grantRole(AUDITOR_ROLE, auditor);
        emit AuditorGranted(auditor, msg.sender, block.timestamp);
    }

    // ═══════════════════════════════════════════
    //           EC MEMBER MANAGEMENT
    // ═══════════════════════════════════════════

    /**
     * @notice Add a new Election Commission member.
     * @dev Only callable by DEFAULT_ADMIN_ROLE holders.
     * @param member The address of the new EC member.
     */
    function addECMember(address member) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (member == address(0)) {
            revert ZeroAddressNotAllowed();
        }
        if (hasRole(ELECTION_COMMISSION_ROLE, member)) {
            revert RoleAlreadyGranted(member, ELECTION_COMMISSION_ROLE);
        }

        _grantRole(ELECTION_COMMISSION_ROLE, member);
    }

    /**
     * @notice Remove an Election Commission member.
     * @dev Only callable by DEFAULT_ADMIN_ROLE holders.
     *      Cannot remove the last admin.
     * @param member The address of the EC member to remove.
     */
    function removeECMember(address member) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (member == address(0)) {
            revert ZeroAddressNotAllowed();
        }
        if (!hasRole(ELECTION_COMMISSION_ROLE, member)) {
            revert RoleNotGranted(member, ELECTION_COMMISSION_ROLE);
        }

        _revokeRole(ELECTION_COMMISSION_ROLE, member);
    }

    // ═══════════════════════════════════════════
    //           VIEW FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @notice Check if an address is an authorized EVM machine.
     * @param machine The address to check.
     * @return True if the address has the MACHINE_ROLE.
     */
    function isAuthorizedMachine(address machine) external view returns (bool) {
        return hasRole(MACHINE_ROLE, machine);
    }

    /**
     * @notice Check if an address is a booth officer.
     * @param officer The address to check.
     * @return True if the address has the BOOTH_OFFICER_ROLE.
     */
    function isBoothOfficer(address officer) external view returns (bool) {
        return hasRole(BOOTH_OFFICER_ROLE, officer);
    }

    /**
     * @notice Check if an address is an EC member.
     * @param member The address to check.
     * @return True if the address has the ELECTION_COMMISSION_ROLE.
     */
    function isECMember(address member) external view returns (bool) {
        return hasRole(ELECTION_COMMISSION_ROLE, member);
    }

    /**
     * @notice Check if an address is an auditor.
     * @param auditor The address to check.
     * @return True if the address has the AUDITOR_ROLE.
     */
    function isAuditor(address auditor) external view returns (bool) {
        return hasRole(AUDITOR_ROLE, auditor);
    }

    // ═══════════════════════════════════════════
    //           UPGRADE AUTHORIZATION
    // ═══════════════════════════════════════════

    /**
     * @notice Authorize an upgrade to a new implementation.
     * @dev Only the DEFAULT_ADMIN_ROLE can authorize upgrades.
     * @param newImplementation The address of the new implementation.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
