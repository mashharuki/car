# プロジェクト構造

## ディレクトリ構成

```
/Users/harukikondo/git/car/
├── .kiro/                      # Kiro AI開発フレームワーク設定
│   ├── steering/              # プロジェクト全体のコンテキスト
│   │   ├── product.md         # プロダクト概要（2050行）
│   │   ├── tech.md            # 技術スタック
│   │   └── structure.md       # 構造ガイド
│   └── settings/              # 設定ファイル
├── pkgs/                      # モノレポパッケージ
│   ├── frontend/             # Next.js Webアプリ
│   ├── contract/             # Solidityスマートコントラクト
│   ├── circuit/              # Circom ZK証明回路
│   ├── mcp/                  # x402 MCPクライアント
│   ├── x402server/           # x402 決済サーバー
│   ├── molmo2_hack/          # Molmo2画像認識スクリプト
│   └── qwen-sample/          # Qwenマルチモーダルサンプル
├── laravel/                   # Laravel 11 APIサーバー
├── python/                    # Flask APIサーバー
│   ├── app/                  # Flaskアプリケーション
│   │   ├── models/           # データモデル
│   │   ├── routes/           # APIルート
│   │   └── services/         # ビジネスロジック
│   ├── tests/                # pytest テスト
│   ├── requirements.txt      # Python依存関係
│   └── run.py                # Flask起動スクリプト
├── www/                       # 静的ランディングページ
│   └── web/                  # HTML/CSS/JS
│       ├── index.html        # トップページ
│       ├── gate.html         # ゲート機能説明
│       ├── loan.html         # ローン機能説明
│       ├── kit.html          # キット機能説明
│       ├── faq.html          # FAQ
│       ├── contact.html      # お問い合わせ
│       ├── privacy.html      # プライバシーポリシー
│       ├── kiyaku.html       # 利用規約
│       ├── tokusho.html      # 特商法表記
│       └── img/              # 画像アセット
├── docs/                      # ドキュメント
│   ├── api-endpoints-summary.md  # APIエンドポイント設計書
│   └── openapi.yaml          # OpenAPI仕様書
├── AGENTS.md                  # AI開発ガイドライン
├── README.md                  # プロジェクト説明（369行）
├── biome.json                 # Biome設定（フォーマット・リント）
├── package.json               # ルートパッケージ設定
├── pnpm-lock.yaml             # 依存関係ロック
└── pnpm-workspace.yaml        # ワークスペース設定
```

## パッケージ詳細

### 1. Frontend（pkgs/frontend）
```
frontend/
├── app/                       # Next.js App Router
│   ├── globals.css           # グローバルスタイル
│   ├── layout.tsx            # ルートレイアウト
│   ├── page.tsx              # トップページ
│   └── manifest.ts           # PWAマニフェスト
├── components/               # Reactコンポーネント
│   └── BlurText.tsx
├── lib/                      # ユーティリティ
│   └── utils.ts
├── public/                   # 静的ファイル
│   └── manifest.json
├── components.json           # shadcn/ui設定
├── next.config.ts            # Next.js設定
├── tsconfig.json             # TypeScript設定
├── vitest.config.ts          # Vitest設定
└── package.json
```

**主要依存関係**:
- Next.js 16.1.3, React 19.2.3
- TailwindCSS 4, Motion 12.26.2
- @ducanh2912/next-pwa 10.2.9 (PWA対応)
- react-webcam 7.2.0
- Vitest (テストフレームワーク)

**エントリーポイント**: `app/page.tsx`

### 2. Contract（pkgs/contract）
```
contract/
├── contracts/                # Solidityソースコード
│   ├── LicensePlateAccountFactory.sol  # アカウントファクトリー
│   └── interface/
│       └── ILicensePlateAccountFactory.sol
├── ignition/                # Hardhat Ignitionデプロイ
│   ├── modules/
│   │   └── LicensePlateAccountFactory.ts
│   └── deployments/
│       └── chain-84532/     # Base Sepolia デプロイ履歴
├── test/                    # コントラクトテスト
│   └── LicensePlateAccountFactory.test.ts
├── tasks/                   # Hardhatカスタムタスク
│   ├── index.ts
│   └── utils/
│       ├── getBalance.ts
│       └── getChainInfo.ts
├── helpers/                 # ヘルパー関数
│   └── contractJsonHelper.ts
├── artifacts/               # コンパイル成果物
├── cache/                   # Hardhatキャッシュ
├── zk/                      # ZK証明用ファイル
│   └── LicensePlate_final.zkey
├── hardhat.config.ts        # Hardhat設定
└── package.json
```

**主要依存関係**:
- Hardhat 2.26.1, Viem, Ethers 6.13
- @account-abstraction/contracts 0.7.0 (ERC4337)
- OpenZeppelin 5.0.0
- Mocha, Chai (テスト)
- Solhint 5.0.4 (リンター)

**エントリーポイント**: `contracts/LicensePlateAccountFactory.sol`

### 3. Circuit（pkgs/circuit）
```
circuit/
├── src/                     # Circom回路ソース
│   └── LicensePlateCommitment.circom
├── scripts/                 # ビルド・実行スクリプト
│   ├── compile.sh          # 回路コンパイル
│   ├── generateInput.js    # 入力データ生成
│   ├── generateWitness.sh  # Witness生成
│   └── executeGroth16.sh   # 証明生成・検証
├── test/                    # 回路テスト
│   └── verify.test.js
├── data/                    # 入出力データ
│   ├── input.json          # 入力
│   ├── proof.json          # 証明
│   ├── public.json         # 公開入力
│   └── calldata.json       # コントラクト呼び出しデータ
├── zkey/                    # Proving/Verification keys
│   ├── LicensePlateCommitment_0000.zkey
│   ├── LicensePlateCommitment_final.zkey
│   └── verification_key.json
├── ptau/                    # Powers of Tau
│   └── powersOfTau28_hez_final_14.ptau
├── LicensePlateCommitment_js/    # WASM Witness生成
│   ├── generate_witness.js
│   └── witness_calculator.js
├── LicensePlateCommitment_cpp/   # C++ Witness生成
├── LicensePlateCommitment.r1cs   # コンパイル済み回路
├── LicensePlateCommitmentVerifier.sol  # 生成されたVerifier
└── package.json
```

**主要依存関係**:
- Circom, SnarkJS 0.6.9
- Circomlib 2.0.5, Circomlibjs 0.1.7
- Mocha, Chai (テスト)

**エントリーポイント**: `src/LicensePlateCommitment.circom`

### 4. MCP（pkgs/mcp）
```
mcp/
├── src/                     # TypeScriptソースコード
│   ├── index.ts            # MCPサーバーメインエントリー
│   ├── lambda-server.ts    # AWS Lambda実装
│   └── helpers.ts          # ヘルパー関数
├── bundle.js               # バンドルされたサーバー
├── esbuild.js              # esbuildビルド設定
├── run.sh                  # 実行スクリプト
├── eslint.config.js        # ESLint設定
├── tsconfig.json           # TypeScript設定
├── README.md               # セットアップドキュメント
└── package.json
```

**主要依存関係**:
- @modelcontextprotocol/sdk 1.9.0
- x402-axios (決済クライアント)
- Axios 1.8.4, Express 4.18.2
- @vendia/serverless-express 4.12.6 (Lambda対応)
- tsx (TypeScript実行)

**エントリーポイント**: `src/index.ts`

**機能**: 
- Model Context Protocol (MCP) サーバー実装
- x402決済プロトコルを使用した自動支払い機能
- Claude Desktop等のMCPクライアントとの統合
- リソースサーバーからの有料データ取得

### 5. x402server（pkgs/x402server）
```
x402server/
├── src/                    # TypeScriptソースコード
│   └── index.ts           # Honoサーバーメインエントリー
├── Dockerfile             # Docker設定
├── eslint.config.js       # ESLint設定
├── tsconfig.json          # TypeScript設定
├── vitest.config.ts       # Vitest設定
├── README.md              # デプロイドキュメント
└── package.json
```

**主要依存関係**:
- Hono 4.7.1
- x402-hono (決済ミドルウェア)
- @hono/node-server 1.13.8
- Vitest (テスト)

**エントリーポイント**: `src/index.ts`

**機能**:
- Honoフレームワークによる高速APIサーバー
- x402-hono決済ミドルウェアの実装
- ステーブルコイン（USDC）による有料APIエンドポイント
- Google Cloud Run対応のDocker化
- `/weather` エンドポイント（デモ用有料データ提供）

### 6. Laravel（laravel/）
```
laravel/
├── app/                    # アプリケーションコア
│   ├── Exceptions/        # カスタム例外
│   │   └── SesameApiException.php
│   ├── Http/
│   │   └── Controllers/   # APIコントローラー
│   ├── Models/            # Eloquentモデル
│   ├── Providers/         # サービスプロバイダー
│   └── Services/          # ビジネスロジック
├── config/                # 設定ファイル
├── database/
│   ├── migrations/        # データベースマイグレーション
│   ├── factories/         # モデルファクトリー
│   └── seeders/           # シーダー
├── routes/
│   ├── api.php           # API ルート
│   ├── web.php           # Web ルート
│   └── console.php       # コンソールルート
├── tests/
│   ├── Feature/          # 機能テスト
│   └── Unit/             # ユニットテスト
├── composer.json         # PHP依存関係
└── artisan               # Artisan CLI
```

**主要依存関係**:
- Laravel 11.31 (PHP 8.2)
- Composer (依存関係管理)
- PHPUnit 11.0 (テスト)
- Laravel Pint (フォーマッター)

### 7. Python（python/）
```
python/
├── app/                   # Flaskアプリケーション
│   ├── __init__.py
│   ├── models/           # データモデル
│   ├── routes/           # APIルート
│   └── services/         # ビジネスロジック
├── tests/                # pytestテスト
│   ├── __init__.py
│   ├── conftest.py
│   └── test_chat_api.py
├── requirements.txt      # Python依存関係
└── run.py                # Flask起動スクリプト
```

**主要依存関係**:
- Flask 3.0.0
- flask-cors 4.0.0
- httpx 0.27.0
- python-dotenv 1.0.0
- pytest 8.0.0 (テスト)

### 8. WWW（www/web）

静的HTMLランディングページ（TailwindCSS 3.4.16）
- index.html: トップページ（529行）
- gate.html, loan.html, kit.html: 機能説明ページ
- faq.html, contact.html: サポートページ
- privacy.html, kiyaku.html, tokusho.html: 法的ページ
- img/: 画像アセット

## 命名規則

### ファイル
- TypeScript/React: `PascalCase.tsx`, `camelCase.ts`
- Solidity: `PascalCase.sol`
- Circom: `PascalCase.circom`
- スクリプト: `camelCase.sh`, `camelCase.js`
- 設定ファイル: `kebab-case.json`

### コード
- **変数・関数**: `camelCase`
- **コンポーネント・クラス**: `PascalCase`
- **定数**: `UPPER_SNAKE_CASE`
- **インターフェース**: `IPascalCase`（Solidity）

### Git
- **ブランチ**: `feat/<feature-name>`, `fix/<bug-name>`
- **コミット**: コンベンショナルコミット形式
  - `feat:` 新機能
  - `fix:` バグ修正
  - `docs:` ドキュメント
  - `test:` テスト
  - `refactor:` リファクタリング
  - `chore:` その他

## インポート整理

Biomeによる自動整理が有効（`assist.actions.source.organizeImports: on`）

```typescript
// 外部ライブラリ
import { useState } from 'react'
import { createPublicClient } from 'viem'

// 内部モジュール
import { utils } from '@/lib/utils'
import Component from './Component'
```

## 設定ファイル

### Biome（プロジェクトルート）
- **パス**: `biome.json`
- **機能**: フォーマット、リント、インポート整理
- **対象**: TypeScript, JavaScript

### TypeScript
- **Frontend**: `pkgs/frontend/tsconfig.json`
- **Contract**: `pkgs/contract/tsconfig.json`
- **MCP**: `pkgs/mcp/tsconfig.json`
- **x402server**: `pkgs/x402server/tsconfig.json`

### Hardhat
- **パス**: `pkgs/contract/hardhat.config.ts`
- **ネットワーク**: Base Sepolia (Chain ID: 84532)
- **Solidity**: 0.8.28, viaIR有効

### Next.js
- **パス**: `pkgs/frontend/next.config.ts`
- **機能**: PWA対応、最適化設定

### Laravel
- **パス**: `laravel/config/`
- **フレームワーク**: Laravel 11

### Flask
- **パス**: `python/run.py`
- **フレームワーク**: Flask 3.0

## コード整理の原則

1. **パッケージ分離**: フロント/コントラクト/回路は独立
2. **相対パス優先**: 各パッケージ内で完結
3. **成果物の分離**: `artifacts/`, `cache/`, `*_js/`, `*_cpp/` は.gitignore対象
4. **型安全性**: TypeScript strict mode
5. **自動整形**: コミット前に `pnpm format`

## 依存関係の流れ

```
circuit (Circom)
  ↓ (コンパイル)
LicensePlateCommitmentVerifier.sol
  ↓ (コピー)
contract (Hardhat)
  ↓ (デプロイ)
Base Sepolia
  ↑ (検証・支払い)
frontend (Next.js) ←→ laravel (Laravel API) ←→ python (Flask AI API)
  ↑ (支払い要求)
x402server (Hono)
  ↑ (MCPプロトコル)
mcp (MCP Client)
  ↑ (Claude等のMCPクライアント)
```

## 重要な成果物

1. **ZK証明系**
   - `circuit/zkey/LicensePlateCommitment_final.zkey`: Proving key
   - `circuit/LicensePlateCommitment_js/*.wasm`: Witness生成器
   - `circuit/LicensePlateCommitmentVerifier.sol`: 検証コントラクト

2. **スマートコントラクト**
   - `contract/artifacts/`: コンパイル済みJSON
   - `contract/ignition/deployments/chain-84532/`: デプロイ履歴

3. **フロントエンド**
   - `frontend/.next/`: Next.jsビルド出力（未コミット）
   - `frontend/public/manifest.json`: PWAマニフェスト

4. **APIドキュメント**
   - `docs/api-endpoints-summary.md`: APIエンドポイント設計書（356行）
   - `docs/openapi.yaml`: OpenAPI仕様書

5. **ランディングページ**
   - `www/web/index.html`: 静的HTMLページ（TailwindCSS）
