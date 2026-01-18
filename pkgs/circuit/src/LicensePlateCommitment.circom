pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

/**
 * LicensePlateCommitment - Generate commitment from license plate number
 *
 * This circuit creates a privacy-preserving commitment from a vehicle's license plate
 * using Poseidon hash. The commitment can be used to create deterministic ERC-4337
 * wallet addresses without revealing the actual plate number on-chain.
 *
 * Privacy Design:
 * - Input: plateChars (8 field elements) + salt (1 field element)
 * - Output: commitment (Poseidon hash)
 * - The plate number is never revealed on-chain, only the commitment
 *
 * Japanese License Plate Format:
 * - Region (地名): e.g., 品川 (Shinagawa)
 * - Classification (分類番号): e.g., 330
 * - Hiragana (ひらがな): e.g., あ
 * - Serial Number (一連番号): e.g., 1234
 * - Example: 品川330あ1234 (max 8 characters after encoding)
 */
template LicensePlateCommitment() {
    // Input signals
    signal input plateChars[8];  // License plate as 8 field elements (UTF-8 encoded)
    signal input salt;            // Random salt for privacy

    // Output signal
    signal output commitment;

    // Use Poseidon hash with 9 inputs (8 chars + 1 salt)
    component hash = Poseidon(9);

    // Feed plate characters
    for (var i = 0; i < 8; i++) {
        hash.inputs[i] <== plateChars[i];
    }

    // Feed salt as the last input
    hash.inputs[8] <== salt;

    // Output the commitment
    commitment <== hash.out;
}

/**
 * LicensePlateOwnership - Prove ownership of a license plate without revealing it
 *
 * This circuit proves that the prover knows a license plate number that matches
 * a public commitment, without revealing the actual plate number.
 *
 * Public inputs:
 * - publicCommitment: The commitment stored on-chain
 *
 * Private inputs:
 * - plateChars: The actual license plate (secret)
 * - salt: The salt used to generate the commitment (secret)
 *
 * The circuit verifies: commitment(plateChars, salt) == publicCommitment
 */
template LicensePlateOwnership() {
    // Private inputs
    signal input plateChars[8];
    signal input salt;

    // Public input
    signal input publicCommitment;

    // Generate commitment from private inputs
    component commitmentGenerator = LicensePlateCommitment();
    for (var i = 0; i < 8; i++) {
        commitmentGenerator.plateChars[i] <== plateChars[i];
    }
    commitmentGenerator.salt <== salt;

    // Verify that generated commitment matches public commitment
    publicCommitment === commitmentGenerator.commitment;
}

// Main component: Prove ownership without revealing plate number
// Public: publicCommitment
// Private: plateChars, salt
component main {public [publicCommitment]} = LicensePlateOwnership();
