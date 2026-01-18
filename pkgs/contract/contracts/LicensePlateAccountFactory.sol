// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AccountFactory.sol";
import "./PrivacyProtectedAccount.sol";

/**
 * @title LicensePlateAccountFactory
 * @notice Factory for creating ERC-4337 wallets from vehicle license plates with ZK proof verification
 * @dev Extends AccountFactory with optional ZK proof verification for enhanced privacy
 *
 * Use Cases:
 * 1. Create wallet from license plate commitment (without ZK proof)
 * 2. Create wallet with ZK proof verification (proves ownership without revealing plate)
 *
 * Privacy Model:
 * - Off-chain: plateNumber + salt → commitment (Poseidon hash)
 * - On-chain: Only commitment is stored, never raw plate number
 * - ZK Proof: Proves knowledge of (plateNumber, salt) without revealing them
 *
 * Integration with Circom:
 * - Circuit: LicensePlateOwnership.circom
 * - Verifier: LicensePlateVerifier.sol (generated from circuit)
 * - Proof: Groth16 proof that commitment(plateNumber, salt) == publicCommitment
 */
contract LicensePlateAccountFactory is AccountFactory, Ownable {
    /// @notice ZK verifier contract (if enabled)
    /// @dev Can be address(0) if ZK verification is not required
    address public zkVerifier;

    /// @notice Enable/disable ZK proof requirement
    bool public zkProofRequired;

    event ZKVerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    event ZKProofRequirementUpdated(bool required);
    event AccountCreatedWithProof(
        address indexed account,
        address indexed owner,
        bytes32 indexed vehicleCommitment,
        uint256 salt
    );

    constructor(IEntryPoint _entryPoint) AccountFactory(_entryPoint) Ownable(msg.sender) {
        zkProofRequired = false; // Default: ZK proof not required
    }

    /**
     * @notice Set ZK verifier contract address
     * @param _zkVerifier Address of LicensePlateVerifier contract
     * @dev Only owner can update verifier
     */
    function setZKVerifier(address _zkVerifier) external onlyOwner {
        address oldVerifier = zkVerifier;
        zkVerifier = _zkVerifier;
        emit ZKVerifierUpdated(oldVerifier, _zkVerifier);
    }

    /**
     * @notice Enable or disable ZK proof requirement
     * @param required True to require ZK proof, false otherwise
     */
    function setZKProofRequired(bool required) external onlyOwner {
        zkProofRequired = required;
        emit ZKProofRequirementUpdated(required);
    }

    /**
     * @notice Create account from license plate with optional ZK proof
     * @param owner The owner address (can be derived from user's wallet)
     * @param vehicleCommitment Hash of license plate data
     * @param salt Salt for deterministic address generation
     * @param proof ZK proof data (empty if not required)
     * @return account The created account address
     *
     * @dev If zkProofRequired is true, proof must be valid
     *      If zkProofRequired is false, proof is ignored (can be empty)
     *
     * Example usage (without ZK):
     *   const commitment = ethers.keccak256(ethers.solidityPacked(['string', 'bytes32'], [plateNumber, salt]));
     *   await factory.createAccountFromPlate(owner, commitment, 12345, '0x');
     *
     * Example usage (with ZK):
     *   const { proof, publicSignals } = await generateZKProof(plateNumber, salt);
     *   const encodedProof = encodeProof(proof); // Encode as per verifier interface
     *   await factory.createAccountFromPlate(owner, publicSignals[0], 12345, encodedProof);
     */
    function createAccountFromPlate(
        address owner,
        bytes32 vehicleCommitment,
        uint256 salt,
        bytes calldata proof
    ) external returns (PrivacyProtectedAccount account) {
        // If ZK proof is required, verify it
        if (zkProofRequired) {
            require(zkVerifier != address(0), "LicensePlateAccountFactory: ZK verifier not set");
            require(proof.length > 0, "LicensePlateAccountFactory: proof required");

            // Verify ZK proof
            // Note: The actual verification interface depends on the generated verifier contract
            // This is a placeholder - actual implementation should match LicensePlateVerifier.sol
            (bool success, bytes memory result) = zkVerifier.staticcall(
                abi.encodeWithSignature(
                    "verifyProof(bytes,bytes32)",
                    proof,
                    vehicleCommitment
                )
            );

            require(success && abi.decode(result, (bool)), "LicensePlateAccountFactory: invalid proof");
        }

        // Create account using base factory
        account = createAccount(owner, vehicleCommitment, salt);

        emit AccountCreatedWithProof(address(account), owner, vehicleCommitment, salt);
    }

    /**
     * @notice Compute counterfactual address for license plate account
     * @param owner The owner address
     * @param vehicleCommitment Hash of license plate data
     * @param salt Salt for address generation
     * @return Predicted account address
     *
     * @dev Same as base getAddress() but included for clarity
     */
    function getAddressFromPlate(
        address owner,
        bytes32 vehicleCommitment,
        uint256 salt
    ) external view returns (address) {
        return getAddress(owner, vehicleCommitment, salt);
    }

    /**
     * @notice Helper: Compute vehicle commitment (OFF-CHAIN ONLY - DO NOT CALL ON-CHAIN WITH REAL DATA)
     * @param plateNumber License plate number
     * @param userSalt User-specific salt
     * @return Commitment hash
     *
     * @dev WARNING: This is for testing/reference only
     *      NEVER call this on-chain with real plate numbers
     *      Always compute commitment off-chain
     */
    function computePlateCommitment(
        string memory plateNumber,
        bytes32 userSalt
    ) public pure returns (bytes32) {
        return computeVehicleCommitment(plateNumber, userSalt);
    }

    /**
     * @notice Batch create accounts from multiple license plates
     * @param owners Array of owner addresses
     * @param vehicleCommitments Array of vehicle commitments
     * @param salts Array of salts
     * @param proofs Array of ZK proofs (empty array if not required)
     * @return accounts Array of created account addresses
     */
    function createAccountsFromPlatesBatch(
        address[] calldata owners,
        bytes32[] calldata vehicleCommitments,
        uint256[] calldata salts,
        bytes[] calldata proofs
    ) external returns (PrivacyProtectedAccount[] memory accounts) {
        require(
            owners.length == vehicleCommitments.length &&
            owners.length == salts.length,
            "LicensePlateAccountFactory: array length mismatch"
        );

        if (zkProofRequired) {
            require(
                proofs.length == owners.length,
                "LicensePlateAccountFactory: proofs length mismatch"
            );
        }

        accounts = new PrivacyProtectedAccount[](owners.length);

        for (uint256 i = 0; i < owners.length; i++) {
            bytes memory proof = zkProofRequired ? proofs[i] : new bytes(0);
            accounts[i] = this.createAccountFromPlate(
                owners[i],
                vehicleCommitments[i],
                salts[i],
                proof
            );
        }

        return accounts;
    }
}
