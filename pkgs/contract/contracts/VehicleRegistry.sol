// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VehicleRegistry
 * @notice 車両とウォレットのマッピングのためのプライバシー保護レジストリ
 * @dev コミットメントとメタデータのみを保存し、けっして生の車両識別データを保存しません
 *
 * プライバシー設計:
 * - 実際のナンバープレート番号の代わりに車両コミットメント（ハッシュ）を保存
 * - ZK証明検証をサポート（拡張可能）
 * - 車両属性の選択的開示を有効化
 * - コミットメントから生データへの逆引き不可
 *
 * ユースケース:
 * - ナンバープレート番号を明かすことなく車両所有権を検証
 * - 車両をウォレットアドレスにプライベートにリンク
 * - プライバシー保護車両サービス（駐車場、通行料、保険）を有効化
 * - プライバシー保護に関する規制コンプライアンスをサポート
 */
contract VehicleRegistry is Ownable {
    struct VehicleRecord {
        bytes32 commitment; // keccak256(abi.encodePacked(plateNumber, salt))
        address walletAddress; // 関連するAAウォレット
        uint256 registeredAt; // 登録タイムスタンプ
        bool isActive; // ステータスフラグ
        bytes32 metadataHash; // 追加メタデータのハッシュ（モデル、年式など）
    }

    /// @notice コミットメントから車両レコードへのマッピング
    mapping(bytes32 => VehicleRecord) public vehicles;

    /// @notice ウォレットアドレスからコミットメントへのマッピング（1対1）
    mapping(address => bytes32) public walletToVehicle;

    /// @notice 認可された検証者（例: 駐車場運営者、料金徴収システム）
    mapping(address => bool) public authorizedVerifiers;

    event VehicleRegistered(
        bytes32 indexed commitment,
        address indexed walletAddress,
        uint256 timestamp
    );

    event VehicleUpdated(
        bytes32 indexed oldCommitment,
        bytes32 indexed newCommitment,
        address indexed walletAddress
    );

    event VehicleDeactivated(
        bytes32 indexed commitment,
        address indexed walletAddress
    );

    event VerifierAuthorized(address indexed verifier, bool authorized);

    modifier onlyAuthorizedVerifier() {
        require(
            authorizedVerifiers[msg.sender] || msg.sender == owner(),
            "VehicleRegistry: not authorized verifier"
        );
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @notice 車両をそのコミットメントとともに登録します
     * @param commitment 車両データのハッシュ (keccak256(abi.encodePacked(plateNumber, salt)))
     * @param walletAddress 関連するAAウォレットアドレス
     * @param metadataHash 車両メタデータのハッシュ（オプション）
     *
     * @dev 重要: コミットメントはオフチェーンで計算されなければなりません
     *      生のナンバープレート番号をオンチェーン関数に渡さないでください
     */
    function registerVehicle(
        bytes32 commitment,
        address walletAddress,
        bytes32 metadataHash
    ) external {
        require(commitment != bytes32(0), "VehicleRegistry: invalid commitment");
        require(walletAddress != address(0), "VehicleRegistry: invalid wallet");
        require(
            vehicles[commitment].commitment == bytes32(0),
            "VehicleRegistry: already registered"
        );
        require(
            walletToVehicle[walletAddress] == bytes32(0),
            "VehicleRegistry: wallet already linked"
        );

        vehicles[commitment] = VehicleRecord({
            commitment: commitment,
            walletAddress: walletAddress,
            registeredAt: block.timestamp,
            isActive: true,
            metadataHash: metadataHash
        });

        walletToVehicle[walletAddress] = commitment;

        emit VehicleRegistered(commitment, walletAddress, block.timestamp);
    }

    /**
     * @notice 車両コミットメントを更新します（例: プライバシーパラメータを変更する場合）
     * @param oldCommitment 現在のコミットメント
     * @param newCommitment 新しいコミットメント
     *
     * @dev 関連するウォレットのみが更新可能
     */
    function updateVehicleCommitment(
        bytes32 oldCommitment,
        bytes32 newCommitment
    ) external {
        require(
            vehicles[oldCommitment].walletAddress == msg.sender,
            "VehicleRegistry: not vehicle owner"
        );
        require(
            vehicles[oldCommitment].isActive,
            "VehicleRegistry: vehicle not active"
        );
        require(
            vehicles[newCommitment].commitment == bytes32(0),
            "VehicleRegistry: new commitment already exists"
        );

        address walletAddress = vehicles[oldCommitment].walletAddress;
        VehicleRecord memory record = vehicles[oldCommitment];

        // 新しいレコードを作成
        vehicles[newCommitment] = VehicleRecord({
            commitment: newCommitment,
            walletAddress: walletAddress,
            registeredAt: record.registeredAt,
            isActive: true,
            metadataHash: record.metadataHash
        });

        // 古いレコードを無効化
        vehicles[oldCommitment].isActive = false;

        // 逆引きマッピングを更新
        walletToVehicle[walletAddress] = newCommitment;

        emit VehicleUpdated(oldCommitment, newCommitment, walletAddress);
    }

    /**
     * @notice 車両レコードを無効化します
     * @param commitment 無効化する車両コミットメント
     *
     * @dev 関連するウォレットのみが無効化可能
     */
    function deactivateVehicle(bytes32 commitment) external {
        require(
            vehicles[commitment].walletAddress == msg.sender,
            "VehicleRegistry: not vehicle owner"
        );
        require(
            vehicles[commitment].isActive,
            "VehicleRegistry: already inactive"
        );

        vehicles[commitment].isActive = false;
        delete walletToVehicle[msg.sender];

        emit VehicleDeactivated(commitment, msg.sender);
    }

    /**
     * @notice コミットメントが登録済みでアクティブかどうか検証します
     * @param commitment 検証する車両コミットメント
     * @return isRegistered 登録済みかつアクティブならtrue
     */
    function verifyVehicleRegistration(bytes32 commitment)
        external
        view
        onlyAuthorizedVerifier
        returns (bool isRegistered)
    {
        return vehicles[commitment].isActive;
    }

    /**
     * @notice コミットメントによる車両レコードを取得します
     * @param commitment 車両コミットメント
     * @return record 車両レコード
     *
     * @dev 認可された検証者のみがアクセス可能
     */
    function getVehicleRecord(bytes32 commitment)
        external
        view
        onlyAuthorizedVerifier
        returns (VehicleRecord memory record)
    {
        require(
            vehicles[commitment].commitment != bytes32(0),
            "VehicleRegistry: vehicle not found"
        );
        return vehicles[commitment];
    }

    /**
     * @notice ウォレットアドレスによるコミットメントを取得します
     * @param walletAddress ウォレットアドレス
     * @return commitment 車両コミットメント
     */
    function getCommitmentByWallet(address walletAddress)
        external
        view
        returns (bytes32 commitment)
    {
        require(
            msg.sender == walletAddress || authorizedVerifiers[msg.sender] || msg.sender == owner(),
            "VehicleRegistry: not authorized"
        );
        return walletToVehicle[walletAddress];
    }

    /**
     * @notice 証明を使用して車両所有権を検証します
     * @param commitment 主張する車両コミットメント
     * @param walletAddress 主張するウォレットアドレス
     * @return isValid 主張が有効ならtrue
     *
     * @dev これは単純な検証です。ZK証明の場合、この関数を拡張してください
     */
    function verifyOwnership(
        bytes32 commitment,
        address walletAddress
    ) external view onlyAuthorizedVerifier returns (bool isValid) {
        return vehicles[commitment].walletAddress == walletAddress &&
               vehicles[commitment].isActive;
    }

    /**
     * @notice 検証者を認可または取り消しします
     * @param verifier 認可/取り消しするアドレス
     * @param authorized 認可する場合はtrue、取り消す場合はfalse
     *
     * @dev オーナーのみが検証者を管理可能
     */
    function setVerifierAuthorization(address verifier, bool authorized)
        external
        onlyOwner
    {
        authorizedVerifiers[verifier] = authorized;
        emit VerifierAuthorized(verifier, authorized);
    }

    /**
     * @notice 車両を一括登録します
     * @param commitments 車両コミットメントの配列
     * @param walletAddresses ウォレットアドレスの配列
     * @param metadataHashes メタデータハッシュの配列
     */
    function registerVehicleBatch(
        bytes32[] calldata commitments,
        address[] calldata walletAddresses,
        bytes32[] calldata metadataHashes
    ) external {
        require(
            commitments.length == walletAddresses.length &&
            commitments.length == metadataHashes.length,
            "VehicleRegistry: array length mismatch"
        );

        for (uint256 i = 0; i < commitments.length; i++) {
            // 注意: 登録に失敗した場合、これはリバートします
            // 必要に応じてエラー時に継続するバージョンの実装を検討してください
            this.registerVehicle(
                commitments[i],
                walletAddresses[i],
                metadataHashes[i]
            );
        }
    }

    /**
     * @notice 車両のメタデータハッシュを更新します
     * @param commitment 車両コミットメント
     * @param newMetadataHash 新しいメタデータハッシュ
     */
    function updateMetadata(bytes32 commitment, bytes32 newMetadataHash)
        external
    {
        require(
            vehicles[commitment].walletAddress == msg.sender,
            "VehicleRegistry: not vehicle owner"
        );
        require(
            vehicles[commitment].isActive,
            "VehicleRegistry: vehicle not active"
        );

        vehicles[commitment].metadataHash = newMetadataHash;
    }
}
