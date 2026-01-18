# 技術スタック

## 全体アーキテクチャ
pnpm workspace (v10.20.0) を使ったモノレポ構成。フロントエンド、コントラクト、ZK回路、バックエンドAPI（Laravel・Flask）を独立パッケージとして分離。

## 言語
- **TypeScript**: メイン言語（フロントエンド、API、MCP）
- **Solidity**: スマートコントラクト
- **Circom**: ZK証明回路
- **PHP 8.2**: Laravel APIサーバー
- **Python 3.x**: Flask AIサーバー
- **HTML/CSS/JavaScript**: ランディングページ（www/web）

## フロントエンド（pkgs/frontend）

### フレームワーク・ライブラリ
- **Next.js 16.1.3**: React フレームワーク（App Router）
- **React 19.2.3**: UI ライブラリ
- **TypeScript 5**: 型安全性
- **TailwindCSS 4**: スタイリング
- **Shadcn/ui**: UIコンポーネント
- **Motion (Framer Motion) 12.26.2**: アニメーション
- **PWA対応**: @ducanh2912/next-pwa 10.2.9
- **react-webcam 7.2.0**: Webカメラ統合

### 開発ツール
- ESLint 9（flat config）
- Vitest: テストフレームワーク
- Sharp: 画像処理

## バックエンド

### Laravel API サーバー（laravel/）
- **Laravel 11.31**: PHPフレームワーク
- **PHP 8.2**: サーバーサイド言語
- **Composer**: 依存関係管理
- **PHPUnit 11.0.1**: テストフレームワーク
- **Laravel Pint 1.13**: コードフォーマッター
- **Laravel Sail 1.26**: Docker開発環境

**主な役割**:
- 認証・ユーザー管理
- ナンバープレート・ウォレット管理（CRUD）
- 車両価値トークン化・ローン機能
- 通知機能
- トランザクション履歴管理

### Flask AI サーバー（python/）
- **Flask 3.0.0**: Python Webフレームワーク
- **flask-cors 4.0.0**: CORS対応
- **httpx 0.27.0**: 非同期HTTPクライアント
- **python-dotenv 1.0.0**: 環境変数管理
- **pytest 8.0.0**: テストフレームワーク

**主な役割**:
- AI推論（Qwen-VL）
- ナンバープレート画像認識
- 画像品質検証
- 車両査定（AI/外部API統合）

### MCP/x402 決済サーバー（pkgs/mcp, pkgs/x402server）
- **Model Context Protocol (MCP) SDK 1.9.0**: Claude等のAIとの統合
- **Hono 4.7.1**: 高速軽量Webフレームワーク
- **x402-axios/x402-hono**: x402決済プロトコル実装
- **Axios 1.8.4**: HTTPクライアント
- **Express 4.18.2**: Node.jsサーバーフレームワーク（Lambda用）
- **@vendia/serverless-express 4.12.6**: AWS Lambda対応
- **@hono/node-server 1.13.8**: Hono Node.jsアダプター
- **tsx**: TypeScript実行環境
- **esbuild**: バンドラー

**主な役割**:
- Claude Desktop等のMCPクライアントとの統合
- x402決済プロトコルによる自動支払い機能
- ステーブルコイン（USDC）による有料API提供
- Google Cloud Run対応のDocker化

### ブロックチェーン（pkgs/contract）
- **Hardhat 2.26.1**: 開発環境
- **Viem**: Ethereum クライアント
- **Ethers 6.13**: Ethereumライブラリ（後方互換）
- **Base Sepolia**: デプロイ先L2チェーン（Chain ID: 84532）
- **Solidity 0.8.28**: スマートコントラクト言語（viaIR有効）

### ブロックチェーンライブラリ
- **@account-abstraction/contracts 0.7.0**: ERC4337実装
- **OpenZeppelin 5.0.0**: 標準コントラクト
- **Solhint 5.0.4**: Linter
- **Mocha + Chai**: テストフレームワーク

### インフラ
- **Alchemy API**: ノード接続
- **Basescan**: コントラクト検証
- **Google Cloud Run**: x402serverデプロイ先
- **AWS Lambda**: MCPサーバーデプロイオプション

## ZK証明回路（pkgs/circuit）

### ツール
- **Circom**: 回路記述言語
- **SnarkJS 0.6.9**: 証明生成・検証
- **Circomlib 2.0.5**: 標準回路ライブラリ
- **Circomlibjs 0.1.7**: JavaScript実装

### プロトコル
- **Groth16**: ZK証明システム
- **Powers of Tau（14次）**: Trusted setup
- **R1CS**: 算術回路表現

## AI技術

### 画像認識
- **Qwen-VL**: マルチモーダルAI（画像・テキスト認識）
- **allenai/Molmo2-8B**: 画像認識モデル（molmo2_hack/）
- **OpenAI SDK**: Qwen統合用SDK

### AI統合
- **Claude Desktop**: MCP統合によるAI支援
- **音声認識**: Qwenによる音声コマンド処理（計画）

## Web3技術
- **ERC4337**: アカウント抽象化（SmartAccount）
- **ZK証明（Groth16）**: プライバシー保護
- **Base L2（Base Sepolia）**: 低コスト・高速決済
- **x402決済プロトコル**: ステーブルコイン（USDC）による決済
  - 自動支払いインターセプター
  - API使用量ベースの課金（$0.001/リクエスト等）
  - Base Sepoliaテストネットで動作

## コード品質ツール
- **Biome 2.3.11**: フォーマッター・リンター（プロジェクトルート）
  - VCS統合（Git）
  - インポート自動整理
  - ダブルクォート推奨
  - TypeScript, JavaScript対象
- **ESLint 9**: JavaScript/TypeScriptリンター（各パッケージ）
- **Solhint 5.0.4**: Solidityリンター
- **Laravel Pint 1.13**: PHPフォーマッター
- **Vitest**: JavaScriptテストフレームワーク
- **PHPUnit 11.0.1**: PHPテストフレームワーク
- **pytest 8.0.0**: Pythonテストフレームワーク

## 開発環境
- **Node.js**: >=18
- **pnpm**: 10.20.0（packageManager固定）
- **PHP**: 8.2
- **Python**: 3.x
- **macOS（Darwin）**: 開発環境OS

## ネットワーク設定
- **Base Sepolia Testnet**
  - RPC: Alchemy経由
  - Chain ID: 84532
  - Block Explorer: Basescan
  - ステーブルコイン: USDC（テストネット）

## ランディングページ（www/web）
- **TailwindCSS 3.4.16**: CDN経由
- **Remix Icon 4.6.0**: アイコンライブラリ
- **Google Fonts (Pacifico)**: フォント
- **静的HTML**: バニラJavaScript

## 開発ワークフロー
```
circuit (Circom + SnarkJS)
  → コンパイル
  → Verifierコントラクト生成
  → contract (Hardhat)
    → デプロイ（Base Sepolia）
    ← frontend (Next.js) で検証
       ← laravel (Laravel API) でビジネスロジック
       ← python (Flask) でAI推論
    ← x402server (Hono) で有料API提供
       ← mcp (MCP Client) で決済統合
          ← Claude Desktop でAI支援
```

## パッケージマネージャー
- **pnpm 10.20.0**: モノレポ管理（workspace）
- **Composer**: PHP依存関係管理（Laravel）
- **pip**: Python依存関係管理（Flask）

## バージョン管理
- **Git**: ソースコード管理
- **GitHub**: リモートリポジトリ
- **コンベンショナルコミット**: コミットメッセージ規約

## CI/CD（計画）
- **GitHub Actions**: 自動テスト・デプロイ
- **Docker**: コンテナ化（x402server）
- **Google Cloud Run**: 本番デプロイ（x402server）
- **AWS Lambda**: サーバーレスデプロイ（mcp）

## 主要な依存関係バージョン

### フロントエンド
- Next.js 16.1.3
- React 19.2.3
- TailwindCSS 4.x
- Motion 12.26.2

### バックエンド
- Laravel 11.31
- Flask 3.0.0
- Hono 4.7.1
- MCP SDK 1.9.0

### Web3
- Hardhat 2.26.1
- Solidity 0.8.28
- Circom (latest)
- SnarkJS 0.6.9

### 品質ツール
- Biome 2.3.11
- ESLint 9.x
- Vitest (latest)
