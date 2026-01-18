# ギャップ分析補足: ZK証明回路とERC4337ウォレット統合

## エグゼクティブサマリー

### 重大な発見

ユーザー指摘の通り、**ナンバープレート認識からERC4337ウォレット生成までの中核機能が完全に未実装**です。

- ✅ **既存実装**: ナンバープレート画像認識（Qwen-VL）のみ
- ❌ **完全欠落**: ZK証明回路（Circom）+ ERC4337ウォレット作成機能
- ❌ **完全欠落**: プライバシー保護されたナンバープレート→ウォレットアドレス変換

### 分析結果

| カテゴリ | 状況 | 影響 |
|---------|------|------|
| **ZK回路** | 未実装（参照実装のみ存在） | 🔴 HIGH - コア機能不在 |
| **ERC4337コントラクト** | 未実装（SKILLアセットのみ） | 🔴 HIGH - ウォレット作成不可 |
| **ナンバープレート→ウォレット連携** | 未実装 | 🔴 HIGH - システム全体が機能しない |
| **プライバシー保護** | 未実装 | 🔴 HIGH - セキュリティ要件未達 |

---

## 1. 現状調査: ZK証明とERC4337実装

### 1.1 既存資産

#### A. 既存のZK回路（PasswordHash）

**場所**: `pkgs/circuit/src/PasswordHash.circom`

```circom
template PasswordCheck() {
  signal input password;
  signal input hash;
  component poseidon = Poseidon(1);
  poseidon.inputs[0] <== password;
  hash === poseidon.out;
}
component main {public [hash]} = PasswordCheck();
```

**評価**:
- ✅ Circom環境構築済み
- ✅ Poseidon hash使用（ZK-SNARK向け最適化ハッシュ関数）
- ✅ Groth16証明生成パイプライン存在
- ❌ **ナンバープレート検証用ではない**（パスワード検証用）
- ❌ ナンバープレート文字列処理なし

**再利用可能性**: 中程度（回路構造を参考に新規作成必要）

#### B. 既存のスマートコントラクト（PasswordHashVerifier）

**場所**: `pkgs/contract/contracts/PasswordHashVerifier.sol`

**評価**:
- ✅ Groth16検証ロジック実装済み
- ✅ Pairingライブラリ（楕円曲線演算）
- ❌ **ナンバープレート検証用ではない**
- ❌ ERC4337統合なし
- ❌ ウォレット生成機能なし

**再利用可能性**: 低（検証ロジックのみ参考）

#### C. ERC4337参照実装（SKILLアセット）

**場所**: `.claude/skills/erc4337-privacy-wallet-dev/assets/contracts/`

**含まれる実装**:
1. `PrivacyProtectedAccount.sol` - ERC4337準拠アカウント
   - Vehicle commitment（コミットメント）保存
   - BaseAccount継承（ERC4337標準）
   - Owner管理
   - EntryPoint統合
2. `AccountFactory.sol` - 決定論的アドレス生成
   - CREATE2によるアドレス生成
   - Proxy pattern（ERC1967）
3. `VehicleRegistry.sol` - 車両-ウォレットマッピング
   - Commitment登録
   - プライバシー保護検証

**評価**:
- ✅ **完全な参照実装が存在**
- ✅ プライバシー設計（commitmentベース）
- ✅ ERC4337標準準拠
- ❌ **プロジェクトコード(`pkgs/`)には未配置**
- ❌ ZK証明統合なし（コメントで言及のみ）
- ❌ デプロイスクリプトなし

**再利用可能性**: 🌟 **非常に高い（そのまま使える）**

### 1.2 完全に欠落している機能

#### ❌ A. ナンバープレート検証用ZK回路

**必要な回路**: `LicensePlateVerifier.circom`

```circom
// 必要なテンプレート（未実装）
template LicensePlateCommitment() {
  signal input plateNumber[8];  // ナンバープレート文字（最大8文字）
  signal input salt;             // ソルト
  signal output commitment;      // コミットメント

  component hash = Poseidon(9); // 8文字 + ソルト
  // ... ロジック
}

template LicensePlateOwnership() {
  signal input plateNumber[8];
  signal input salt;
  signal input publicCommitment;

  // コミットメント一致検証
  // ZK証明: プレート番号を知っているが公開しない
}
```

**ギャップ**:
- ❌ 回路定義ファイル
- ❌ 文字列→フィールド要素変換ロジック
- ❌ テストケース
- ❌ コンパイル・証明生成スクリプト

#### ❌ B. ZK検証器コントラクト

**必要なコントラクト**: `LicensePlateVerifier.sol`

```solidity
// 必要な検証器（未実装）
contract LicensePlateVerifier {
  function verifyProof(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint[1] memory input  // commitment
  ) public view returns (bool);
}
```

**ギャップ**:
- ❌ Circomからの自動生成されるべき検証器
- ❌ コントラクトデプロイスクリプト

#### ❌ C. ERC4337統合コントラクト

**必要なコントラクト群**:
1. `PrivacyProtectedAccount.sol` - アカウント本体
2. `AccountFactory.sol` - ファクトリ
3. `VehicleRegistry.sol` - レジストリ
4. `LicensePlateAccountFactory.sol` - ZK統合ファクトリ（新規）

**ギャップ**:
- ❌ **SKILLアセット → `pkgs/contract/contracts/` への移植**
- ❌ EntryPoint設定（Base Sepolia）
- ❌ デプロイスクリプト（Hardhat）
- ❌ テストスクリプト

#### ❌ D. フロントエンド統合

**必要な機能**:
1. ナンバープレート認識 → ZK証明生成
2. ウォレット作成トランザクション
3. ウォレットアドレス表示

**ギャップ**:
- ❌ ZK証明生成ライブラリ（snarkjs）統合
- ❌ ウォレット作成UI
- ❌ EntryPointとの連携（wagmi/viem）

#### ❌ E. バックエンド統合

**必要な機能**:
1. ナンバープレート → commitment計算
2. ZK証明生成
3. ウォレットアドレス予測

**ギャップ**:
- ❌ Python/Node.js ZK証明生成ロジック
- ❌ Commitment計算API
- ❌ ウォレット検索API

---

## 2. 要件とギャップのマッピング

### 2.1 要件定義からの抜粋（未カバー）

要件定義（`requirements.md`）には**ナンバープレート認識のみ**が記載されており、**ZK証明とウォレット生成は要件に含まれていません**。

**これは重大なギャップです。**

### 2.2 プロダクトビジョンとの照合

`steering/product.md`より:

> **ナンバープレート連動ウォレットシステム**
> 車のナンバープレートを識別子として、ブロックチェーンとAIカメラで実現

**必須機能**:
1. ✅ AIカメラがナンバープレートを撮影
2. ✅ Qwen-VLで画像認識・文字読み取り
3. ❌ **ナンバープレート → ウォレットアドレスを特定**（未実装）
4. ❌ **Baseブロックチェーンでトランザクション実行**（未実装）
5. ❌ **プライバシー保護（ゼロ知識証明）**（未実装）

### 2.3 技術スタックとの照合

`steering/tech.md`より:

**記載されている技術**:
- ✅ Circom 2.x, snarkjs（ZK回路）
- ✅ Base Sepolia（Ethereum L2）
- ✅ ERC4337 SmartAccount

**実装状況**:
- ❌ Circom: PasswordHash回路のみ（ナンバープレート用なし）
- ❌ Base: 接続設定なし
- ❌ ERC4337: SKILLアセットのみ、実装なし

---

## 3. 実装アプローチオプション

### オプションA: SKILLアセットを段階的に移植（推奨）

#### Phase 1: ERC4337コントラクト基盤（1週間）

**実装内容**:
1. SKILLアセットを`pkgs/contract/contracts/`へコピー
   - `PrivacyProtectedAccount.sol`
   - `AccountFactory.sol`
   - `VehicleRegistry.sol`
2. 依存関係インストール
   ```bash
   pnpm add @account-abstraction/contracts@^0.7.0
   ```
3. Hardhat設定更新（Base Sepolia）
4. デプロイスクリプト作成
5. テストスクリプト移植

**成果物**:
- Base Sepoliaにデプロイ済みコントラクト
- EntryPointアドレス確定
- 検証済みコントラクト（Basescan）

**リスク**: 低（既存実装そのまま）

#### Phase 2: ZK回路実装（1-2週間）

**実装内容**:
1. `LicensePlateCommitment.circom`作成
   ```circom
   pragma circom 2.0.0;
   include "../node_modules/circomlib/circuits/poseidon.circom";

   template LicensePlateCommitment() {
     signal input plateChars[8];  // UTF-8 → 数値変換済み
     signal input salt;
     signal output commitment;

     component hash = Poseidon(9);
     for (var i = 0; i < 8; i++) {
       hash.inputs[i] <== plateChars[i];
     }
     hash.inputs[8] <== salt;
     commitment <== hash.out;
   }

   component main = LicensePlateCommitment();
   ```

2. コンパイル・証明生成パイプライン
   ```bash
   circom LicensePlateCommitment.circom --r1cs --wasm --sym
   snarkjs groth16 setup ...
   snarkjs zkey export verificationkey
   ```

3. 検証器コントラクト生成
   ```bash
   snarkjs zkey export solidityverifier
   ```

4. テストケース作成

**成果物**:
- コンパイル済み回路
- 証明生成WASM
- `LicensePlateVerifier.sol`

**リスク**: 中（Circom実装経験必要）

#### Phase 3: 統合ファクトリ実装（3-5日）

**実装内容**:
1. `LicensePlateAccountFactory.sol`作成
   ```solidity
   contract LicensePlateAccountFactory is AccountFactory {
     LicensePlateVerifier public verifier;

     function createAccountWithProof(
       address owner,
       bytes32 vehicleCommitment,
       uint256 salt,
       uint[2] memory a,
       uint[2][2] memory b,
       uint[2] memory c
     ) public returns (PrivacyProtectedAccount) {
       // ZK証明検証
       require(
         verifier.verifyProof(a, b, c, [uint(vehicleCommitment)]),
         "Invalid proof"
       );

       // アカウント作成
       return createAccount(owner, vehicleCommitment, salt);
     }
   }
   ```

2. デプロイ・テスト

**成果物**:
- ZK証明統合されたファクトリ

**リスク**: 中（ZK証明検証ロジック）

#### Phase 4: フロントエンド統合（1週間）

**実装内容**:
1. snarkjs統合
   ```typescript
   import { groth16 } from 'snarkjs';

   async function generateProof(plateNumber: string, salt: string) {
     const input = {
       plateChars: plateToFieldElements(plateNumber),
       salt: BigInt(salt)
     };

     const { proof, publicSignals } = await groth16.fullProve(
       input,
       '/wasm/LicensePlateCommitment.wasm',
       '/zkey/LicensePlateCommitment_final.zkey'
     );

     return { proof, publicSignals };
   }
   ```

2. ウォレット作成UI
   ```typescript
   async function createVehicleWallet(
     plateNumber: string,
     ownerAddress: Address
   ) {
     const salt = generateRandomSalt();
     const { proof, publicSignals } = await generateProof(plateNumber, salt);

     const factory = getContract({
       address: FACTORY_ADDRESS,
       abi: AccountFactoryABI,
     });

     await factory.write.createAccountWithProof([
       ownerAddress,
       publicSignals[0], // commitment
       salt,
       proof.pi_a,
       proof.pi_b,
       proof.pi_c
     ]);
   }
   ```

3. ウォレットアドレス予測
4. ナンバープレート認識 → ウォレット作成フロー

**成果物**:
- エンドツーエンド動作デモ

**リスク**: 中（snarkjsのブラウザ互換性）

#### Phase 5: バックエンド統合（3-5日）

**実装内容**:
1. Python ZK証明生成API
   ```python
   from py_ecc import optimized_bn128 as bn128
   from hashlib import sha256

   @app.post("/papi/wallet/create-proof")
   async def create_proof(request: ProofRequest):
       # ナンバープレート → commitment計算
       commitment = calculate_commitment(
           request.plate_number,
           request.salt
       )

       # ZK証明生成（snarkjs CLI呼び出し）
       proof = generate_zk_proof(request.plate_number, request.salt)

       return {
           "commitment": commitment,
           "proof": proof,
           "publicSignals": [commitment]
       }
   ```

2. ウォレット検索API
3. Laravel統合（オプション）

**成果物**:
- バックエンドAPI完成

**リスク**: 低（標準的なAPI実装）

### オプションB: 最小限実装（ZKなし）

**内容**:
1. ERC4337コントラクトのみ実装（ZK証明スキップ）
2. ナンバープレート文字列を直接keccak256でハッシュ化
3. プライバシー保護なし

**トレードオフ**:
- ✅ 実装期間短縮（2週間 → 1週間）
- ❌ **プライバシー要件未達**（重大）
- ❌ ナンバープレートがチェーン上でトレース可能

**推奨度**: ❌ **非推奨**（プロダクトビジョンに反する）

### オプションC: 外部ZKサービス利用

**内容**:
1. zkPass等の既存ZKサービス利用
2. 回路実装を外部委託

**トレードオフ**:
- ✅ 実装期間短縮
- ❌ 外部依存
- ❌ コスト増
- ❌ カスタマイズ制約

**推奨度**: △ （検討可能だが自社実装推奨）

---

## 4. 実装複雑度とリスク

### 4.1 工数見積もり

| フェーズ | タスク | 工数 | 担当者要件 |
|---------|--------|------|-----------|
| Phase 1 | ERC4337コントラクト移植 | 5-7日 | Solidity開発者 |
| Phase 2 | ZK回路実装 | 10-14日 | Circom経験者 |
| Phase 3 | 統合ファクトリ | 3-5日 | Solidity + ZK知識 |
| Phase 4 | フロントエンド統合 | 5-7日 | TypeScript + ZK知識 |
| Phase 5 | バックエンド統合 | 3-5日 | Python/Node.js開発者 |
| **合計** | **26-38日** | **5-8週間** | フルスタック + ZK専門家 |

### 4.2 リスク評価

#### 🔴 高リスク

**1. ZK回路の正確性**
- **リスク**: 回路バグ → 検証失敗 or セキュリティ脆弱性
- **緩和策**:
  - `circom-dev` SKILLを使用した専門実装
  - プロパティベーステスト（fast-check）
  - 外部セキュリティ監査

**2. ERC4337 EntryPoint互換性**
- **リスク**: Base SepoliaのEntryPointバージョン不一致
- **緩和策**:
  - @account-abstraction/contracts最新版使用
  - Base公式ドキュメント確認
  - Testnetでの動作確認

**3. snarkjsブラウザパフォーマンス**
- **リスク**: ZK証明生成に時間がかかりすぎる（数十秒）
- **緩和策**:
  - Web Workerでバックグラウンド処理
  - プログレスバー表示
  - サーバーサイド証明生成オプション

#### 🟡 中リスク

**4. 文字列→フィールド要素変換**
- **リスク**: 日本語（UTF-8）→数値変換のロジックミス
- **緩和策**:
  - 標準的なエンコーディング使用（UTF-8バイト列）
  - テストケース網羅

**5. ガス代最適化**
- **リスク**: ZK検証のガス代が高すぎる
- **緩和策**:
  - Groth16使用（最もガス効率良い）
  - Base L2活用（低ガス代）

#### 🟢 低リスク

**6. SKILLアセット移植**
- **リスク**: 低（既存実装そのまま）
- **緩和策**: 不要

---

## 5. 推奨実装戦略

### 5.1 推奨アプローチ: **オプションA（段階的実装）**

**理由**:
1. ✅ プライバシー要件を満たす
2. ✅ プロダクトビジョンに沿う
3. ✅ 技術的挑戦が明確
4. ✅ 段階的な価値提供

### 5.2 実装順序

```
Week 1-2: Phase 1 (ERC4337基盤)
  ├─ SKILLアセット移植
  ├─ Hardhat設定
  ├─ Base Sepoliaデプロイ
  └─ テスト

Week 3-4: Phase 2 (ZK回路) ← circom-dev SKILL使用
  ├─ LicensePlateCommitment.circom
  ├─ コンパイル・セットアップ
  ├─ 検証器生成
  └─ テスト

Week 5: Phase 3 (統合ファクトリ)
  ├─ LicensePlateAccountFactory.sol
  ├─ ZK検証統合
  └─ デプロイ

Week 6-7: Phase 4 (フロントエンド)
  ├─ snarkjs統合
  ├─ ウォレット作成UI
  └─ エンドツーエンドテスト

Week 8: Phase 5 (バックエンド)
  ├─ ZK証明生成API
  ├─ ウォレット検索API
  └─ 統合テスト
```

### 5.3 SKILLの使用

#### `circom-dev` SKILL

**使用タイミング**: Phase 2（ZK回路実装）

**実行コマンド**:
```bash
# 回路設計・実装時
circom-dev SKILL を使って LicensePlateCommitment 回路を実装
```

**期待成果**:
- 正確な回路実装
- テストケース
- コンパイルスクリプト

#### `erc4337-privacy-wallet-dev` SKILL

**使用タイミング**: Phase 1, 3（コントラクト実装）

**実行コマンド**:
```bash
# コントラクト実装時
erc4337-privacy-wallet-dev SKILL を使ってナンバープレート用ウォレットを実装
```

**期待成果**:
- 最適化されたERC4337実装
- セキュリティベストプラクティス
- ガス効率化

---

## 6. 次のステップ

### 即時実行（現在）

1. ✅ ギャップ分析完了
2. ⏭️ **circom-dev SKILLでZK回路実装開始**
3. ⏭️ **erc4337-privacy-wallet-dev SKILLでコントラクト実装開始**

### 優先度付きタスク

#### P0（最優先）- 今すぐ実施
- [ ] SKILLアセットを`pkgs/contract/contracts/`へ移植
- [ ] `LicensePlateCommitment.circom`実装
- [ ] Base Sepolia設定

#### P1（高優先）- 今週中
- [ ] ZK回路コンパイル・テスト
- [ ] ERC4337コントラクトデプロイ
- [ ] 統合ファクトリ実装

#### P2（通常）- 来週
- [ ] フロントエンド統合
- [ ] バックエンドAPI

---

## 7. 成功基準

### Phase 1完了基準
- ✅ Base SepoliaにPrivacyProtectedAccount, AccountFactory, VehicleRegistryがデプロイ済み
- ✅ Basescanで検証済み
- ✅ Hardhatテスト全てパス

### Phase 2完了基準
- ✅ LicensePlateCommitment.circomがコンパイル成功
- ✅ テストデータで証明生成・検証成功
- ✅ LicensePlateVerifier.solデプロイ済み

### Phase 3完了基準
- ✅ LicensePlateAccountFactoryデプロイ済み
- ✅ ZK証明付きウォレット作成成功

### Phase 4完了基準
- ✅ ブラウザでZK証明生成成功
- ✅ ナンバープレート入力 → ウォレット作成 → アドレス表示まで動作

### Phase 5完了基準
- ✅ バックエンドAPI動作
- ✅ エンドツーエンドテスト成功

---

## 付録: 技術参照

### A. 参考実装
- [Circom Docs](https://docs.circom.io/)
- [snarkjs](https://github.com/iden3/snarkjs)
- [ERC-4337 Spec](https://eips.ethereum.org/EIPS/eip-4337)
- [Base Developer Docs](https://docs.base.org/)

### B. 既存アセットパス
```
.claude/skills/erc4337-privacy-wallet-dev/
  ├── assets/
  │   ├── contracts/
  │   │   ├── PrivacyProtectedAccount.sol  ← 移植対象
  │   │   ├── AccountFactory.sol           ← 移植対象
  │   │   └── VehicleRegistry.sol          ← 移植対象
  │   └── tests/
  │       ├── PrivacyProtectedAccount.test.ts
  │       └── AccountFactory.test.ts
  └── references/
      ├── erc4337-architecture.md
      └── privacy-patterns.md
```

---

**作成日**: 2026-01-18
**分析者**: Claude (Sonnet 4.5)
**ステータス**: 実装準備完了 - SKILLを使用した実装開始推奨
