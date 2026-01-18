# x402 Payment Protocol ドキュメント

x402決済プロトコルサーバー（Hono）の統合ガイド。

## 概要

x402はブロックチェーンベースの決済プロトコル。投げ銭機能やゲート自動決済に使用。

## 実装場所

- **Server**: `pkgs/x402server/src/index.ts`
- **Routes**: `pkgs/x402server/src/routes/`
- **Middleware**: `pkgs/x402server/src/middleware/`

## 環境変数

```env
# x402 ファシリテーター設定
FACILITATOR_URL=https://facilitator.example.com
NETWORK=base-sepolia
ADDRESS=0x...

# Qwen-VL API（ナンバープレート認識用）
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx
QWEN_MODEL=qwen-vl-plus
QWEN_TIMEOUT=5000
```

## エンドポイント

### 投げ銭実行

```
POST /tip
Content-Type: application/json

{
  "amount": 500,
  "currency": "JPY",
  "toPlateNumber": "品川330あ1234",
  "memo": "道を譲ってくれてありがとう"
}
```

**レスポンス:**
```json
{
  "txHash": "0xabc123...",
  "status": "submitted"
}
```

### トランザクションステータス取得

```
GET /tip/status/{txHash}
```

**レスポンス:**
```json
{
  "txHash": "0xabc123...",
  "status": "confirmed",
  "updatedAt": "2026-01-18T12:00:00Z"
}
```

### ナンバープレート認識

```
POST /recognize
Content-Type: application/json

{
  "imageBase64": "data:image/jpeg;base64,..."
}
```

**レスポンス:**
```json
{
  "plateNumber": "品川330あ1234",
  "confidence": 0.98,
  "plateType": "REGULAR"
}
```

## アーキテクチャ

```
┌─────────────────┐
│  Next.js PWA    │
│  (Frontend)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  x402 Server    │
│  (Hono)         │
├─────────────────┤
│ - /tip          │
│ - /recognize    │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────────┐
│ Base  │ │ Qwen-VL   │
│ L2    │ │ DashScope │
└───────┘ └───────────┘
```

## 投げ銭フロー

```
1. ユーザーが前方車両を撮影
   ↓
2. x402 Server → Qwen-VL でナンバープレート認識
   ↓
3. ナンバープレート → ウォレットアドレス変換
   ↓
4. ユーザーが金額選択・承認
   ↓
5. x402 Server → Base L2 でトランザクション実行
   ↓
6. 相手にプッシュ通知
```

## Next.js Server Actions 連携

```typescript
// app/actions/tip.ts
'use server'

export async function sendTip(
  toPlateNumber: string,
  amount: number
) {
  const response = await fetch(`${process.env.X402_SERVER_URL}/tip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      currency: 'JPY',
      toPlateNumber
    })
  });

  return response.json();
}
```

## エラーハンドリング

```typescript
// エラーレスポンス形式
{
  "error": "INSUFFICIENT_BALANCE",
  "message": "残高が不足しています"
}
```

**エラーコード:**

| コード | 説明 |
|--------|------|
| `INSUFFICIENT_BALANCE` | 残高不足 |
| `PLATE_NOT_FOUND` | ナンバープレート未登録 |
| `RECOGNITION_FAILED` | 認識失敗 |
| `TRANSACTION_FAILED` | トランザクション失敗 |
| `RATE_LIMITED` | レート制限 |

## ブロックチェーン設定

### Base Network

| 項目 | Mainnet | Sepolia (Testnet) |
|------|---------|-------------------|
| Chain ID | 8453 | 84532 |
| RPC URL | https://mainnet.base.org | https://sepolia.base.org |
| Block Time | 2秒 | 2秒 |
| Gas Fee | $0.01以下 | Free |

## 開発サーバー起動

```bash
cd pkgs/x402server

# 依存関係インストール
pnpm install

# 開発サーバー起動
pnpm dev
```

## テスト

```bash
cd pkgs/x402server

# テスト実行
pnpm test
```

---

作成日: 2026-01-18
