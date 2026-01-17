# コードスタイル・規約

## 全般的な方針

### 言語・フォーマット
- **思考**: 英語で考える
- **出力**: わかりやすく自然な日本語で記述（ドキュメント、コメント）
- **コード**: 英語（変数名、関数名、コメント）
- **フォーマッター**: Biome 2.3.11（設定: `biome.json`）

### TypeScript
- **型安全性**: `any` の使用は最小限に
- **strictモード**: 有効
- **インデント**: スペース（Biome設定）
- **クォート**: ダブルクォート `"` 推奨

### コード品質
- DRY原則の徹底
- 意味のある変数名・関数名で意図を明確化
- 小さな問題も放置しない（Broken Windows理論）
- コメントは「なぜ」を説明（「何を」はコードで表現）

## 命名規則

### TypeScript/JavaScript
```typescript
// 変数・関数: camelCase
const userName = "Alice"
function calculateTotal() {}

// コンポーネント・クラス: PascalCase
class UserManager {}
function UserProfile() {}

// 定数: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3

// プライベート: _prefix（推奨）
class Example {
  private _internalState = 0
}

// 型・インターフェース: PascalCase
interface UserData {}
type ResponseType = {}
```

### Solidity
```solidity
// コントラクト・インターフェース: PascalCase
contract PasswordHashVerifier {}
interface IPasswordHashVerifier {}

// 関数: camelCase
function verifyProof() {}

// 状態変数: camelCase
uint256 public totalSupply;

// 定数: UPPER_SNAKE_CASE
uint256 constant MAX_SUPPLY = 1000;

// イベント: PascalCase
event TokenMinted(address indexed to, uint256 amount);
```

### Circom
```circom
// テンプレート: PascalCase
template PasswordHash() {}

// シグナル: camelCase
signal input passwordHash;
signal output isValid;
```

## インポート・エクスポート

### インポート順序（Biomeが自動整理）
```typescript
// 1. 外部ライブラリ
import { useState, useEffect } from 'react'
import { createPublicClient } from 'viem'

// 2. 内部モジュール
import { utils } from '@/lib/utils'

// 3. 相対パス
import Component from './Component'
import styles from './styles.module.css'
```

### エクスポート
```typescript
// Named export推奨（再利用性）
export function utilityFunction() {}
export const CONSTANT = 42

// Default export（コンポーネントのみ）
export default function Page() {}
```

## React/Next.js

### コンポーネント構造
```typescript
'use client' // 必要な場合のみ

import { useState } from 'react'

interface Props {
  title: string
  count?: number
}

export default function MyComponent({ title, count = 0 }: Props) {
  const [state, setState] = useState(0)
  
  // ロジック
  
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Hooks
- カスタムHooksは `use` プレフィックス
- コンポーネントトップレベルで呼び出し
- 依存配列を明示的に管理

### スタイリング
- TailwindCSS クラス使用
- `cn()` ヘルパーで条件付きクラス結合

## Solidity

### セキュリティ
- OpenZeppelin標準実装の利用
- 再入攻撃対策（Checks-Effects-Interactions パターン）
- 整数オーバーフロー対策（Solidity 0.8以降は組み込み）
- 外部呼び出しは慎重に

### ガス最適化
- `viaIR` 有効化（設定済み）
- 状態変数の読み書きを最小化
- `memory` vs `storage` の使い分け

### ドキュメント
```solidity
/// @notice ユーザー向け説明
/// @dev 開発者向け詳細
/// @param proof ZK証明データ
/// @return bool 検証結果
function verifyProof(uint[8] memory proof) public view returns (bool) {}
```

## エラーハンドリング

### TypeScript
```typescript
// 明確なエラーメッセージ
throw new Error('Invalid password: must be at least 8 characters')

// カスタムエラークラス
class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// 外部API呼び出しは必ずtry-catch
try {
  const data = await fetchData()
} catch (error) {
  console.error('Failed to fetch data:', error)
  // エラーを握りつぶさない
  throw error
}
```

### Solidity
```solidity
// require（入力検証）
require(msg.value > 0, "Value must be positive");

// revert（複雑な条件）
if (condition) {
    revert("Detailed error message");
}

// カスタムエラー（ガス効率）
error InsufficientBalance(uint256 available, uint256 required);
revert InsufficientBalance(balance, amount);
```

## テスト

### 原則
- 振る舞いをテスト（実装詳細ではなく）
- テスト間の依存を避ける
- 高速で決定的なテスト
- エラーケースも必ずカバー

### TypeScript（Mocha + Chai）
```typescript
import { expect } from 'chai'

describe('Component', () => {
  it('should render correctly', () => {
    // Given
    const props = { title: 'Test' }
    
    // When
    const result = render(props)
    
    // Then
    expect(result).to.include('Test')
  })
})
```

### Solidity（Hardhat + Viem）
```typescript
import { expect } from 'chai'
import hre from 'hardhat'

describe('Contract', () => {
  it('should verify valid proof', async () => {
    const contract = await deployContract()
    const proof = generateProof()
    
    const result = await contract.read.verifyProof([proof])
    
    expect(result).to.be.true
  })
})
```

## Git コミット規約

### コンベンショナルコミット
```bash
# 新機能
git commit -m "feat: ナンバープレート認識機能を追加"

# バグ修正
git commit -m "fix: ZK証明の検証エラーを修正"

# ドキュメント
git commit -m "docs: READMEにセットアップ手順を追加"

# テスト
git commit -m "test: PasswordHashVerifierのテストを追加"

# リファクタリング
git commit -m "refactor: コンポーネント構造を整理"

# その他
git commit -m "chore: 依存関係を更新"
```

### コミット内容
- 原子的（単一の変更に焦点）
- 明確で説明的なメッセージ（英語）
- ボディで詳細説明（必要時）

## ドキュメント規約

### README
- プロジェクト概要
- セットアップ手順
- 使用方法
- 実例

### コードコメント
```typescript
// ✅ Good: なぜこうするかを説明
// ZK証明の検証には約3秒かかるため、ローディング表示が必要
const [isVerifying, setIsVerifying] = useState(false)

// ❌ Bad: 何をするかだけ説明（コードで自明）
// isVerifyingをfalseに設定
setIsVerifying(false)
```

### ADR（Architecture Decision Records）
重要な設計判断は `.kiro/steering/` または専用ディレクトリに記録

## 保守性

### リファクタリング
- ボーイスカウトルール: コードを見つけた時より良い状態で残す
- 大規模変更は小さなステップに分割
- 未使用コードは積極的に削除
- 技術的負債は明示的に記録

### 依存関係
- 本当に必要なもののみ追加
- ライセンス、サイズ、メンテナンス状況を確認
- 定期的に更新（セキュリティ・バグ修正）
- `pnpm-lock.yaml` を必ずコミット

## プロジェクト固有の規約

### ZK回路（Circom）
- テンプレート名は処理内容を明確に
- 制約の意図をコメントで説明
- セキュリティに関わる制約は特に注意

### スマートコントラクト
- ガス効率とセキュリティのバランス
- 監査可能なシンプルな実装
- ZK検証ロジックは変更しない（自動生成）

### フロントエンド
- PWA対応を意識
- モバイルファーストデザイン
- アクセシビリティ（ARIA属性、キーボード操作）

## タスク完了時のチェックリスト

1. ✅ `pnpm format` でコード整形
2. ✅ `pnpm lint` でリント通過
3. ✅ 関連テストが通る
4. ✅ エラーハンドリングが適切
5. ✅ 型安全性が保たれている
6. ✅ コメント・ドキュメントが更新されている
7. ✅ コンベンショナルコミットでコミット
8. ✅ 不要なコード・コメントが削除されている