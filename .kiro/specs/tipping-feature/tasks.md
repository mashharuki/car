# 実装計画: チップ機能（P2P投げ銭）

## 概要

本実装計画は、ナンバープレート認識とウォレットアドレス変換機能を統合し、x402決済プロトコルを使用したP2P投げ銭機能を実装します。フロントエンド（Next.js PWA）とバックエンド（Hono）の両方で実装を行います。

## タスク

- [ ] 1. 共通型定義とユーティリティの実装
  - [ ] 1.1 投げ銭関連の型定義を作成する
    - TipTransaction, TipHistory, TipError, RecipientInfo などの型を定義
    - pkgs/frontend/types/tipping.ts に作成
    - _Requirements: 8.3, 10.4_
  - [ ]* 1.2 型定義のプロパティテストを作成する
    - **Property 9: 履歴データ構造の完全性**
    - **Validates: Requirements 8.3, 8.4**
  - [ ] 1.3 ナンバープレートマスキングユーティリティを実装する
    - maskLicensePlate関数を実装
    - 一連番号を****でマスク
    - pkgs/frontend/lib/tipping/privacy.ts に作成
    - _Requirements: 5.6, 9.4_
  - [ ]* 1.4 マスキングのプロパティテストを作成する
    - **Property 5: 通知のプライバシーマスキング**
    - **Validates: Requirements 5.6**

- [ ] 2. 手数料計算機能の実装
  - [ ] 2.1 FeeCalculatorを実装する
    - 2%の手数料計算ロジック
    - 小数点以下切り上げ
    - 最小手数料¥1の適用
    - pkgs/x402server/src/lib/fee-calculator.ts に作成
    - _Requirements: 3.1, 3.2, 3.4_
  - [ ]* 2.2 手数料計算のプロパティテストを作成する
    - **Property 3: 手数料計算の正確性**
    - **Validates: Requirements 3.1, 3.2, 3.4**

- [ ] 3. チェックポイント - 基盤機能の確認
  - 全てのテストが通ることを確認し、問題があればユーザーに質問する

- [ ] 4. 金額選択UIコンポーネントの実装
  - [ ] 4.1 TipAmountSelectorコンポーネントを実装する
    - プリセット金額ボタン（¥100, ¥500, ¥1,000）
    - カスタム金額入力フィールド
    - 金額範囲検証（¥10〜¥100,000）
    - 手数料・合計額の表示
    - USDC相当額の表示
    - pkgs/frontend/components/tipping/TipAmountSelector.tsx に作成
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [ ]* 4.2 金額検証のプロパティテストを作成する
    - **Property 2: 金額範囲検証**
    - **Validates: Requirements 2.3**
  - [ ]* 4.3 TipAmountSelectorのユニットテストを作成する
    - プリセット金額選択のテスト
    - カスタム金額入力のテスト
    - エラー表示のテスト
    - _Requirements: 2.1, 2.2, 2.5_

- [ ] 5. 投げ銭サービスの実装
  - [ ] 5.1 TippingServiceクラスを実装する
    - ナンバープレート認識との統合
    - ウォレットアドレス変換との統合
    - 送金先情報の取得
    - pkgs/frontend/lib/tipping/tipping-service.ts に作成
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [ ]* 5.2 投げ銭フロー統合のプロパティテストを作成する
    - **Property 1: 投げ銭フロー統合**
    - **Validates: Requirements 1.1, 1.2, 1.3**
  - [ ] 5.3 レート制限機能を実装する
    - 1日あたりの送金上限（¥50,000）
    - 連続送金の間隔制限（30秒）
    - ローカルストレージでの状態管理
    - _Requirements: 9.2, 9.3_
  - [ ]* 5.4 レート制限のプロパティテストを作成する
    - **Property 10: レート制限の適用**
    - **Validates: Requirements 9.2, 9.3**

- [ ] 6. チェックポイント - フロントエンド基盤の確認
  - 全てのテストが通ることを確認し、問題があればユーザーに質問する

- [ ] 7. バックエンドAPIの実装
  - [ ] 7.1 Tipping APIエンドポイントを実装する
    - POST /api/tipping/send - 投げ銭送信
    - GET /api/tipping/history - 履歴取得
    - x402プロトコルとの統合
    - pkgs/x402server/src/routes/tipping.ts に作成
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  - [ ]* 7.2 トランザクション実行のプロパティテストを作成する
    - **Property 4: トランザクションハッシュの返却**
    - **Validates: Requirements 4.4**
  - [ ] 7.3 リトライ機能を実装する
    - 指数バックオフによるリトライ
    - 最大3回のリトライ
    - _Requirements: 10.6_
  - [ ]* 7.4 リトライメカニズムのプロパティテストを作成する
    - **Property 12: リトライメカニズム**
    - **Validates: Requirements 10.6**
  - [ ] 7.5 エラーハンドリングを実装する
    - エラーコード、メッセージ、推奨アクションの構造化
    - エラーログの記録
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [ ]* 7.6 エラーレスポンス構造のプロパティテストを作成する
    - **Property 11: エラーレスポンス構造**
    - **Validates: Requirements 10.4**

- [ ] 8. 通知サービスの実装
  - [ ] 8.1 NotificationServiceを実装する
    - PWAプッシュ通知の送信
    - 通知内容の構成（金額、マスクされたナンバープレート）
    - アプリ内通知のフォールバック
    - pkgs/x402server/src/lib/notification-service.ts に作成
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [ ]* 8.2 通知サービスのユニットテストを作成する
    - プッシュ通知送信のテスト
    - フォールバック動作のテスト
    - _Requirements: 5.1, 5.5_

- [ ] 9. チェックポイント - バックエンド機能の確認
  - 全てのテストが通ることを確認し、問題があればユーザーに質問する

- [ ] 10. 音声確認機能の実装
  - [ ] 10.1 VoiceConfirmationHandlerを実装する
    - Web Speech APIを使用した音声認識
    - 確認フレーズ（はい、送る、OK）の認識
    - キャンセルフレーズ（いいえ、キャンセル）の認識
    - 音声ガイダンスの再生
    - 10秒タイムアウト
    - pkgs/frontend/lib/tipping/voice-confirmation.ts に作成
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  - [ ]* 10.2 音声コマンド認識のプロパティテストを作成する
    - **Property 7: 音声コマンド認識**
    - **Validates: Requirements 7.3, 7.4**
  - [ ]* 10.3 音声タイムアウトのプロパティテストを作成する
    - **Property 8: 音声タイムアウト動作**
    - **Validates: Requirements 7.7, 7.8**

- [ ] 11. ハザードランプ検知機能の実装
  - [ ] 11.1 HazardLampDetectorを実装する
    - OBD-II接続管理
    - ハザードランプ点灯検知
    - 5秒以内の2回点灯でトリガー
    - ON/OFF設定
    - pkgs/frontend/lib/tipping/hazard-detector.ts に作成
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [ ]* 11.2 ハザードランプ検知のプロパティテストを作成する
    - **Property 6: ハザードランプ検知タイミング**
    - **Validates: Requirements 6.2, 6.3**

- [ ] 12. 履歴管理機能の実装
  - [ ] 12.1 履歴保存・取得機能を実装する
    - 送信履歴の保存
    - 受信履歴の保存
    - 暗号化ローカルストレージ
    - pkgs/frontend/lib/tipping/history-service.ts に作成
    - _Requirements: 8.1, 8.2, 8.5, 9.5_
  - [ ] 12.2 HistoryViewコンポーネントを実装する
    - 履歴一覧表示
    - フィルタリング（送信/受信、期間）
    - ブロックエクスプローラーへのリンク
    - pkgs/frontend/components/tipping/HistoryView.tsx に作成
    - _Requirements: 8.4, 8.5, 8.6_

- [ ] 13. チェックポイント - 補助機能の確認
  - 全てのテストが通ることを確認し、問題があればユーザーに質問する

- [ ] 14. メインUIの実装
  - [ ] 14.1 TippingPageを実装する
    - カメラキャプチャ統合
    - 送金先表示
    - 金額選択
    - 確認・送信フロー
    - pkgs/frontend/app/tipping/page.tsx に作成
    - _Requirements: 1.3, 2.1, 9.1_
  - [ ] 14.2 TippingConfirmationDialogを実装する
    - 送金確認ダイアログ
    - 音声確認モード切り替え
    - pkgs/frontend/components/tipping/TippingConfirmationDialog.tsx に作成
    - _Requirements: 9.1_
  - [ ] 14.3 TipSuccessViewを実装する
    - 送金成功画面
    - トランザクション詳細表示
    - pkgs/frontend/components/tipping/TipSuccessView.tsx に作成
    - _Requirements: 4.5_

- [ ] 15. 統合とワイヤリング
  - [ ] 15.1 全コンポーネントを統合する
    - TippingServiceとUIコンポーネントの接続
    - バックエンドAPIとの接続
    - 通知サービスとの接続
    - _Requirements: 1.1, 1.2, 4.1, 5.1_
  - [ ] 15.2 セキュリティ機能を統合する
    - 送金前確認の強制
    - 不審パターン検出
    - _Requirements: 9.1, 9.6_

- [ ] 16. 最終チェックポイント - 全機能の確認
  - 全てのテストが通ることを確認し、問題があればユーザーに質問する

## 備考

- `*` マークのタスクはオプションで、MVPでは省略可能
- 各タスクは特定の要件を参照しており、トレーサビリティを確保
- プロパティテストは設計書の正確性プロパティを検証
- チェックポイントでは増分検証を実施
