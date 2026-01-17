# 要件定義書

## はじめに

本ドキュメントは、ナンバープレート連動ウォレットシステムにおける「ウォレットアドレス変換機能」の要件を定義します。この機能は、ゼロ知識証明（ZK）を使用してナンバープレート情報からウォレットアドレスを決定論的に導出し、プライバシーを保護しながらERC4337 SmartAccountを作成・取得するコア機能です。

## 用語集

- **License_Plate_Converter**: ナンバープレートデータをZKフレンドリーな入力形式に変換するコンポーネント
- **ZK_Proof_Generator**: Circom回路を使用してゼロ知識証明を生成するコンポーネント
- **Wallet_Address_Deriver**: ZK証明の出力から決定論的にウォレットアドレスを導出するコンポーネント
- **Proof_Verifier_Contract**: オンチェーンでZK証明を検証するSolidityコントラクト
- **SmartAccount_Factory**: ERC4337準拠のSmartAccountを作成・取得するコンポーネント
- **Rental_Plate_Handler**: レンタカー・カーシェアナンバー（「わ」「れ」）の特別処理を行うコンポーネント
- **License_Plate_Data**: 認識されたナンバープレートの構造化データ（地名、分類番号、ひらがな、一連番号）
- **ZK_Input**: ZK回路への入力データ（Poseidonハッシュ用にエンコードされた値）
- **ZK_Proof**: Groth16証明（π）とパブリック入力
- **Wallet_Address**: Ethereumアドレス形式のウォレット識別子

## 要件

### 要件 1: ナンバープレートデータのZK入力変換

**ユーザーストーリー:** システムとして、ナンバープレートデータをZK回路で処理可能な形式に変換したい。これにより、プライバシーを保護しながら決定論的なアドレス導出が可能になる。

#### 受け入れ基準

1. WHEN License_Plate_Dataが提供される THEN License_Plate_Converter SHALL 地名、分類番号、ひらがな、一連番号を数値にエンコードする
2. THE License_Plate_Converter SHALL 日本語文字（地名、ひらがな）をUTF-8バイト列として数値化する
3. THE License_Plate_Converter SHALL 同一のナンバープレートデータに対して常に同一のZK_Inputを生成する（決定論的）
4. WHEN 無効なナンバープレートデータが提供される THEN License_Plate_Converter SHALL 明確なエラーメッセージを返す
5. THE License_Plate_Converter SHALL ZK_Inputがsnark scalar field（約254ビット）の範囲内であることを保証する

### 要件 2: ZK証明の生成

**ユーザーストーリー:** ユーザーとして、ナンバープレート情報を明かさずにウォレットアドレスの所有権を証明したい。これにより、プライバシーを保護しながらシステムを利用できる。

#### 受け入れ基準

1. WHEN ZK_Inputが提供される THEN ZK_Proof_Generator SHALL Groth16証明を生成する
2. THE ZK_Proof_Generator SHALL ナンバープレート情報をプライベート入力として保持し、公開しない
3. THE ZK_Proof_Generator SHALL 証明生成を5秒以内に完了する
4. THE ZK_Proof_Generator SHALL 証明のパブリック出力としてナンバープレートのPoseidonハッシュを含める
5. WHEN 証明生成に失敗する THEN ZK_Proof_Generator SHALL エラーコードと詳細メッセージを返す
6. THE ZK_Proof_Generator SHALL ブラウザ環境（snarkjs）とNode.js環境の両方で動作する

### 要件 3: ウォレットアドレスの導出

**ユーザーストーリー:** システムとして、ZK証明の出力から決定論的にウォレットアドレスを導出したい。これにより、同じナンバープレートは常に同じウォレットアドレスに紐付けられる。

#### 受け入れ基準

1. WHEN ZK_Proofのパブリック出力が提供される THEN Wallet_Address_Deriver SHALL 決定論的にウォレットアドレスを導出する
2. THE Wallet_Address_Deriver SHALL 同一のパブリック出力に対して常に同一のウォレットアドレスを生成する
3. THE Wallet_Address_Deriver SHALL 有効なEthereumアドレス形式（0x + 40桁の16進数）を生成する
4. THE Wallet_Address_Deriver SHALL CREATE2オペコードを使用してアドレスを計算する（ERC4337互換）
5. WHEN 無効なパブリック出力が提供される THEN Wallet_Address_Deriver SHALL エラーを返す

### 要件 4: オンチェーン証明検証

**ユーザーストーリー:** システムとして、ZK証明をオンチェーンで検証したい。これにより、不正な証明によるウォレットアクセスを防止できる。

#### 受け入れ基準

1. WHEN ZK_Proofがコントラクトに送信される THEN Proof_Verifier_Contract SHALL 証明の有効性を検証する
2. IF 証明が有効 THEN Proof_Verifier_Contract SHALL trueを返す
3. IF 証明が無効 THEN Proof_Verifier_Contract SHALL falseを返す
4. THE Proof_Verifier_Contract SHALL 検証を300,000ガス以内で完了する
5. THE Proof_Verifier_Contract SHALL Base Sepoliaネットワークにデプロイ可能である
6. THE Proof_Verifier_Contract SHALL 検証結果をイベントとして発行する

### 要件 5: ERC4337 SmartAccountの作成・取得

**ユーザーストーリー:** ユーザーとして、導出されたアドレスに対応するSmartAccountを作成または取得したい。これにより、ガスレス取引やソーシャルリカバリーが可能になる。

#### 受け入れ基準

1. WHEN 新しいウォレットアドレスが導出される THEN SmartAccount_Factory SHALL 対応するSmartAccountを作成する
2. WHEN 既存のウォレットアドレスが導出される THEN SmartAccount_Factory SHALL 既存のSmartAccountを取得する
3. THE SmartAccount_Factory SHALL ERC4337規格に準拠したSmartAccountを作成する
4. THE SmartAccount_Factory SHALL SmartAccountのデプロイ前にアドレスを計算できる（counterfactual address）
5. WHEN SmartAccount作成に失敗する THEN SmartAccount_Factory SHALL エラーコードと詳細メッセージを返す
6. THE SmartAccount_Factory SHALL ガスレス取引（Paymaster経由）をサポートする

### 要件 6: レンタカー・カーシェアナンバーの特別処理

**ユーザーストーリー:** システムとして、レンタカー・カーシェアナンバー（「わ」「れ」）を特別に処理したい。これにより、一時的な車両利用者のセキュリティを確保できる。

#### 受け入れ基準

1. WHEN ナンバープレートのひらがなが「わ」または「れ」 THEN Rental_Plate_Handler SHALL レンタカーフラグを設定する
2. WHEN レンタカーナンバーが検出される THEN Rental_Plate_Handler SHALL 12時間の有効期限を設定する
3. WHEN レンタカーナンバーの有効期限が切れる THEN Rental_Plate_Handler SHALL 再検証を要求する
4. THE Rental_Plate_Handler SHALL 有効期限情報をオンチェーンに記録する
5. WHEN 再検証が成功する THEN Rental_Plate_Handler SHALL 有効期限を12時間延長する
6. THE Rental_Plate_Handler SHALL 有効期限切れ前に通知を送信する（残り1時間）

### 要件 7: セキュリティとプライバシー

**ユーザーストーリー:** ユーザーとして、ナンバープレート情報が安全に保護されることを期待する。これにより、プライバシーを維持しながらシステムを利用できる。

#### 受け入れ基準

1. THE ZK_Proof_Generator SHALL ナンバープレート情報をローカルでのみ処理し、外部に送信しない
2. THE License_Plate_Converter SHALL 変換後の入力データをメモリから安全に消去する
3. THE Proof_Verifier_Contract SHALL ナンバープレート情報を復元不可能な形式（ハッシュ）でのみ保存する
4. THE SmartAccount_Factory SHALL ウォレットアドレスとナンバープレートの直接的な紐付けを公開しない
5. WHEN 証明生成が完了する THEN ZK_Proof_Generator SHALL 中間計算データを消去する

### 要件 8: パフォーマンス要件

**ユーザーストーリー:** システムとして、高速で効率的な変換処理を提供したい。これにより、ユーザー体験を向上させる。

#### 受け入れ基準

1. THE License_Plate_Converter SHALL 変換処理を100ms以内に完了する
2. THE ZK_Proof_Generator SHALL 証明生成を5秒以内に完了する（ブラウザ環境）
3. THE Wallet_Address_Deriver SHALL アドレス導出を50ms以内に完了する
4. THE Proof_Verifier_Contract SHALL オンチェーン検証を1ブロック以内に完了する
5. THE SmartAccount_Factory SHALL アカウント作成を2ブロック以内に完了する

