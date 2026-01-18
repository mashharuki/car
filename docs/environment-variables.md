# 環境変数リファレンス

全パッケージの環境変数一覧。

## Frontend (`pkgs/frontend/.env.local`)

```env
# APIベースURL（必須）
NEXT_PUBLIC_API_BASE_URL=https://api.incar.style
```

## x402 Server (`pkgs/x402server/.env`)

```env
# x402 ファシリテーター設定
FACILITATOR_URL=https://facilitator.example.com
NETWORK=base-sepolia
ADDRESS=0x...

# Qwen-VL API設定（必須）
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx

# Qwen-VL オプション設定
QWEN_MODEL=qwen-vl-plus          # qwen-vl-plus or qwen-vl-max
QWEN_TIMEOUT=5000                # タイムアウト（ms）
QWEN_MAX_RETRIES=3               # 最大リトライ回数
```

## Contract (`pkgs/contract/.env`)

```env
# デプロイ用秘密鍵（必須）
PRIVATE_KEY=0x...

# Alchemy APIキー（必須）
ALCHMEY_API_KEY=xxx

# Basescan検証用APIキー
BASESCAN_API_KEY=xxx
```

## MCP Server (`pkgs/mcp/.env`)

```env
# 秘密鍵
PRIVATE_KEY=0x...

# リソースサーバー設定
RESOURCE_SERVER_URL=https://resource.example.com
ENDPOINT_PATH=/api/endpoint
```

## Laravel Backend (`laravel/.env`)

```env
# アプリケーション設定
APP_NAME=LicensePlateWallet
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://localhost

# データベース設定（必須）
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=license_plate_wallet
DB_USERNAME=root
DB_PASSWORD=

# キャッシュ・セッション
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Redis設定
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Sesame API設定（必須）
SESAME_API_KEY=your-sesame-api-key
SESAME_TIMEOUT=10
SESAME_MAX_RETRIES=3
```

## Python Backend (`python/.env`)

```env
# Flask設定
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
FLASK_DEBUG=false

# Qwen MCP設定（必須）
QWEN_MCP_URL=https://mcp.example.com
QWEN_API_KEY=your-qwen-api-key
```

## 環境変数の優先順位

1. システム環境変数
2. `.env.local`（Gitignore対象）
3. `.env`

## セキュリティ注意事項

⚠️ 以下の環境変数は絶対にコミットしないこと:

- `PRIVATE_KEY` - ブロックチェーン秘密鍵
- `DASHSCOPE_API_KEY` - Qwen API キー
- `SESAME_API_KEY` - Sesame API キー
- `QWEN_API_KEY` - Qwen MCP API キー
- `DB_PASSWORD` - データベースパスワード

## 本番環境設定例

### Frontend

```env
NEXT_PUBLIC_API_BASE_URL=https://api.incar.style
```

### Laravel

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.incar.style

DB_CONNECTION=mysql
DB_HOST=production-db-host
DB_DATABASE=license_plate_wallet_prod
```

### x402 Server

```env
NETWORK=base-mainnet
QWEN_MODEL=qwen-vl-plus
QWEN_TIMEOUT=10000
```

---

作成日: 2026-01-18
