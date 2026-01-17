# タスク完了時の確認事項

## 必須チェック項目

### 1. コード品質
```bash
# フォーマット確認・修正
pnpm format

# リント確認・修正
pnpm lint
```

**結果**: エラーゼロであること

### 2. テスト実行

#### 変更対象に応じたテスト
```bash
# スマートコントラクト変更時
pnpm contract test

# ZK回路変更時
pnpm circuit test

# フロントエンド変更時
# （テスト未整備の場合は手動確認）
pnpm frontend dev
```

**結果**: すべてのテストがパスすること

### 3. 型チェック
```bash
# TypeScriptの型エラー確認
# （各パッケージのビルドで自動実行）
pnpm contract compile
pnpm frontend build
```

**結果**: 型エラーゼロであること

### 4. エラーハンドリング

#### 確認事項
- [ ] すべてのエラーケースに対処しているか
- [ ] エラーメッセージが明確で有用か
- [ ] エラーを握りつぶしていないか（適切に伝播・ログ出力）
- [ ] try-catchで必要な箇所をカバーしているか

### 5. セキュリティ

#### スマートコントラクト
- [ ] 外部入力のバリデーション
- [ ] 再入攻撃対策（必要な場合）
- [ ] アクセス制御の実装
- [ ] 整数オーバーフロー（Solidity 0.8で自動対策済み）

#### 全般
- [ ] 環境変数に秘密情報（ハードコード禁止）
- [ ] 依存関係の脆弱性チェック

### 6. ドキュメント

#### 更新対象
- [ ] README.md（新機能・使い方の変更）
- [ ] コード内コメント（複雑なロジック・なぜそうするか）
- [ ] `.kiro/steering/`（重要な設計変更）
- [ ] ADR（アーキテクチャ決定記録、必要時）

### 7. コミット準備

#### ファイル確認
```bash
# 変更ファイル一覧
git status

# 差分確認
git diff
```

#### 不要なものを除外
- [ ] デバッグ用console.log削除
- [ ] コメントアウトされた古いコード削除
- [ ] TODOコメントは残す（または対応）
- [ ] 自動生成ファイルはコミットしない

#### コミット実行
```bash
# ステージング
git add <files>

# コンベンショナルコミット
git commit -m "feat: <変更内容の要約>"
# または
git commit -m "fix: <バグ修正の要約>"
```

**形式**: 
- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメント
- `test:` テスト追加
- `refactor:` リファクタリング
- `chore:` その他

### 8. コード品質の最終確認

#### 読みやすさ
- [ ] 変数名・関数名が意図を明確に表現
- [ ] 複雑な処理に説明コメント
- [ ] DRY原則を守っている（重複コード削減）

#### 保守性
- [ ] 単一責任の原則
- [ ] 適切な関数・コンポーネント分割
- [ ] 将来の拡張を考慮した設計

#### パフォーマンス
- [ ] 不要な再レンダリング回避（React）
- [ ] ガス効率の考慮（Solidity）
- [ ] N+1問題の回避

## パッケージ別チェック

### Frontend（pkgs/frontend）
- [ ] ビルドエラーなし: `pnpm frontend build`
- [ ] 開発サーバー起動: `pnpm frontend dev`
- [ ] ブラウザで動作確認
- [ ] モバイル表示確認
- [ ] PWAマニフェスト更新（必要時）

### Contract（pkgs/contract）
- [ ] コンパイル成功: `pnpm contract compile`
- [ ] テスト通過: `pnpm contract test`
- [ ] ガス使用量確認（最適化が必要か）
- [ ] デプロイ済みコントラクトとの互換性

### Circuit（pkgs/circuit）
- [ ] コンパイル成功: `pnpm circuit compile`
- [ ] Witness生成: `pnpm circuit generateWitness`
- [ ] 証明生成・検証: `pnpm circuit executeGroth16`
- [ ] テスト通過: `pnpm circuit test`
- [ ] Verifier更新（契約への反映）

## 統合確認

### クロスパッケージ変更時
1. **Circuit → Contract**
   ```bash
   pnpm circuit cp:verifier  # Verifier更新
   pnpm contract compile
   pnpm contract test
   ```

2. **Circuit → Frontend/Backend**
   ```bash
   pnpm circuit cp:zk  # ZKファイル配布
   ```

3. **Contract → Frontend**
   - ABIファイルの同期確認
   - デプロイアドレスの更新

## プッシュ前の最終確認

```bash
# 1. 全体のフォーマット・リント
pnpm format
pnpm lint

# 2. 各パッケージのテスト
pnpm contract test
pnpm circuit test

# 3. ビルド確認
pnpm frontend build
pnpm contract compile

# 4. Gitステータス
git status

# 5. コミット
git commit -m "<type>: <description>"

# 6. プッシュ
git push origin <branch>
```

## レビュー時の観点

### コードレビュー受ける側
- [ ] レビューコメントに対応
- [ ] 変更の理由を明確に説明
- [ ] 代替案も検討

### コードレビューする側
- [ ] コードではなく、ロジックに焦点
- [ ] 建設的なフィードバック
- [ ] セキュリティ・パフォーマンスの観点

## デプロイ前（本番環境）

### スマートコントラクト
- [ ] 監査完了（必要時）
- [ ] テストネットでの動作確認
- [ ] ガス代の見積もり
- [ ] デプロイスクリプトの確認
- [ ] Basescan検証の準備

### フロントエンド
- [ ] 環境変数の本番設定
- [ ] ビルド最適化確認
- [ ] PWA設定の動作確認
- [ ] パフォーマンス計測

## トラブルシューティング

### テスト失敗時
1. エラーメッセージを詳細に確認
2. ローカル環境の再現
3. 依存関係の更新確認: `pnpm install`
4. キャッシュクリア: `pnpm contract clean`

### ビルド失敗時
1. 型エラーの特定・修正
2. 依存関係の整合性確認
3. Node.js/pnpmバージョン確認

### デプロイ失敗時
1. ネットワーク設定確認（RPC, ChainID）
2. 秘密鍵・API Keyの設定確認
3. ガス代の確保

## 定期メンテナンス（週次/月次）

- [ ] 依存関係の更新: `pnpm update`
- [ ] セキュリティ脆弱性チェック: `pnpm audit`
- [ ] 未使用コードの削除
- [ ] ドキュメントの最新化
- [ ] テストカバレッジの確認・改善