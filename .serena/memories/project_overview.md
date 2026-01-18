# プロジェクト概要

## プロジェクト名
car - ナンバープレート連動ウォレットシステム (inCar)

## プロジェクトの目的
次世代オートモーティブ生成AIハッカソン用のリポジトリ。ブロックチェーン（Web3）とAI技術を融合させた次世代のモビリティプラットフォーム。

**「ナンバープレート連動ウォレットシステム」** は、車両のナンバープレートそのものを「ウォレットID」化する点が最大の特長。専用アプリの操作を必要とせず、走行するだけで相手や施設を特定し、シームレスな決済やデータ連携を可能にする。

技術スタックとしては、低コスト・高速決済を実現する「Base L2」ブロックチェーンや、画像・音声認識を統合したマルチモーダルAI「Qwen」を採用しており、実用性の高いスケーラブルな構成。

## 解決する課題

このプロダクトは、現在のモビリティ社会における「ユーザーの摩擦」と「社会的な非効率性」の解決を目指す。

1. **現場の摩擦・ユーザー負担**:
   - 駐車場精算機での小銭探し
   - 雨天時の窓開け操作
   - ドライブスルーでの長い待ち時間
   - 運転中のスマホ操作による危険性

2. **証拠の信頼性不足**:
   - ドライブレコーダー映像の改ざんリスク
   - 事故時の証拠提出手続きの複雑さ

3. **データの死蔵と非還元**:
   - 膨大な走行データが活用されない
   - データ提供者（ドライバー）へのインセンティブ不在

4. **社会・制度課題**:
   - 観光地でのオーバーツーリズム（渋滞）
   - 既存のETC・ゲートシステムの導入・維持コストが極めて高い（中小施設には障壁）

## 実現する機能

「車に乗ったままで何でもできる」世界の実現により、以下の具体的な価値を提供：

### 1. フリクションレスな自動決済
- **ゲート自動決済**: AIカメラがナンバーを認識し、0.5秒でゲート解錠と決済を完了
- **ドライブスルー革命**: 店舗到着と同時に注文・決済が完了し、待ち時間ゼロで商品受け取り

### 2. 安全で高度な運転支援
- **AIコンシェルジュ**: 音声AIにより、運転中に「近くの空いてる駐車場」を検索・予約・決済までハンズフリーで完結
- **デジタル証拠登録**: 映像をブロックチェーンに即時記録することで、改ざん不可能な証拠として事故解決を迅速化

### 3. 新たな経済圏の創出
- **データ収益化**: 走行データを匿名化して販売し、収益の70%をユーザーへ還元する「走るほど稼げる」仕組み（月間平均640円の報酬を想定）
- **P2P投げ銭**: 運転中に道を譲ってもらった際などの感謝を、ナンバー認識を通じてチップとして送信可能
- **車両価値の活用**: 自分の車を登録時に車の価値が査定され、その金額をローン枠として利用可能（「わ」「れ」ナンバーの車はレンタカー・カーシェアのため使用不可）

### 4. 社会的インパクト
- ダイナミックプライシング（混雑に応じた価格変動）により、観光地の渋滞を最大30%緩和
- 降車回数や窓開け操作を90%削減し、店舗の回転率を30%向上

## 実現方式
1. 車のナンバープレートを画像認識して抽出（この値が重要になるので画像認識の精度は非常に重要）
2. 抽出した情報をZKで秘匿化（パスワードハッシュ化と同じでも良いかも）
3. その値を使ったAA用のSmartAccount（ERC4337規格準拠）を作成
4. スマホなどに金額案内などと同時に利用承認の通知が来る
5. 承認したらゲートが開く
6. 出るときAIカメラで自動的にゲートを開けるのと課金トランザクション発生
7. **x402決済プロトコル**により、ステーブルコイン（USDC）での自動決済を実現
   - MCPクライアント（mcp）がClaude Desktopと統合し、AIによる音声コマンドでの決済操作
   - x402serverがAPI課金エンドポイントを提供（$0.001/リクエスト等の従量課金）
   - 自動支払いインターセプターにより、リクエスト送信前に決済を完了

## システム構成

### モノレポ構成
pnpm workspaceを使用したモノレポ構成。以下のパッケージで構成：

#### メインパッケージ
- **frontend**: Next.js + React 19のWebアプリケーション（PWA対応）
- **contract**: Hardhat + Solidityのスマートコントラクト（Base Sepolia L2）
- **circuit**: Circomによるゼロ知識証明回路（Groth16）
- **mcp**: x402決済プロトコル対応MCPクライアント（Claude Desktop統合）
- **x402server**: x402決済対応Honoサーバー（有料API提供、Google Cloud Run対応）

#### サブパッケージ
- **molmo2_hack**: Molmo2画像認識モデル関連スクリプト
- **qwen-sample**: Qwenマルチモーダルサンプル実装

#### バックエンドサーバー
- **laravel**: Laravel 11 APIサーバー（PHP 8.2、認証、CRUD、履歴管理）
- **python**: Flask APIサーバー（AI推論、画像処理、車両査定）

#### ランディングページ
- **www/web**: 静的HTMLランディングページ（Tailwind CSS）

## 技術スタック
| カテゴリ | 技術 |
|---------|------|
| **フロントエンド** | Next.js 16, React 19, TypeScript, TailwindCSS 4, Shadcn/ui, Motion, biome |
| **バックエンド（Laravel）** | Laravel 11, PHP 8.2, Composer |
| **バックエンド（Python）** | Flask 3.0, httpx, python-dotenv |
| **AI** | Qwen (OpenAI SDK), allenai/Molmo2-8B, Claude Desktop (MCP統合) |
| **Web3** | Base Sepolia, ERC4337 AA, SmartAccount, ゼロ知識証明, Solidity 0.8.28, Circom, x402決済プロトコル |
| **決済** | x402, x402-axios, x402-hono, USDC (ステーブルコイン) |
| **API・MCP** | MCP SDK 1.9.0, Hono 4.7.1, Express 4.18, Axios 1.8 |
| **インフラ** | Google Cloud Run, Docker, AWS Lambda, Node.js >=18 |
| **開発ツール** | pnpm 10.20.0, Hardhat 2.26, Viem, SnarkJS 0.6.9 |
| **コード品質** | Biome 2.3.11, Solhint, ESLint 9, Vitest |

## ビジネスモデル
- 施設側: 自動決済による回転率向上（30%）、降車回数削減（90%）
- ユーザー側: 走行データ収益化、手間の削減
- 社会的: 渋滞緩和（最大30%）、既存ゲートシステムの低コスト化

## 機能一覧表

| 機能 | 説明 | ステータス |
|:------|:------|:------------|
| ナンバープレート認識機能 | 車のナンバープレートの情報を認識する | 開発中 |
| ウォレットアドレス変換機能 | ゼロ知識証明により内容を秘匿化しながら決定論的にナンバープレートからウォレットアドレスを算出する機能 | 開発中 |
| 自動車の価値を算出する機能（トークン化） | 自動車の現在の評価額をトークン化する機能 | 計画中 |
| チップ機能 | 道を譲ってもらった際の感謝を送信する機能（x402による支払い） | 計画中 |
| ゲート自動決済 | AIカメラによる自動ナンバー認識と決済 | 計画中 |
| ドライブスルー革命 | 到着と同時の注文・決済完了 | 計画中 |
| AIコンシェルジュ | 音声AIによる駐車場検索・予約・決済 | 計画中 |

## API設計

### Laravel API (`/api/`) - ビジネスロジック系
- 認証・ユーザー管理（6エンドポイント）
- ナンバープレート・ウォレット管理（4エンドポイント）
- 車両価値トークン化・ローン機能（8エンドポイント）
- 通知機能（4エンドポイント）
- その他・共通機能（3エンドポイント）

### Flask API (`/papi/`) - AI/画像処理系
- `/papi/recognize`: ナンバープレート認識（Qwen-VL）
- `/papi/validate-image`: 画像品質検証
- `/papi/appraise-vehicle`: 車両査定（AI/外部API統合）

### x402 Server API - 決済系
- `/tip`: 投げ銭トランザクション実行
- `/tip/status/:txHash`: トランザクションステータス取得

## 将来構想
自動車の走行履歴や自動車間のトランザクションのやり取りを分散型ナレッジグラフネットワークに書き込み、社会の実情を反映した渋滞予測などのプログラムを作成することに繋げる。

本取り組みはその足がかりとなるもの。

## クイックスタート

### セットアップ

#### 1. リポジトリのクローンと依存関係のインストール
```bash
git clone <repository-url>
cd car
pnpm install
```

#### 2. 環境変数の設定
`pkgs/contract/.env` ファイルを作成し、以下を設定：
```bash
PRIVATE_KEY=<your-wallet-private-key>
ALCHMEY_API_KEY=<your-alchemy-api-key>
BASESCAN_API_KEY=<your-basescan-api-key>
```

### フロントエンド

```bash
# 開発サーバー起動
pnpm frontend dev
# ブラウザで http://localhost:3000 にアクセス

# 本番ビルド
pnpm frontend build
pnpm frontend start

# PWAアイコン生成
pnpm frontend generate:icons
```

### サーキット（ZK証明回路）

完全な実行フロー：
```bash
# 1. 回路のコンパイル（.circom → R1CS, WASM, C++）
pnpm circuit compile

# 2. 入力データの生成
pnpm circuit generateInput

# 3. Witness（証人）の生成
pnpm circuit generateWitness

# 4. Groth16証明の生成と検証
pnpm circuit executeGroth16

# 5. テストの実行
pnpm circuit test
```

生成ファイルの配布：
```bash
# Verifierコントラクトをcontractパッケージにコピー
pnpm circuit cp:verifier

# ZKファイル（WASM, zkey）をbackend/frontendにコピー
pnpm circuit cp:zk
```

### コントラクト（スマートコントラクト）

開発フロー：
```bash
# コンパイル
pnpm contract compile

# テストの実行
pnpm contract test

# カバレッジ取得
pnpm contract coverage
```

デプロイ（Base Sepolia）：
```bash
# LicensePlateAccountFactoryのデプロイ＆検証
pnpm contract deploy:LicensePlate:baseSepolia

# デプロイ済みコントラクトの検証
pnpm contract verify
```

ローカル開発：
```bash
# ローカルHardhatノードの起動
pnpm contract local

# アカウント残高確認
pnpm contract getBalance

# チェーン情報取得
pnpm contract getChainInfo
```

### コード品質チェック

プロジェクトルートで以下を実行：
```bash
# コードフォーマット
pnpm format

# リント（修正含む）
pnpm lint
```
