// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./PrivacyProtectedAccount.sol";

/**
 * @title AccountFactory
 * @notice 決定論的なアドレスを持つPrivacyProtectedAccountコントラクトをデプロイするためのファクトリ
 * @dev CREATE2を使用して、車両データハッシュに基づいて決定論的なアドレス生成を行います
 *
 * プライバシー機能:
 * - 車両コミットメントから決定論的なアドレス生成（生データを公開することなく）
 * - 全てのEVMチェーンで予測可能なアドレス
 * - センシティブな車両情報の保存なし
 *
 * 使用パターン:
 * 1. オフチェーン: 車両コミットメントを計算 = keccak256(abi.encodePacked(plateNumber, salt))
 * 2. オフチェーン: オーナーアドレスを導出（例: 車両データ + ユーザーシードから）
 * 3. 呼び出し: createAccount(owner, vehicleCommitment, salt)
 * 4. 結果: 決定論的なアカウントアドレスを取得
 */
contract AccountFactory {
    /// @notice プロキシの実装コントラクト
    PrivacyProtectedAccount public immutable accountImplementation;

    event AccountCreated(
        address indexed account,
        address indexed owner,
        bytes32 indexed vehicleCommitment,
        uint256 salt
    );

    constructor(IEntryPoint _entryPoint) {
        accountImplementation = new PrivacyProtectedAccount(_entryPoint);
    }

    /**
     * @notice 決定論的なアドレスでアカウントを作成します
     * @param owner オーナーアドレス
     * @param vehicleCommitment 車両データのハッシュ (keccak256(abi.encodePacked(plateNumber, userSalt)))
     * @param salt アドレス生成のための追加ソルト
     * @return account 作成されたアカウントアドレス
     *
     * @dev セキュリティ上の注意:
     * - vehicleCommitmentは決して生のナンバープレート番号であってはなりません
     * - saltはコミットメントをユーザーごとにユニークにすることで、プライバシーの層を追加します
     * - 同じ (owner, vehicleCommitment, salt) の組み合わせは常に同じアドレスを生成します
     */
    function createAccount(
        address owner,
        bytes32 vehicleCommitment,
        uint256 salt
    ) public returns (PrivacyProtectedAccount account) {
        address addr = getAddress(owner, vehicleCommitment, salt);
        uint256 codeSize = addr.code.length;

        if (codeSize > 0) {
            return PrivacyProtectedAccount(payable(addr));
        }

        account = PrivacyProtectedAccount(
            payable(
                new ERC1967Proxy{salt: bytes32(salt)}(
                    address(accountImplementation),
                    abi.encodeCall(
                        PrivacyProtectedAccount.initialize,
                        (owner, vehicleCommitment)
                    )
                )
            )
        );

        emit AccountCreated(address(account), owner, vehicleCommitment, salt);
    }

    /**
     * @notice アカウントのカウンターファクチュアルアドレスを計算します
     * @param owner オーナーアドレス
     * @param vehicleCommitment 車両データのハッシュ
     * @param salt アドレス生成のためのソルト
     * @return カウンターファクチュアルアドレス
     *
     * @dev デプロイ前にアドレスを知るためにオフチェーンで呼び出すことができます
     *      アカウント作成前に資金を受け取るのに便利です
     */
    function getAddress(
        address owner,
        bytes32 vehicleCommitment,
        uint256 salt
    ) public view returns (address) {
        return
            Create2.computeAddress(
                bytes32(salt),
                keccak256(
                    abi.encodePacked(
                        type(ERC1967Proxy).creationCode,
                        abi.encode(
                            address(accountImplementation),
                            abi.encodeCall(
                                PrivacyProtectedAccount.initialize,
                                (owner, vehicleCommitment)
                            )
                        )
                    )
                )
            );
    }

    /**
     * @notice 車両コミットメントを計算するためのヘルパー関数（オフチェーンパターン）
     * @param plateNumber 車両のナンバープレート番号
     * @param userSalt プライバシーのためのユーザー固有のソルト
     * @return コミットメントハッシュ
     *
     * @dev 警告: 本物のナンバープレート番号でこれをオンチェーンで呼び出さないでください
     *      これはオフチェーン計算のための参照実装です
     *      フロントエンド/バックエンドでこのパターンを使用してください:
     *      - commitment = keccak256(abi.encodePacked(plateNumber, userSalt))
     */
    function computeVehicleCommitment(
        string memory plateNumber,
        bytes32 userSalt
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(plateNumber, userSalt));
    }

    /**
     * @notice 複数の車両用のアカウントを一括作成します
     * @param owners オーナーアドレスの配列
     * @param vehicleCommitments 車両コミットメントの配列
     * @param salts ソルトの配列
     * @return accounts 作成されたアカウントアドレスの配列
     */
    function createAccountBatch(
        address[] calldata owners,
        bytes32[] calldata vehicleCommitments,
        uint256[] calldata salts
    ) external returns (PrivacyProtectedAccount[] memory accounts) {
        require(
            owners.length == vehicleCommitments.length &&
            owners.length == salts.length,
            "AccountFactory: array length mismatch"
        );

        accounts = new PrivacyProtectedAccount[](owners.length);

        for (uint256 i = 0; i < owners.length; i++) {
            accounts[i] = createAccount(
                owners[i],
                vehicleCommitments[i],
                salts[i]
            );
        }

        return accounts;
    }

    /**
     * @notice 一括作成用のアドレスを取得します（カウンターファクチュアル）
     * @param owners オーナーアドレスの配列
     * @param vehicleCommitments 車両コミットメントの配列
     * @param salts ソルトの配列
     * @return addresses カウンターファクチュアルアドレスの配列
     */
    function getAddressBatch(
        address[] calldata owners,
        bytes32[] calldata vehicleCommitments,
        uint256[] calldata salts
    ) external view returns (address[] memory addresses) {
        require(
            owners.length == vehicleCommitments.length &&
            owners.length == salts.length,
            "AccountFactory: array length mismatch"
        );

        addresses = new address[](owners.length);

        for (uint256 i = 0; i < owners.length; i++) {
            addresses[i] = getAddress(
                owners[i],
                vehicleCommitments[i],
                salts[i]
            );
        }

        return addresses;
    }
}
