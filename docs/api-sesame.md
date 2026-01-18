# Sesame Web API ドキュメント

CANDY HOUSE Sesame スマートロック制御API統合。

## 概要

Sesame Web APIを使用してスマートロック（ゲート）の開閉制御を行う。駐車場セキュリティゲートの自動開閉に使用。

## 実装場所

- **Laravel**: `laravel/app/Services/SesameApiClient.php`
- **例外クラス**: `laravel/app/Exceptions/SesameApiException.php`

## 環境変数

```env
# Sesame APIキー（必須）
SESAME_API_KEY=your-api-key

# タイムアウト秒数（オプション、デフォルト: 10）
SESAME_TIMEOUT=10

# 最大リトライ回数（オプション、デフォルト: 3）
SESAME_MAX_RETRIES=3
```

## API仕様

### ベースURL

```
https://api.candyhouse.co/public
```

### 認証

```
Authorization: {API_KEY}
```

## エンドポイント

### デバイス一覧取得

```
GET /sesames
```

**レスポンス例:**
```json
[
  {
    "device_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "serial": "ABC123",
    "nickname": "駐車場ゲート1"
  }
]
```

### デバイスステータス取得

```
GET /sesame/{device_id}
```

**レスポンス例:**
```json
{
  "locked": true,
  "battery": 85,
  "responsive": true
}
```

### 解錠

```
POST /sesame/{device_id}
Content-Type: application/json

{
  "command": "unlock"
}
```

### 施錠

```
POST /sesame/{device_id}
Content-Type: application/json

{
  "command": "lock"
}
```

### ステータス同期

```
POST /sesame/{device_id}
Content-Type: application/json

{
  "command": "sync"
}
```

### タスク結果取得

```
GET /action-result?task_id={task_id}
```

## PHP クライアント使用例

```php
use App\Services\SesameApiClient;
use App\Exceptions\SesameApiException;

// クライアント初期化
$client = new SesameApiClient();

// または手動設定
$client = new SesameApiClient(
    apiKey: 'your-api-key',
    timeout: 10,
    maxRetries: 3
);

// デバイス一覧取得
$devices = $client->getSesameList();

// ステータス取得
$status = $client->getStatus($deviceId);

// 解錠
$result = $client->unlock($deviceId);

// 施錠
$result = $client->lock($deviceId);

// タスク完了待機
$result = $client->waitForTaskCompletion(
    taskId: $taskId,
    maxWaitSeconds: 30,
    pollIntervalMs: 500
);
```

## エラーハンドリング

```php
use App\Exceptions\SesameApiException;

try {
    $result = $client->unlock($deviceId);
} catch (SesameApiException $e) {
    switch ($e->getErrorCode()) {
        case SesameApiException::CODE_UNAUTHORIZED:
            // APIキーが無効
            break;
        case SesameApiException::CODE_DEVICE_NOT_FOUND:
            // デバイスが見つからない
            break;
        case SesameApiException::CODE_DEVICE_OFFLINE:
            // デバイスがオフライン
            break;
        case SesameApiException::CODE_RATE_LIMITED:
            // レート制限
            break;
        case SesameApiException::CODE_TIMEOUT:
            // タイムアウト
            break;
        case SesameApiException::CODE_CONNECTION_FAILED:
            // 接続失敗
            break;
    }
}
```

## リトライ設定

デフォルトのリトライ設定:

```php
const DEFAULT_TIMEOUT = 10;      // 秒
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100;      // 初期遅延
const BACKOFF_MULTIPLIER = 2;    // 指数バックオフ
```

リトライ対象:
- 接続エラー
- タイムアウト
- 5xxサーバーエラー

リトライ対象外:
- 401 認証エラー
- 404 デバイス未検出
- 429 レート制限

## ゲート制御フロー

```
1. ナンバープレート認識（Qwen-VL）
   ↓
2. ウォレットアドレス検索（Laravel API）
   ↓
3. 料金表示・承認待ち
   ↓
4. ユーザー承認
   ↓
5. ゲート解錠（Sesame API）
   ↓
6. 車両通過検知
   ↓
7. ゲート施錠（Sesame API）
```

## Laravel コントローラー例

```php
use App\Services\SesameApiClient;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class GateController extends Controller
{
    public function __construct(
        private SesameApiClient $sesameClient
    ) {}

    public function open(Request $request, string $gateId)
    {
        $result = $this->sesameClient->unlock($gateId);

        return response()->json([
            'success' => true,
            'task_id' => $result['task_id'] ?? null
        ]);
    }

    public function close(Request $request, string $gateId)
    {
        $result = $this->sesameClient->lock($gateId);

        return response()->json([
            'success' => true,
            'task_id' => $result['task_id'] ?? null
        ]);
    }
}
```

## 公式ドキュメント

- [Sesame Web API Documentation](https://docs.candyhouse.co/)

---

作成日: 2026-01-18
