# 実装計画: 車両価値トークン化機能（車担保自動ローン）

## 概要

本実装計画は、車両価値トークン化機能を段階的に実装するためのタスクリストです。フロントエンドの型定義から始め、スマートコントラクト、バックエンドAPI、UIコンポーネントまでを網羅します。

## API仕様書

`docs/openapi.yaml`にOpenAPI仕様に準拠したyamlファイルが格納されているのでそちらを参照しながら実装すること

## タスク

- [ ]   1. 共通型定義とユーティリティの作成
    - [ ] 1.1 車両・ローン関連の型定義を作成する
        - `pkgs/frontend/types/loan.ts` を作成
        - VehicleData、AppraisalResult、LoanStatus、CreditInfo等の型を定義
        - _Requirements: 1.1, 3.2, 4.1_
    - [ ] 1.2 レンタカー判定ユーティリティを実装する
        - `pkgs/frontend/lib/loan/rental-filter.ts` を作成
        - isRentalPlate関数を実装（「わ」「れ」の判定）
        - _Requirements: 2.1_
    - [ ]\* 1.3 レンタカー判定のプロパティテストを作成する
        - **Property 1: レンタカーナンバーの検出と除外**
        - **Validates: Requirements 2.1**

- [ ]   2. 利用可能枠計算ユーティリティの作成
    - [ ] 2.1 CreditCalculatorを実装する
        - `pkgs/frontend/lib/loan/credit-calculator.ts` を作成
        - calculateCreditLimit関数（査定額の75%）を実装
        - calculateAvailableCredit関数を実装
        - _Requirements: 4.1, 4.2, 4.3_
    - [ ]\* 2.2 CreditCalculatorのプロパティテストを作成する
        - **Property 3: 利用可能枠の計算正確性**
        - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ]   3. 金利計算ユーティリティの作成
    - [ ] 3.1 InterestCalculatorを実装する
        - `pkgs/frontend/lib/loan/interest-calculator.ts` を作成
        - calculateAccruedInterest関数（日割り金利計算）を実装
        - calculateMonthlyFee関数を実装
        - _Requirements: 8.1, 8.2_
    - [ ]\* 3.2 InterestCalculatorのプロパティテストを作成する
        - **Property 6: 金利計算の正確性**
        - **Validates: Requirements 8.1, 8.3**

- [ ]   4. チェックポイント - フロントエンドユーティリティの確認
    - 全てのテストが通ることを確認
    - 質問があればユーザーに確認

- [ ]   5. スマートコントラクト: VehicleRegistry
    - [ ] 5.1 VehicleRegistryコントラクトを実装する
        - `pkgs/contract/contracts/loan/VehicleRegistry.sol` を作成
        - 車両登録、査定記録、重複チェック機能を実装
        - イベント発行機能を追加
        - _Requirements: 1.1, 1.3, 1.4, 3.4_
    - [ ]\* 5.2 VehicleRegistryのユニットテストを作成する
        - 登録・取得のテスト
        - 重複登録拒否のテスト
        - _Requirements: 1.3, 1.4_
    - [ ]\* 5.3 VehicleRegistryのプロパティテストを作成する
        - **Property 2: 車両登録の重複防止**
        - **Property 9: 車両情報のハッシュ化保存**
        - **Validates: Requirements 1.3, 11.1**

- [ ]   6. スマートコントラクト: VehicleLoanContract
    - [ ] 6.1 VehicleLoanContractコントラクトを実装する
        - `pkgs/contract/contracts/loan/VehicleLoanContract.sol` を作成
        - ローン作成、借入、返済、金利計算機能を実装
        - イベント発行機能を追加
        - _Requirements: 5.1, 5.2, 5.3, 6.1, 7.1, 8.1, 8.3_
    - [ ]\* 6.2 VehicleLoanContractのユニットテストを作成する
        - ローン作成テスト
        - 借入・返済テスト
        - 金利計算テスト
        - _Requirements: 5.1, 6.1, 7.1, 8.1_
    - [ ]\* 6.3 VehicleLoanContractのプロパティテストを作成する
        - **Property 4: 自動借入の正確性**
        - **Property 5: 自動返済の正確性**
        - **Property 8: ローン状態の一貫性**
        - **Validates: Requirements 6.1, 6.2, 6.3, 6.5, 7.1, 7.2, 7.4**

- [ ]   7. スマートコントラクト: AutoBorrowModule
    - [ ] 7.1 AutoBorrowModuleコントラクトを実装する
        - `pkgs/contract/contracts/loan/AutoBorrowModule.sol` を作成
        - 残高不足時の自動借入ロジックを実装
        - SmartAccountとの連携を実装
        - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
    - [ ]\* 7.2 AutoBorrowModuleのユニットテストを作成する
        - 自動借入トリガーテスト
        - 利用可能枠超過時の拒否テスト
        - _Requirements: 6.1, 6.2, 6.3_

- [ ]   8. スマートコントラクト: AutoRepayModule
    - [ ] 8.1 AutoRepayModuleコントラクトを実装する
        - `pkgs/contract/contracts/loan/AutoRepayModule.sol` を作成
        - 入金時の自動返済ロジックを実装
        - 返済割合の設定機能を実装
        - _Requirements: 7.1, 7.2, 7.3, 7.4_
    - [ ]\* 8.2 AutoRepayModuleのユニットテストを作成する
        - 自動返済トリガーテスト
        - 返済割合計算テスト
        - _Requirements: 7.1, 7.2_

- [ ]   9. チェックポイント - スマートコントラクトの確認
    - 全てのテストが通ることを確認
    - 質問があればユーザーに確認

- [ ]   10. スマートコントラクト: アクセス制御
    - [ ] 10.1 アクセス制御機能を追加する
        - VehicleLoanContractにオーナーチェックを追加
        - 不正操作の防止機能を実装
        - _Requirements: 11.3, 11.4_
    - [ ]\* 10.2 アクセス制御のプロパティテストを作成する
        - **Property 10: アクセス制御の正確性**
        - **Validates: Requirements 11.3, 11.4**

- [ ]   11. コントラクトデプロイ
    - [ ] 11.1 デプロイスクリプトを作成する
        - `pkgs/contract/scripts/deploy-loan-system.ts` を作成
        - VehicleRegistry、VehicleLoanContract、AutoBorrowModule、AutoRepayModuleのデプロイ
        - _Requirements: 5.1_
    - [ ] 11.2 Base Sepoliaにデプロイする
        - テストネットへのデプロイ
        - コントラクトアドレスの記録
        - _Requirements: 5.1_

- [ ]   12. バックエンドAPI: Vehicle API
    - [ ] 12.1 Vehicle APIを実装する
        - `pkgs/x402server/src/routes/vehicle.ts` を作成
        - POST /api/vehicle/register エンドポイント
        - GET /api/vehicle/:vehicleId エンドポイント
        - POST /api/vehicle/:vehicleId/reappraise エンドポイント
        - _Requirements: 1.1, 3.1, 3.5_
    - [ ]\* 12.2 Vehicle APIのユニットテストを作成する
        - 登録APIテスト
        - 再査定APIテスト
        - _Requirements: 1.1, 3.1_

- [ ]   13. バックエンドAPI: Loan API
    - [ ] 13.1 Loan APIを実装する
        - `pkgs/x402server/src/routes/loan.ts` を作成
        - GET /api/loan/:walletAddress エンドポイント
        - GET /api/loan/:walletAddress/history エンドポイント
        - POST /api/loan/:walletAddress/settings エンドポイント
        - _Requirements: 9.1, 9.2, 9.3_
    - [ ]\* 13.2 Loan APIのユニットテストを作成する
        - ローン状態取得テスト
        - 履歴取得テスト
        - _Requirements: 9.1_

- [ ]   14. バックエンドAPI: 査定サービス連携
    - [ ] 14.1 AppraisalServiceを実装する
        - `pkgs/x402server/src/services/appraisal.ts` を作成
        - 外部査定API/AIとの連携
        - 査定結果のキャッシュ
        - _Requirements: 3.1, 3.2, 3.3_
    - [ ]\* 14.2 AppraisalServiceのユニットテストを作成する
        - 査定リクエストテスト
        - エラーハンドリングテスト
        - _Requirements: 3.1, 3.3_
    - [ ]\* 14.3 査定有効期限のプロパティテストを作成する
        - **Property 7: 査定有効期限の管理**
        - **Validates: Requirements 3.2, 3.5**

- [ ]   15. チェックポイント - バックエンドAPIの確認
    - 全てのテストが通ることを確認
    - 質問があればユーザーに確認

- [ ]   16. フロントエンド: 車両登録サービス
    - [ ] 16.1 VehicleRegistrationServiceを実装する
        - `pkgs/frontend/lib/loan/vehicle-registration.ts` を作成
        - registerVehicle関数を実装
        - レンタカー判定、重複チェック、査定連携
        - _Requirements: 1.1, 1.2, 2.1, 3.1_
    - [ ]\* 16.2 VehicleRegistrationServiceのユニットテストを作成する
        - 登録フローテスト
        - エラーハンドリングテスト
        - _Requirements: 1.1, 1.5, 2.1_

- [ ]   17. フロントエンド: ローンダッシュボードサービス
    - [ ] 17.1 LoanDashboardServiceを実装する
        - `pkgs/frontend/lib/loan/loan-dashboard.ts` を作成
        - getLoanStatus、getLoanHistory関数を実装
        - リアルタイム更新のサブスクリプション
        - _Requirements: 9.1, 9.2, 9.3, 9.4_
    - [ ]\* 17.2 LoanDashboardServiceのユニットテストを作成する
        - 状態取得テスト
        - 履歴取得テスト
        - _Requirements: 9.1_

- [ ]   18. フロントエンド: Reactフック
    - [ ] 18.1 useVehicleRegistrationフックを実装する
        - `pkgs/frontend/hooks/useVehicleRegistration.ts` を作成
        - 車両登録の状態管理
        - _Requirements: 1.1_
    - [ ] 18.2 useLoanStatusフックを実装する
        - `pkgs/frontend/hooks/useLoanStatus.ts` を作成
        - ローン状態のリアルタイム取得
        - _Requirements: 9.1, 9.4_
    - [ ] 18.3 useAutoBorrowフックを実装する
        - `pkgs/frontend/hooks/useAutoBorrow.ts` を作成
        - 自動借入の状態管理
        - _Requirements: 6.1, 6.5_

- [ ]   19. フロントエンド: UIコンポーネント
    - [ ] 19.1 VehicleRegistrationFormコンポーネントを作成する
        - `pkgs/frontend/components/loan/VehicleRegistrationForm.tsx` を作成
        - 車両情報入力フォーム
        - バリデーション表示
        - _Requirements: 1.1, 1.5, 2.2_
    - [ ] 19.2 AppraisalDisplayコンポーネントを作成する
        - `pkgs/frontend/components/loan/AppraisalDisplay.tsx` を作成
        - 査定結果表示
        - 有効期限表示
        - _Requirements: 3.2, 9.2_
    - [ ] 19.3 LoanDashboardコンポーネントを作成する
        - `pkgs/frontend/components/loan/LoanDashboard.tsx` を作成
        - 残高、借入残高、利用可能枠の表示
        - 金利・手数料の内訳表示
        - _Requirements: 9.1, 9.2, 9.3_
    - [ ] 19.4 LoanHistoryコンポーネントを作成する
        - `pkgs/frontend/components/loan/LoanHistory.tsx` を作成
        - 借入・返済履歴の表示
        - _Requirements: 9.1_
    - [ ]\* 19.5 UIコンポーネントのユニットテストを作成する
        - レンダリングテスト
        - インタラクションテスト
        - _Requirements: 9.1_

- [ ]   20. フロントエンド: 通知機能
    - [ ] 20.1 NotificationServiceを実装する
        - `pkgs/frontend/lib/loan/notification-service.ts` を作成
        - プッシュ通知の送信
        - 通知設定の管理
        - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
    - [ ] 20.2 NotificationCenterコンポーネントを作成する
        - `pkgs/frontend/components/loan/NotificationCenter.tsx` を作成
        - 通知一覧表示
        - 通知設定UI
        - _Requirements: 10.1_

- [ ]   21. チェックポイント - フロントエンドの確認
    - 全てのテストが通ることを確認
    - 質問があればユーザーに確認

- [ ]   22. 統合とページ作成
    - [ ] 22.1 車両登録ページを作成する
        - `pkgs/frontend/app/loan/register/page.tsx` を作成
        - 車両登録フローの統合
        - _Requirements: 1.1_
    - [ ] 22.2 ローンダッシュボードページを作成する
        - `pkgs/frontend/app/loan/dashboard/page.tsx` を作成
        - ローン状態の統合表示
        - _Requirements: 9.1_
    - [ ]\* 22.3 統合テストを作成する
        - エンドツーエンドのフローテスト
        - _Requirements: 1.1-12.4_

- [ ]   23. 最終チェックポイント
    - 全てのテストが通ることを確認
    - パフォーマンス要件の確認（査定10秒以内、借入/返済3秒以内）
    - 質問があればユーザーに確認

## 注意事項

- `*` マークのタスクはオプションで、MVPを優先する場合はスキップ可能
- 各タスクは特定の要件を参照しており、トレーサビリティを確保
- プロパティテストは最低100回のイテレーションを実行
- チェックポイントでは必ずテストを実行して品質を確認
- ERC4337関連の実装には `erc4337-privacy-wallet-dev` SKILLを使用
- React/Next.js実装には `vercel-react-best-practices` SKILLを使用
- UI設計には `apple-style-ui-designer` Sub Agentを使用
