# Qwen-VL API ドキュメント

Alibaba Cloud DashScope APIを使用したQwen-VLマルチモーダルAI統合。

## 概要

Qwen-VLは画像理解・文字認識（OCR）・音声対話が可能なマルチモーダルAI。本システムではナンバープレート認識に使用。

## 実装場所

- **x402 Server**: `pkgs/x402server/src/lib/qwen-vl-client.ts`
- **Python Backend**: `python/app/services/qwen_mcp_client.py`

## 環境変数

```env
# DashScope APIキー（必須）
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx

# 使用モデル（オプション、デフォルト: qwen-vl-plus）
QWEN_MODEL=qwen-vl-plus

# タイムアウト（オプション、デフォルト: 5000ms）
QWEN_TIMEOUT=5000

# 最大リトライ回数（オプション、デフォルト: 3）
QWEN_MAX_RETRIES=3
```

## モデル選択

| モデル | コスト | 用途 |
|--------|--------|------|
| `qwen-vl-plus` | ¥0.1/リクエスト | 標準認識（推奨） |
| `qwen-vl-max` | ¥0.4/リクエスト | 高精度認識 |

## API仕様

### エンドポイント

```
POST https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
```

### リクエスト例

```typescript
const requestBody = {
  model: 'qwen-vl-plus',
  input: {
    messages: [
      {
        role: 'user',
        content: [
          { image: 'data:image/jpeg;base64,...' },
          { text: 'この画像のナンバープレートを認識してください' }
        ]
      }
    ]
  },
  parameters: {
    result_format: 'message'
  }
};
```

### レスポンス例

```json
{
  "output": {
    "choices": [
      {
        "message": {
          "content": [
            {
              "text": "{\"detected\": true, \"region\": \"品川\", \"classificationNumber\": \"330\", \"hiragana\": \"あ\", \"serialNumber\": \"1234\", \"plateType\": \"REGULAR\", \"confidence\": 95}"
            }
          ]
        }
      }
    ]
  },
  "usage": {
    "input_tokens": 1200,
    "output_tokens": 50
  }
}
```

## TypeScript クライアント使用例

```typescript
import { QwenVLClient, createQwenVLClientFromEnv } from './lib/qwen-vl-client';

// 環境変数から自動設定
const client = createQwenVLClientFromEnv();

// または手動設定
const client = new QwenVLClient({
  apiKey: 'sk-xxx',
  model: 'qwen-vl-plus',
  timeout: 5000,
  maxRetries: 3
});

// 認識実行
const result = await client.recognize(base64Image);

if (result.parsedData) {
  console.log('認識成功:', result.parsedData.fullText);
  console.log('信頼度:', result.confidence);
  console.log('処理時間:', result.processingTime, 'ms');
}
```

## 認識結果データ構造

```typescript
interface LicensePlateData {
  region: string;              // 地名（例: 品川）
  classificationNumber: string; // 分類番号（例: 330）
  hiragana: string;            // ひらがな（例: あ）
  serialNumber: string;        // 一連番号（例: 1234）
  fullText: string;            // 完全なテキスト
  confidence: number;          // 信頼度（0-100）
  plateType: PlateType;        // プレートタイプ
  recognizedAt: number;        // 認識タイムスタンプ
}

type PlateType =
  | 'REGULAR'    // 普通自動車（白地に緑文字）
  | 'LIGHT'      // 軽自動車（黄色地に黒文字）
  | 'COMMERCIAL' // 事業用（緑地に白文字）
  | 'RENTAL'     // レンタカー（わ、れナンバー）
  | 'DIPLOMATIC'; // 外交官（青地に白文字）
```

## エラーハンドリング

```typescript
import { QwenVLError } from './lib/qwen-vl-client';

try {
  const result = await client.recognize(image);
} catch (error) {
  if (error instanceof QwenVLError) {
    switch (error.code) {
      case 'API_CONNECTION_FAILED':
        // 接続エラー（リトライ可能）
        break;
      case 'TIMEOUT':
        // タイムアウト（リトライ可能）
        break;
      case 'INVALID_RESPONSE':
        // 不正なレスポンス
        break;
      case 'NO_PLATE_DETECTED':
        // ナンバープレート未検出
        break;
      case 'PARSE_ERROR':
        // パースエラー
        break;
    }
  }
}
```

## リトライ設定

デフォルトのリトライ設定:

```typescript
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 100,    // ms
  maxDelay: 1000,       // ms
  backoffMultiplier: 2  // 指数バックオフ
};
```

## パフォーマンス

- 平均処理時間: 150ms以下
- 認識率: 98%以上
- 対応形式: JPEG, PNG, WebP

## コスト試算

月間1万ユーザー、1ユーザー16リクエスト/月の場合:

| モデル | 月間リクエスト | 月額コスト |
|--------|---------------|-----------|
| qwen-vl-plus | 160,000 | 約¥16,000 |
| qwen-vl-max | 160,000 | 約¥64,000 |

---

作成日: 2026-01-18
