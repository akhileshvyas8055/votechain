# VoteChain EVM - Comprehensive Security Architecture

## Threat Model & Risk Mitigation Matrix

| Threat / Attack Vector | Severity | Architectural Mitigation Strategy |
| :--- | :--- | :--- |
| **Double Voting** | Critical | Enforced on-chain inside `VotingCore.sol` via `hasVotedInElection[bytes32][uint256]` state check linked to salt-hashed fingerprint. |
| **Vote Tampering / MITM** | Critical | Transactions signed directly by authorized EVM hardware keys (`MACHINE_ROLE`) and submitted to EVM consensus nodes. |
| **Privacy Violation** | High | Zero link on-chain between voter registration record (`VoterRegistry`) and individual vote casting records (`VotingCore`). |
| **Unauthorized Result Alteration** | Critical | Mandatory 3-of-5 multisig threshold certification in `ElectionManager.sol` before election results can be finalized. |
| **Audit Trail Manipulation** | High | Immutable append-only chain of cryptographic hashes stored in `AuditTrail.sol`. |

## Encryption & Key Management

- **Biometric Templates**: Encrypted locally using **AES-256-GCM** prior to PostgreSQL database persistence.
- **Fingerprint Hashes**: Single-way **keccak256** hash combined with system-wide salt (`FINGERPRINT_SALT`) for on-chain identity verification.
- **Role-Based Access Control**: Standardized OpenZeppelin `AccessControlUpgradeable` (UUPS standard).
