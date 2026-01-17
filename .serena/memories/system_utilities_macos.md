# macOS（Darwin）システムユーティリティ

## ファイルシステム操作

### ディレクトリナビゲーション
```bash
# カレントディレクトリ表示
pwd

# ディレクトリ移動
cd /path/to/directory
cd ~                    # ホームディレクトリ
cd -                    # 前のディレクトリ
cd ..                   # 親ディレクトリ

# ディレクトリスタック（複数ディレクトリ間移動）
pushd /path/to/dir      # 移動してスタックに保存
popd                    # スタックから前のディレクトリに戻る
dirs                    # スタック一覧表示
```

### ファイル・ディレクトリ一覧
```bash
# 基本一覧
ls
ls -l                   # 詳細表示
ls -la                  # 隠しファイル含む詳細表示
ls -lh                  # 人間が読みやすいサイズ表示
ls -lt                  # 更新日時順
ls -lS                  # ファイルサイズ順

# ツリー表示（treeコマンドが必要な場合）
tree
tree -L 2               # 深さ2まで
tree -I 'node_modules'  # 除外パターン
```

### ファイル検索
```bash
# 名前で検索
find . -name "*.ts"
find . -name "package.json"
find . -type f -name "*.sol"  # ファイルのみ
find . -type d -name "node_modules"  # ディレクトリのみ

# 最近変更されたファイル
find . -mtime -1        # 過去24時間
find . -mtime -7        # 過去7日間

# ファイルサイズで検索
find . -size +1M        # 1MB以上
find . -size -100k      # 100KB未満

# 検索と実行を組み合わせ
find . -name "*.log" -delete
find . -name "*.ts" -exec grep "TODO" {} \;
```

### パターン検索
```bash
# 基本grep
grep "pattern" file.txt
grep -r "pattern" .     # 再帰的検索
grep -i "pattern" file  # 大文字小文字無視
grep -n "pattern" file  # 行番号表示
grep -v "pattern" file  # パターンを含まない行

# 複数パターン
grep -E "pattern1|pattern2" file
grep -e "pattern1" -e "pattern2" file

# コンテキスト表示
grep -C 3 "pattern" file  # 前後3行
grep -A 3 "pattern" file  # 後3行
grep -B 3 "pattern" file  # 前3行

# ファイル名のみ表示
grep -rl "pattern" .

# 除外パターン
grep -r "pattern" --exclude="*.log" .
grep -r "pattern" --exclude-dir="node_modules" .
```

### ファイル操作
```bash
# コピー
cp file.txt backup.txt
cp -r dir/ backup/      # ディレクトリごと

# 移動・リネーム
mv old.txt new.txt
mv file.txt /path/to/destination/

# 削除
rm file.txt
rm -r directory/        # ディレクトリごと
rm -rf directory/       # 強制削除（注意！）

# ディレクトリ作成
mkdir new_dir
mkdir -p path/to/deep/dir  # 親ディレクトリも作成

# シンボリックリンク
ln -s /original/path /link/path
```

### ファイル内容表示
```bash
# 全体表示
cat file.txt

# ページング
less file.txt           # スクロール可能
more file.txt

# 先頭・末尾
head file.txt           # 先頭10行
head -n 20 file.txt     # 先頭20行
tail file.txt           # 末尾10行
tail -f file.log        # リアルタイム監視

# 行数カウント
wc -l file.txt          # 行数
wc -w file.txt          # 単語数
wc -c file.txt          # バイト数
```

## プロセス管理

### プロセス確認
```bash
# 全プロセス
ps aux
ps aux | grep node      # 特定プロセス検索

# プロセスツリー
pstree
pstree -p               # PID表示

# トップコマンド（リアルタイム監視）
top
top -o cpu              # CPU使用率順
top -o mem              # メモリ使用量順

# プロセス検索
pgrep node              # PIDのみ
pgrep -l node           # 名前も表示
```

### プロセス制御
```bash
# プロセス終了
kill <pid>
kill -9 <pid>           # 強制終了（SIGKILL）
kill -15 <pid>          # 通常終了（SIGTERM）

# 名前でプロセス終了
pkill node
killall node

# バックグラウンドジョブ
./script.sh &           # バックグラウンド実行
jobs                    # ジョブ一覧
fg %1                   # フォアグラウンドに戻す
bg %1                   # バックグラウンド続行
Ctrl+Z                  # 一時停止
```

### ポート・ネットワーク
```bash
# ポート使用状況
lsof -i :3000           # ポート3000
lsof -i -P              # すべてのネットワーク接続

# ネットワーク統計
netstat -an             # すべての接続
netstat -an | grep LISTEN  # リスニングポート

# プロセスとポートの関連
lsof -i -P | grep LISTEN
```

## テキスト処理

### awk
```bash
# カラム抽出
ps aux | awk '{print $1, $2}'  # 1列目と2列目

# 条件フィルタ
awk '$3 > 50' file.txt  # 3列目が50より大きい

# 合計計算
awk '{sum += $1} END {print sum}' file.txt
```

### sed
```bash
# 置換
sed 's/old/new/' file.txt           # 最初のマッチ
sed 's/old/new/g' file.txt          # すべてのマッチ
sed -i '' 's/old/new/g' file.txt    # ファイル直接編集（macOS）

# 行削除
sed '3d' file.txt               # 3行目削除
sed '/pattern/d' file.txt       # パターンマッチ行削除

# 行抽出
sed -n '1,10p' file.txt         # 1-10行目表示
```

### cut
```bash
# デリミタでカラム抽出
cut -d ',' -f 1,3 file.csv      # CSV 1列目と3列目
cut -d ':' -f 1 /etc/passwd     # コロン区切り

# 文字位置で抽出
cut -c 1-10 file.txt            # 1-10文字目
```

### sort & uniq
```bash
# ソート
sort file.txt
sort -r file.txt                # 逆順
sort -n file.txt                # 数値順
sort -k 2 file.txt              # 2列目でソート

# 重複除去
uniq file.txt
sort file.txt | uniq            # ソートと組み合わせ
sort file.txt | uniq -c         # 出現回数カウント
```

## ディスク・システム情報

### ディスク使用量
```bash
# ディスク全体
df -h                           # 人間が読みやすい形式

# ディレクトリサイズ
du -sh directory/               # 合計サイズ
du -sh *                        # 各項目のサイズ
du -h --max-depth=1 .           # 1階層分のサイズ
```

### システム情報
```bash
# OS情報
uname -a                        # すべての情報
uname -s                        # カーネル名（Darwin）
uname -r                        # カーネルバージョン
uname -m                        # アーキテクチャ

# macOSバージョン
sw_vers

# CPU情報
sysctl -n machdep.cpu.brand_string
sysctl hw.ncpu                  # CPU数

# メモリ情報
sysctl hw.memsize               # 物理メモリ
```

## 環境変数

### 設定・表示
```bash
# 環境変数表示
env
printenv
echo $PATH

# 環境変数設定（一時）
export VAR_NAME="value"

# 環境変数設定（永続・zsh）
echo 'export VAR_NAME="value"' >> ~/.zshrc
source ~/.zshrc
```

## パイプとリダイレクト

### パイプ
```bash
# コマンドチェーン
ls -l | grep ".ts" | wc -l      # TSファイル数

# xargs（引数として渡す）
find . -name "*.log" | xargs rm
find . -name "*.ts" | xargs grep "TODO"
```

### リダイレクト
```bash
# 出力をファイルへ
command > output.txt            # 上書き
command >> output.txt           # 追記

# エラーをファイルへ
command 2> error.txt            # エラーのみ
command > output.txt 2>&1       # 標準出力とエラー両方
command &> all.txt              # 同上（短縮形）

# 入力をファイルから
command < input.txt

# 出力を破棄
command > /dev/null
command &> /dev/null            # エラーも破棄
```

## 圧縮・アーカイブ

### tar
```bash
# 作成
tar -czf archive.tar.gz directory/  # gzip圧縮
tar -cjf archive.tar.bz2 directory/ # bzip2圧縮

# 展開
tar -xzf archive.tar.gz
tar -xjf archive.tar.bz2

# 内容確認
tar -tzf archive.tar.gz
```

### zip
```bash
# 作成
zip -r archive.zip directory/

# 展開
unzip archive.zip
unzip -l archive.zip            # 内容確認
```

## 権限管理

### 権限変更
```bash
# chmod（数値）
chmod 755 script.sh             # rwxr-xr-x
chmod 644 file.txt              # rw-r--r--

# chmod（記号）
chmod +x script.sh              # 実行権限追加
chmod -w file.txt               # 書き込み権限削除

# 所有者変更
chown user:group file.txt
chown -R user:group directory/
```

## その他便利コマンド

### コマンド履歴
```bash
# 履歴表示
history

# 履歴検索
history | grep "git"
Ctrl+R                          # インクリメンタル検索

# 履歴実行
!123                            # 123番のコマンド実行
!!                              # 直前のコマンド実行
!$                              # 直前のコマンドの最後の引数
```

### エイリアス
```bash
# エイリアス作成
alias ll='ls -la'
alias g='git'

# 永続化（~/.zshrc）
echo "alias ll='ls -la'" >> ~/.zshrc
source ~/.zshrc

# エイリアス一覧
alias
```

### その他
```bash
# コマンドの場所
which node
which pnpm

# コマンドのタイプ
type cd                         # builtin
type ls                         # alias or command

# 日付・時刻
date
date "+%Y-%m-%d %H:%M:%S"

# カレンダー
cal
cal 2026

# 計算
bc
echo "2+2" | bc
```

## macOS固有

### Homebrew
```bash
# パッケージ管理
brew install <package>
brew uninstall <package>
brew update
brew upgrade
brew list
brew search <package>
```

### Spotlight検索（CLI）
```bash
mdfind "query"
mdfind -name "file.txt"
```

### ファイルオープン
```bash
open file.txt                   # デフォルトアプリで開く
open -a "Visual Studio Code" .  # アプリ指定
open .                          # Finderで開く
```