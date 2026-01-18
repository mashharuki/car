// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AccountFactory.sol";
import "./PrivacyProtectedAccount.sol";

/**
 * @notice ZK証明検証 (Groth16) のためのインターフェース
 * @dev circom回路から生成されたLicensePlateCommitmentVerifier.solと一致します
 */
interface ILicensePlateVerifier {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[1] memory input
    ) external view returns (bool);
}

/**
 * @title LicensePlateAccountFactory
 * @notice ZK証明検証付きで車両ナンバープレートからERC-4337ウォレットを作成するためのファクトリ
 * @dev AccountFactoryを拡張し、強化されたプライバシーのためのオプションのZK証明検証を追加します
 *
 * ユースケース:
 * 1. ナンバープレートコミットメントからウォレットを作成 (ZK証明なし)
 * 2. ZK証明検証付きでウォレットを作成 (ナンバープレートを公開せずに所有権を証明)
 *
 * プライバシーモデル:
 * - オフチェーン: plateNumber + salt → commitment (Poseidonハッシュ)
 * - オンチェーン: コミットメントのみが保存され、生のナンバープレート番号は保存されません
 * - ZK証明: (plateNumber, salt) を公開せずに知識を証明
 *
 * Circomとの統合:
 * - 回路: LicensePlateOwnership.circom
 * - 検証器: LicensePlateVerifier.sol (回路から生成)
 * - 証明: commitment(plateNumber, salt) == publicCommitment であることのGroth16証明
 */
contract LicensePlateAccountFactory is AccountFactory, Ownable {
    /// @notice ZK検証コントラクト (有効な場合)
    /// @dev ZK検証が不要な場合はaddress(0)になることがあります
    address public zkVerifier;

    /// @notice ZK証明要件の有効化/無効化
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
        zkProofRequired = false; // デフォルト: ZK証明は不要
    }

    /**
     * @notice ZK検証コントラクトアドレスを設定します
     * @param _zkVerifier LicensePlateVerifierコントラクトのアドレス
     * @dev オーナーのみが検証器を更新できます
     */
    function setZKVerifier(address _zkVerifier) external onlyOwner {
        address oldVerifier = zkVerifier;
        zkVerifier = _zkVerifier;
        emit ZKVerifierUpdated(oldVerifier, _zkVerifier);
    }

    /**
     * @notice ZK証明要件を有効化または無効化します
     * @param required ZK証明が必要な場合はtrue、そうでない場合はfalse
     */
    function setZKProofRequired(bool required) external onlyOwner {
        zkProofRequired = required;
        emit ZKProofRequirementUpdated(required);
    }

    /**
     * @notice オプションのZK証明を使用してナンバープレートからアカウントを作成します
     * @param owner オーナーアドレス（ユーザーのウォレットから導出可能）
     * @param vehicleCommitment ナンバープレートデータのPoseidonハッシュ（ZK回路からの公開シグナル）
     * @param salt 決定論的なアドレス生成のためのソルト
     * @param proof ZK証明データ（Groth16証明: a, b, c をバイトとしてエンコード）
     * @return account 作成されたアカウントアドレス
     *
     * @dev ZK証明統合:
     *      - zkProofRequiredがtrueの場合、証明は有効なGroth16証明でなければなりません
     *      - 証明フォーマット: abi.encode(uint[2] a, uint[2][2] b, uint[2] c)
     *      - 公開入力: vehicleCommitment (plateChars[8] + salt のPoseidonハッシュ)
     *      - 秘密入力 (証明される): plateChars[8], salt
     *
     * 使用例 (ZKなし):
     *   // オフチェーン: Poseidonコミットメントを計算
     *   const commitment = await poseidon([...plateChars, salt]);
     *   await factory.createAccountFromPlate(owner, commitment, 12345, '0x');
     *
     * 使用例 (ZKあり):
     *   // オフチェーン: ZK証明を生成
     *   const input = { plateChars, salt, publicCommitment: commitment };
     *   const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmFile, zkeyFile);
     *   const encodedProof = encodeGroth16Proof(proof); // abi.encode(a, b, c)
     *   await factory.createAccountFromPlate(owner, publicSignals[0], 12345, encodedProof);
     */
    function createAccountFromPlate(
        address owner,
        bytes32 vehicleCommitment,
        uint256 salt,
        bytes calldata proof
    ) external returns (PrivacyProtectedAccount account) {
        // ZK証明が必要な場合、それを検証します
        if (zkProofRequired) {
            require(zkVerifier != address(0), "LicensePlateAccountFactory: ZK verifier not set");
            require(proof.length > 0, "LicensePlateAccountFactory: proof required");

            // Groth16証明コンポーネントをデコード
            (uint[2] memory a, uint[2][2] memory b, uint[2] memory c) =
                abi.decode(proof, (uint[2], uint[2][2], uint[2]));

            // 公開入力は車両コミットメント(Poseidonハッシュ)です
            uint[1] memory input;
            input[0] = uint256(vehicleCommitment);

            // 検証器コントラクトを使用してZK証明を検証
            bool isValid = ILicensePlateVerifier(zkVerifier).verifyProof(a, b, c, input);
            require(isValid, "LicensePlateAccountFactory: invalid proof");
        }

        // ベースファクトリを使用してアカウントを作成
        account = createAccount(owner, vehicleCommitment, salt);

        emit AccountCreatedWithProof(address(account), owner, vehicleCommitment, salt);
    }

    /**
     * @notice ナンバープレートアカウントのカウンターファクチュアルアドレスを計算します
     * @param owner オーナーアドレス
     * @param vehicleCommitment ナンバープレートデータのハッシュ
     * @param salt アドレス生成のためのソルト
     * @return 予測されるアカウントアドレス
     *
     * @dev ベースのgetAddress()と同じですが、明確さのために含まれています
     */
    function getAddressFromPlate(
        address owner,
        bytes32 vehicleCommitment,
        uint256 salt
    ) external view returns (address) {
        return getAddress(owner, vehicleCommitment, salt);
    }

    /**
     * @notice ヘルパー: 車両コミットメントを計算 (オフチェーンのみ - 本物のデータでオンチェーンで呼び出さないでください)
     * @param plateNumber ナンバープレート番号
     * @param userSalt ユーザー固有のソルト
     * @return コミットメントハッシュ
     *
     * @dev 警告: これはテスト/参照のみを目的としています
     *      本物のナンバープレート番号でこれをオンチェーンで決して呼び出さないでください
     *      常にオフチェーンでコミットメントを計算してください
     */
    function computePlateCommitment(
        string memory plateNumber,
        bytes32 userSalt
    ) public pure returns (bytes32) {
        return computeVehicleCommitment(plateNumber, userSalt);
    }

    /**
     * @notice 複数のナンバープレートからアカウントを一括作成します
     * @param owners オーナーアドレスの配列
     * @param vehicleCommitments 車両コミットメントの配列
     * @param salts ソルトの配列
     * @param proofs ZK証明の配列（不要な場合は空の配列）
     * @return accounts 作成されたアカウントアドレスの配列
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
