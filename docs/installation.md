# インストールガイド

ナンバープレート連動ウォレットシステムのセットアップ手順。

## 前提条件

- Node.js 20+
- pnpm 8+
- PHP 8.3+
- Python 3.x
- MySQL 8.0+
- Circom 2.x（ZK回路コンパイル用）

## クイックスタート

```bash
# リポジトリをクローン
git clone <repository-url>
cd <project-directory>

# 依存関係をインストール
pnpm install
```

## パッケージ別セットアップ

### Frontend (Next.js PWA)

```bash
cd pkgs/frontend

# 環境変数を設定
cp .env.example .env.local

# 開発サーバー起動
pnpm dev
```

**必須環境変数:**
- `NEXT_PUBLIC_API_BASE_URL` - APIベースURL（例: `https://api.incar.style`）

### Contract (Hardhat)

```bash
cd pkgs/contract

# 環境変数を設定
cp .env.example .env

# コンパイル
pnpm compile

# テスト
pnpm test
```

**必須環境変数:**
- `PRIVATE_KEY` - デプロイ用秘密鍵
- `ALCHMEY_API_KEY` - Alchemy APIキー
- `BASESCAN_API_KEY` - Basescan検証用APIキー

### Circuit (Circom)

```bash
cd pkgs/circuit

# 回路コンパイル
pnpm compile

# Groth16証明生成
pnpm executeGroth16
```

**前提条件:**
- Circom 2.x がインストール済み
- snarkjs がグローバルインストール済み

### x402 Server (Hono)

```bash
cd pkgs/x402server

# 環境変数を設定
cp .env.example .env

# 開発サーバー起動
pnpm dev
```

**必須環境変数:**
- `DASHSCOPE_API_KEY` - Qwen-VL API用
- `QWEN_MODEL` - 使用モデル（`qwen-vl-plus` or `qwen-vl-max`）
- `FACILITATOR_URL` - x402ファシリテーターURL
- `NETWORK` - ネットワーク名
- `ADDRESS` - コントラクトアドレス

### Laravel Backend

```bash
cd laravel

# Composerで依存関係をインストール
composer install

# 環境変数を設定
cp .env.example .env

# アプリケーションキー生成
php artisan key:generate

# データベースマイグレーション
php artisan migrate

# 開発サーバー起動
php artisan serve
```

**必須環境変数:**
- `DB_*` - MySQL接続情報
- `SESAME_API_KEY` - Sesame Web APIキー

### Python Backend (Flask)

```bash
cd python

# 仮想環境を作成
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係をインストール
pip install -r requirements.txt

# 環境変数を設定
cp .env.example .env

# 開発サーバー起動
python run.py
```

**必須環境変数:**
- `QWEN_MCP_URL` - Qwen MCPサーバーURL
- `QWEN_API_KEY` - Qwen APIキー

## 共通コマンド

```bash
# コード品質チェック
pnpm format
pnpm lint

# 全パッケージのテスト
pnpm test
```

## 本番環境

### APIドメイン

- **Production**: `https://api.incar.style`
- Laravel API: `/api/`
- Flask API: `/papi/`

### ブロックチェーン

- **Network**: Base Sepolia (Testnet) / Base Mainnet
- **Chain ID**: 8453 (Mainnet) / 84532 (Sepolia)

## トラブルシューティング

### Circomインストール

```bash
# Rustがインストールされていることを確認
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Circomをインストール
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom
```

### snarkjsインストール

```bash
npm install -g snarkjs
```

---

作成日: 2026-01-18
