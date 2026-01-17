# 要件定義書

## はじめに

本ドキュメントは、ナンバープレート連動ウォレットシステムにおける「車両価値トークン化機能」（車担保自動ローン）の要件を定義します。この機能は、車両の査定価値を担保として自動ローンを提供し、ウォレット残高不足時の自動借入と収益からの自動返済を実現するコア機能です。

## 用語集

- **Vehicle_Registry**: 車両情報（ナンバープレート、メーカー、車種、年式、走行距離）を登録・管理するコンポーネント
- **Appraisal_Service**: AI/外部APIを使用して車両の市場価値を査定するコンポーネント
- **Credit_Calculator**: 査定額から利用可能枠（査定額の75%）を計算するコンポーネント
- **Loan_Contract**: オンチェーンでローン契約を管理するスマートコントラクト
- **Auto_Borrow_Handler**: ウォレット残高不足時に自動借入を実行するコンポーネント
- **Auto_Repay_Handler**: 入金時に自動返済を実行するコンポーネント
- **Rental_Plate_Filter**: レンタカー・カーシェアナンバー（「わ」「れ」）を除外するコンポーネント
- **Notification_Service**: ローン状態変更時に通知を送信するコンポーネント
- **Vehicle_Data**: 車両の構造化データ（ナンバープレート、メーカー、車種、年式、走行距離）
- **Appraisal_Result**: 査定結果（査定額、査定日時、有効期限）
- **Credit_Limit**: 利用可能枠（査定額の75%）
- **Loan_Status**: ローン状態（借入額、返済額、残高、金利）

## 要件

### 要件 1: 車両情報の登録

**ユーザーストーリー:** ユーザーとして、自分の車両情報を登録したい。これにより、車両を担保としてローンを利用できるようになる。

#### 受け入れ基準

1. WHEN ユーザーが車両情報を入力する THEN Vehicle_Registry SHALL ナンバープレート、メーカー、車種、年式、走行距離を保存する
2. THE Vehicle_Registry SHALL ナンバープレートとウォレットアドレスの紐付けを検証する（wallet-address-conversion機能との連携）
3. WHEN 同一ナンバープレートが既に登録されている THEN Vehicle_Registry SHALL エラーを返し重複登録を防止する
4. THE Vehicle_Registry SHALL 車両情報をオンチェーンに記録する
5. WHEN 無効な車両情報が提供される THEN Vehicle_Registry SHALL 明確なエラーメッセージを返す

### 要件 2: レンタカー・カーシェアナンバーの除外

**ユーザーストーリー:** システムとして、レンタカー・カーシェアナンバー（「わ」「れ」）を担保ローンから除外したい。これにより、一時的な車両利用者による不正利用を防止できる。

#### 受け入れ基準

1. WHEN ナンバープレートのひらがなが「わ」または「れ」 THEN Rental_Plate_Filter SHALL 車両登録を拒否する
2. THE Rental_Plate_Filter SHALL 拒否理由を明確に通知する（「レンタカー・カーシェア車両は担保ローンの対象外です」）
3. THE Rental_Plate_Filter SHALL 登録処理の最初のステップで判定を行う

### 要件 3: 車両査定

**ユーザーストーリー:** ユーザーとして、自分の車両の市場価値を査定してもらいたい。これにより、利用可能なローン枠を知ることができる。

#### 受け入れ基準

1. WHEN 車両情報が登録される THEN Appraisal_Service SHALL AI/外部APIを使用して市場価値を査定する
2. THE Appraisal_Service SHALL 査定額、査定日時、有効期限（30日）を含むAppraisal_Resultを生成する
3. WHEN 査定に失敗する THEN Appraisal_Service SHALL エラーコードと詳細メッセージを返す
4. THE Appraisal_Service SHALL 査定結果をオンチェーンに記録する
5. WHEN 査定有効期限が切れる THEN Appraisal_Service SHALL 再査定を要求する

### 要件 4: 利用可能枠の計算

**ユーザーストーリー:** システムとして、査定額から利用可能枠を計算したい。これにより、ユーザーに適切な借入限度額を提供できる。

#### 受け入れ基準

1. WHEN Appraisal_Resultが提供される THEN Credit_Calculator SHALL 査定額の75%を利用可能枠として計算する
2. THE Credit_Calculator SHALL 利用可能枠を整数（wei単位）で返す
3. THE Credit_Calculator SHALL 既存の借入残高を考慮して実際に借入可能な額を計算する
4. WHEN 査定額が0または無効 THEN Credit_Calculator SHALL エラーを返す

### 要件 5: ローン契約の作成

**ユーザーストーリー:** ユーザーとして、車両を担保としたローン契約を作成したい。これにより、必要な時に資金を借りることができる。

#### 受け入れ基準

1. WHEN 車両登録と査定が完了する THEN Loan_Contract SHALL オンチェーンでローン契約を作成する
2. THE Loan_Contract SHALL 利用可能枠、金利（年率3-5%）、管理手数料（月額500円相当）を記録する
3. THE Loan_Contract SHALL 契約作成イベントを発行する
4. THE Loan_Contract SHALL ERC4337 SmartAccountと連携する
5. WHEN 契約作成に失敗する THEN Loan_Contract SHALL エラーコードと詳細メッセージを返す

### 要件 6: 自動借入

**ユーザーストーリー:** ユーザーとして、ウォレット残高が不足した時に自動的に借入したい。これにより、支払いが滞ることなくスムーズに取引できる。

#### 受け入れ基準

1. WHEN ウォレット残高が支払い額より少ない THEN Auto_Borrow_Handler SHALL 不足分を自動的に借入する
2. THE Auto_Borrow_Handler SHALL 借入額が利用可能枠を超えないことを検証する
3. IF 借入額が利用可能枠を超える THEN Auto_Borrow_Handler SHALL 取引を拒否しエラーを返す
4. THE Auto_Borrow_Handler SHALL 借入イベントを発行する
5. THE Auto_Borrow_Handler SHALL 借入後の残高と借入額をリアルタイムで更新する
6. WHEN 自動借入が実行される THEN Notification_Service SHALL ユーザーに通知する

### 要件 7: 自動返済

**ユーザーストーリー:** ユーザーとして、収益が入金された時に自動的に返済したい。これにより、返済忘れを防ぎ、利息を最小化できる。

#### 受け入れ基準

1. WHEN ウォレットに入金がある THEN Auto_Repay_Handler SHALL 借入残高がある場合に自動返済を実行する
2. THE Auto_Repay_Handler SHALL 入金額の一定割合（設定可能、デフォルト50%）を返済に充てる
3. THE Auto_Repay_Handler SHALL 返済イベントを発行する
4. THE Auto_Repay_Handler SHALL 返済後の残高と借入残高をリアルタイムで更新する
5. WHEN 借入残高が0になる THEN Auto_Repay_Handler SHALL 完済通知を送信する
6. THE Auto_Repay_Handler SHALL データ収益、投げ銭受取、その他の入金を返済対象とする

### 要件 8: 金利と手数料の計算

**ユーザーストーリー:** システムとして、正確な金利と手数料を計算したい。これにより、透明性のある料金体系を提供できる。

#### 受け入れ基準

1. THE Loan_Contract SHALL 年率3-5%の金利を日割りで計算する
2. THE Loan_Contract SHALL 月額500円相当の管理手数料を計算する
3. THE Loan_Contract SHALL 金利と手数料を借入残高に加算する
4. THE Loan_Contract SHALL 金利計算の詳細をユーザーに表示する
5. WHEN 金利が加算される THEN Loan_Contract SHALL 金利加算イベントを発行する

### 要件 9: リアルタイム残高・ローン状態表示

**ユーザーストーリー:** ユーザーとして、現在の残高とローン状態をリアルタイムで確認したい。これにより、財務状況を把握できる。

#### 受け入れ基準

1. THE システム SHALL ウォレット残高、借入残高、利用可能枠、返済予定額をリアルタイムで表示する
2. THE システム SHALL 査定額と査定有効期限を表示する
3. THE システム SHALL 金利と手数料の内訳を表示する
4. WHEN 状態が変更される THEN システム SHALL 表示を即座に更新する

### 要件 10: 通知機能

**ユーザーストーリー:** ユーザーとして、ローン状態の変更を通知で受け取りたい。これにより、重要な変更を見逃さない。

#### 受け入れ基準

1. WHEN 自動借入が実行される THEN Notification_Service SHALL プッシュ通知を送信する
2. WHEN 自動返済が実行される THEN Notification_Service SHALL プッシュ通知を送信する
3. WHEN 査定有効期限が近づく（残り7日） THEN Notification_Service SHALL 再査定を促す通知を送信する
4. WHEN 利用可能枠の80%以上を使用している THEN Notification_Service SHALL 警告通知を送信する
5. WHEN 完済する THEN Notification_Service SHALL 完済通知を送信する

### 要件 11: セキュリティとプライバシー

**ユーザーストーリー:** ユーザーとして、車両情報とローン情報が安全に保護されることを期待する。これにより、プライバシーを維持しながらサービスを利用できる。

#### 受け入れ基準

1. THE Vehicle_Registry SHALL 車両情報をハッシュ化してオンチェーンに保存する
2. THE Loan_Contract SHALL ローン情報を暗号化して保存する
3. THE システム SHALL 車両所有者のみがローン契約にアクセスできることを保証する
4. THE システム SHALL 不正な借入・返済操作を防止する

### 要件 12: パフォーマンス要件

**ユーザーストーリー:** システムとして、高速で効率的な処理を提供したい。これにより、ユーザー体験を向上させる。

#### 受け入れ基準

1. THE Appraisal_Service SHALL 査定処理を10秒以内に完了する
2. THE Auto_Borrow_Handler SHALL 自動借入を3秒以内に完了する
3. THE Auto_Repay_Handler SHALL 自動返済を3秒以内に完了する
4. THE システム SHALL 残高・ローン状態の更新を1秒以内に反映する
