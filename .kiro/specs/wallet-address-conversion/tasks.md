# 実装計画: ウォレットアドレス変換機能

## 概要

本実装計画は、ウォレットアドレス変換機能を段階的に実装するためのタスクリストです。Circom回路の開発から始め、スマートコントラクト、フロントエンド統合、そしてテストまでを網羅します。

## タスク

- [ ] 1. 共通型定義とユーティリティの作成
  - [ ] 1.1 ZKInput型とConversionResult型を定義する
    - `pkgs/frontend/types/wallet.ts` を作成
    - ZKInput、ConversionError、ProofResult等の型を定義
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [ ] 1.2 日本語エンコーディングユーティリティを実装する
    - `pkgs/frontend/lib/wallet/encoding.ts` を作成
    - encodeJapaneseToNumber、decodeNumberToJapanese関数を実装
    - _Requirements: 1.2_
  - [ ]* 1.3 エンコーディングのプロパティテストを作成する
    - **Property 1: UTF-8エンコーディングのラウンドトリップ**
    - **Validates: Requirements 1.2**

- [ ] 2. Circom回路の開発
  - [ ] 2.1 LicensePlateHash回路を作成する
    - `pkgs/circuit/src/LicensePlateHash.circom` を作成
    - Poseidon(5)を使用して5入力のハッシュを計算
    - region, classification, hiragana, serial, saltを入力
    - _Requirements: 2.1, 2.2, 2.4_
  - [ ] 2.2 回路をコンパイルしてWASM/zkeyを生成する
    - `pnpm circuit compile` でコンパイル
    - Groth16用のzkey生成（Powers of Tau ceremony）
    - _Requirements: 2.1_
  - [ ]* 2.3 回路のユニットテストを作成する
    - circom_testerを使用
    - 正しいハッシュ出力の検証
    - _Requirements: 2.4_
  - [ ]* 2.4 回路のプロパティテストを作成する
    - **Property 5: 証明のパブリック出力とPoseidonハッシュの一致**
    - **Validates: Requirements 2.4**

- [ ] 3. チェックポイント - 回路の動作確認
  - 全てのテストが通ることを確認
  - 質問があればユーザーに確認

- [ ] 4. フロントエンド: License Plate Converter
  - [ ] 4.1 LicensePlateConverterを実装する
    - `pkgs/frontend/lib/wallet/license-plate-converter.ts` を作成
    - convertToZKInput関数を実装
    - スカラーフィールド範囲チェックを実装
    - _Requirements: 1.1, 1.3, 1.5_
  - [ ] 4.2 入力バリデーションを実装する
    - 地名、分類番号、ひらがな、一連番号の検証
    - エラーコードとメッセージの生成
    - _Requirements: 1.4_
  - [ ]* 4.3 Converterのプロパティテストを作成する
    - **Property 2: 変換の決定論性**
    - **Property 3: スカラーフィールド範囲の保証**
    - **Property 4: 無効入力のエラーハンドリング**
    - **Validates: Requirements 1.3, 1.4, 1.5**

- [ ] 5. フロントエンド: ZK Proof Generator
  - [ ] 5.1 ZKProofGeneratorクラスを実装する
    - `pkgs/frontend/lib/wallet/zk-proof-generator.ts` を作成
    - snarkjsを使用してGroth16証明を生成
    - WASM/zkeyの読み込み処理
    - _Requirements: 2.1, 2.3, 2.6_
  - [ ] 5.2 エラーハンドリングを実装する
    - タイムアウト処理（5秒）
    - WASM/zkey読み込みエラー
    - 証明生成エラー
    - _Requirements: 2.5_
  - [ ] 5.3 ローカル検証機能を実装する
    - verifyProofLocally関数を実装
    - 証明の事前検証
    - _Requirements: 2.1_
  - [ ]* 5.4 ProofGeneratorのプロパティテストを作成する
    - **Property 6: 証明からのプライベートデータ非漏洩**
    - **Validates: Requirements 2.2**

- [ ] 6. フロントエンド: Wallet Address Deriver
  - [ ] 6.1 WalletAddressDeriverクラスを実装する
    - `pkgs/frontend/lib/wallet/address-deriver.ts` を作成
    - CREATE2アドレス計算を実装
    - _Requirements: 3.1, 3.2, 3.4_
  - [ ] 6.2 アドレス形式検証を実装する
    - Ethereumアドレス形式の検証
    - エラーハンドリング
    - _Requirements: 3.3, 3.5_
  - [ ]* 6.3 AddressDeriverのプロパティテストを作成する
    - **Property 7: アドレス導出の決定論性**
    - **Property 8: Ethereumアドレス形式の妥当性**
    - **Property 9: CREATE2アドレス計算の正確性**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [ ] 7. チェックポイント - フロントエンド基盤の確認
  - 全てのテストが通ることを確認
  - 質問があればユーザーに確認

- [ ] 8. スマートコントラクト: Verifier
  - [ ] 8.1 LicensePlateVerifierコントラクトを生成する
    - snarkjsでverifier.solを生成
    - `pkgs/contract/contracts/LicensePlateVerifier.sol` に配置
    - イベント発行機能を追加
    - _Requirements: 4.1, 4.2, 4.3, 4.6_
  - [ ]* 8.2 Verifierのユニットテストを作成する
    - 有効な証明の検証テスト
    - 無効な証明の拒否テスト
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 8.3 Verifierのプロパティテストを作成する
    - **Property 10: 証明検証の正確性**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 9. スマートコントラクト: WalletRegistry
  - [ ] 9.1 WalletRegistryコントラクトを実装する
    - `pkgs/contract/contracts/WalletRegistry.sol` を作成
    - ハッシュ→ウォレットアドレスのマッピング
    - registerWallet、getWallet関数を実装
    - _Requirements: 5.1, 5.2, 7.3_
  - [ ] 9.2 レンタカー有効期限管理を実装する
    - rentalExpiryマッピング
    - isRentalValid、refreshRentalExpiry関数
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  - [ ]* 9.3 WalletRegistryのユニットテストを作成する
    - 登録・取得のテスト
    - レンタカー有効期限のテスト
    - _Requirements: 5.1, 5.2, 6.2, 6.3, 6.5_
  - [ ]* 9.4 WalletRegistryのプロパティテストを作成する
    - **Property 13: レンタカー有効期限の管理**
    - **Property 14: オンチェーンでのハッシュのみ保存**
    - **Validates: Requirements 6.2, 6.3, 6.5, 7.3**

- [ ] 10. スマートコントラクト: SmartAccountFactory
  - [ ] 10.1 SmartAccountFactoryコントラクトを実装する
    - `pkgs/contract/contracts/SmartAccountFactory.sol` を作成
    - ERC4337 EntryPointとの統合
    - createAccount、getAddress、computeAddress関数
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ] 10.2 SimpleAccountを実装する
    - `pkgs/contract/contracts/SimpleAccount.sol` を作成
    - ERC4337準拠のアカウント実装
    - _Requirements: 5.3_
  - [ ]* 10.3 SmartAccountFactoryのユニットテストを作成する
    - アカウント作成テスト
    - カウンターファクチュアルアドレステスト
    - _Requirements: 5.1, 5.2, 5.4_
  - [ ]* 10.4 SmartAccountFactoryのプロパティテストを作成する
    - **Property 11: カウンターファクチュアルアドレスの一致**
    - **Validates: Requirements 5.4**

- [ ] 11. チェックポイント - コントラクトの確認
  - 全てのテストが通ることを確認
  - 質問があればユーザーに確認

- [ ] 12. フロントエンド: レンタカー処理
  - [ ] 12.1 RentalPlateHandlerを実装する
    - `pkgs/frontend/lib/wallet/rental-handler.ts` を作成
    - isRentalPlate関数を実装
    - 有効期限チェック機能
    - _Requirements: 6.1, 6.3_
  - [ ]* 12.2 RentalPlateHandlerのプロパティテストを作成する
    - **Property 12: レンタカーナンバーの検出**
    - **Validates: Requirements 6.1**

- [ ] 13. フロントエンド: 統合コンポーネント
  - [ ] 13.1 WalletConversionServiceを実装する
    - `pkgs/frontend/lib/wallet/conversion-service.ts` を作成
    - 全コンポーネントを統合したサービスクラス
    - convertLicensePlateToWallet関数
    - _Requirements: 1.1, 2.1, 3.1, 5.1_
  - [ ] 13.2 Reactフックを実装する
    - `pkgs/frontend/hooks/useWalletConversion.ts` を作成
    - useWalletConversionフック
    - 状態管理とエラーハンドリング
    - _Requirements: 1.1, 2.1, 3.1_
  - [ ]* 13.3 統合テストを作成する
    - エンドツーエンドのフローテスト
    - エラーケースのテスト
    - _Requirements: 1.1-8.5_

- [ ] 14. コントラクトデプロイ
  - [ ] 14.1 デプロイスクリプトを作成する
    - `pkgs/contract/scripts/deploy-wallet-system.ts` を作成
    - LicensePlateVerifier、WalletRegistry、SmartAccountFactoryのデプロイ
    - _Requirements: 4.5_
  - [ ] 14.2 Base Sepoliaにデプロイする
    - テストネットへのデプロイ
    - コントラクトアドレスの記録
    - _Requirements: 4.5_

- [ ] 15. フロントエンド: UIコンポーネント
  - [ ] 15.1 WalletConversionUIコンポーネントを作成する
    - `pkgs/frontend/components/wallet/WalletConversion.tsx` を作成
    - ナンバープレート入力フォーム
    - 証明生成の進捗表示
    - _Requirements: 2.3_
  - [ ] 15.2 WalletInfoDisplayコンポーネントを作成する
    - `pkgs/frontend/components/wallet/WalletInfo.tsx` を作成
    - ウォレットアドレス表示
    - レンタカー有効期限表示
    - _Requirements: 6.6_
  - [ ]* 15.3 UIコンポーネントのユニットテストを作成する
    - レンダリングテスト
    - インタラクションテスト
    - _Requirements: 2.3, 6.6_

- [ ] 16. 最終チェックポイント
  - 全てのテストが通ることを確認
  - パフォーマンス要件の確認（証明生成5秒以内）
  - 質問があればユーザーに確認

## 注意事項

- `*` マークのタスクはオプションで、MVPを優先する場合はスキップ可能
- 各タスクは特定の要件を参照しており、トレーサビリティを確保
- プロパティテストは最低100回のイテレーションを実行
- チェックポイントでは必ずテストを実行して品質を確認
- Circom回路の開発には `circom-dev` SKILLを使用
- ERC4337関連の実装には `erc4337-privacy-wallet-dev` SKILLを使用
