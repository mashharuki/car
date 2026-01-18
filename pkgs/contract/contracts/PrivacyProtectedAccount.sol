// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@account-abstraction/contracts/core/BaseAccount.sol";
import "@account-abstraction/contracts/core/Helpers.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title PrivacyProtectedAccount
 * @notice 車両IDのプライバシー保護機能を備えたERC-4337準拠のアカウント
 * @dev センシティブな車両情報（ナンバープレート番号）を保護し、チェーン上にはコミットメントのみを保存します
 *
 * セキュリティ機能:
 * - センシティブなデータのkeccak256ハッシュのみを保存し、決して生の値を保存しません
 * - 柔軟な認証のためにERC-4337アカウントアブストラクションを実装
 * - 決定論的なアドレス生成をサポート
 * - ゼロ知識証明検証をサポート（拡張可能）
 *
 * プライバシーモデル:
 * - 車両ナンバープレート → ハッシュ → オンチェーン保存
 * - オーナーは実際のナンバープレート番号を明かすことなく所有を証明可能
 * - オプション: 選択的開示のためのZK-SNARK回路を統合可能
 */
contract PrivacyProtectedAccount is BaseAccount, Initializable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /// @notice EntryPointコントラクトアドレス (シングルトン)
    IEntryPoint private immutable _entryPoint;

    /// @notice オーナーのEOAアドレス（車両データから導出可能）
    address public owner;

    /// @notice センシティブな車両データへのコミットメント (keccak256ハッシュ)
    /// @dev Rawの車両ナンバープレートをオンチェーンに決して保存しないこと
    bytes32 public vehicleCommitment;

    /// @notice オプション: 二次認証要素
    bytes32 public secondaryCommitment;

    /// @notice リプレイ保護のためのナンス
    uint256 private _nonce;

    event PrivacyProtectedAccountInitialized(
        IEntryPoint indexed entryPoint,
        address indexed owner,
        bytes32 vehicleCommitment
    );

    event VehicleCommitmentUpdated(
        bytes32 indexed oldCommitment,
        bytes32 indexed newCommitment
    );

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    /// @inheritdoc BaseAccount
    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    constructor(IEntryPoint anEntryPoint) {
        _entryPoint = anEntryPoint;
        _disableInitializers();
    }

    function _onlyOwner() internal view {
        require(
            msg.sender == owner || msg.sender == address(this),
            "only owner"
        );
    }

    /**
     * @notice オーナーと車両コミットメントでアカウントを初期化します
     * @param anOwner オーナーアドレス（車両データから決定論的に導出可能）
     * @param aVehicleCommitment 車両データのハッシュ (例: keccak256(abi.encodePacked(plateNumber, salt)))
     * @dev 重要: この関数に決して生の車両データを渡さないでください
     */
    function initialize(address anOwner, bytes32 aVehicleCommitment) public virtual {
        _initialize(anOwner, aVehicleCommitment);
    }

    function _initialize(address anOwner, bytes32 aVehicleCommitment) internal virtual {
        require(owner == address(0), "account: already initialized");
        require(anOwner != address(0), "account: owner cannot be zero");
        require(aVehicleCommitment != bytes32(0), "account: commitment cannot be zero");

        owner = anOwner;
        vehicleCommitment = aVehicleCommitment;

        emit PrivacyProtectedAccountInitialized(_entryPoint, anOwner, aVehicleCommitment);
    }

    /**
     * @notice 車両コミットメントを更新します（例: 車両の所有者が変わった場合）
     * @param newCommitment 新しいコミットメントハッシュ
     * @dev オーナーまたはEntryPointからのみ呼び出し可能
     */
    function updateVehicleCommitment(bytes32 newCommitment) external onlyOwner {
        require(newCommitment != bytes32(0), "account: commitment cannot be zero");

        bytes32 oldCommitment = vehicleCommitment;
        vehicleCommitment = newCommitment;

        emit VehicleCommitmentUpdated(oldCommitment, newCommitment);
    }

    /**
     * @notice 与えられたプリイメージが保存されたコミットメントと一致するか検証します
     * @param plateNumber 車両のナンバープレート番号（センシティブデータ）
     * @param salt コミットメント中に使用されたランダムソルト
     * @return コミットメントが一致すればtrue
     * @dev 警告: トランザクション内で呼び出された場合、オンチェーンでナンバープレート番号が公開されます
     *      view/pureコンテキストまたは追加のプライバシーレイヤー（例: ZK証明）でのみ使用してください
     */
    function verifyVehicleOwnership(
        string memory plateNumber,
        bytes32 salt
    ) external view returns (bool) {
        bytes32 computedCommitment = keccak256(abi.encodePacked(plateNumber, salt));
        return computedCommitment == vehicleCommitment;
    }

    /// @inheritdoc BaseAccount
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        address recovered = hash.recover(userOp.signature);

        if (recovered != owner) {
            return SIG_VALIDATION_FAILED;
        }
        return SIG_VALIDATION_SUCCESS;
    }

    /**
     * @notice このアカウントからの呼び出しを実行します
     * @param dest 宛先アドレス
     * @param value 送信するETHの量
     * @param func コールデータ
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external {
        _requireFromEntryPointOrOwner();
        _call(dest, value, func);
    }

    /**
     * @notice このアカウントからの一括呼び出しを実行します
     * @param dest 宛先アドレスの配列
     * @param value ETH量の配列
     * @param func コールデータの配列
     */
    function executeBatch(
        address[] calldata dest,
        uint256[] calldata value,
        bytes[] calldata func
    ) external {
        _requireFromEntryPointOrOwner();
        require(
            dest.length == func.length &&
            (value.length == 0 || value.length == func.length),
            "account: wrong array lengths"
        );

        if (value.length == 0) {
            for (uint256 i = 0; i < dest.length; i++) {
                _call(dest[i], 0, func[i]);
            }
        } else {
            for (uint256 i = 0; i < dest.length; i++) {
                _call(dest[i], value[i], func[i]);
            }
        }
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /**
     * @notice ガス支払いのためにEntryPointに資金を預け入れます
     */
    function addDeposit() public payable {
        entryPoint().depositTo{value: msg.value}(address(this));
    }

    /**
     * @notice EntryPointから資金を引き出します
     * @param withdrawAddress 引き出した資金を受け取るアドレス
     * @param amount 引き出す量
     */
    function withdrawDepositTo(
        address payable withdrawAddress,
        uint256 amount
    ) public onlyOwner {
        entryPoint().withdrawTo(withdrawAddress, amount);
    }

    function _requireFromEntryPointOrOwner() internal view {
        require(
            msg.sender == address(entryPoint()) || msg.sender == owner,
            "account: not Owner or EntryPoint"
        );
    }

    /**
     * @notice EntryPointからデポジット情報を取得します
     */
    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    /**
     * @notice ETH転送を受け入れます
     */
    receive() external payable {}
}
