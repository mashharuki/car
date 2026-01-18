"use client";

/**
 * ウォレットページ（ダミー）
 *
 * @description
 * ウォレット機能のプレースホルダーページ。
 * 将来の機能実装に向けたUIデザインのみを表示。
 *
 * @see Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DecryptedText from "@/components/ui/react-bits/DecryptedText";
import ShinyText from "@/components/ui/react-bits/ShinyText";
import { cn } from "@/lib/utils";
import { useWallet } from "@/lib/wallet/wallet-context";
import { ArrowDownLeft, ArrowUpRight, Clock, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { formatEther } from "viem";

// ============================================================================
// ダミーデータ
// ============================================================================

const BLOCKSCOUT_BASE_URL =
  process.env.NEXT_PUBLIC_BLOCKSCOUT_BASE_URL ||
  "https://base-sepolia.blockscout.com";

type BlockscoutTransaction = {
  hash: string;
  timestamp: string;
  from: { hash: string };
  to: { hash: string } | null;
  value: string;
};

type WalletTransaction = {
  id: string;
  type: "receive" | "send";
  amount: string;
  description: string;
  time: string;
};

// ============================================================================
// コンポーネント
// ============================================================================

export default function WalletPage() {
  const {
    owner,
    accountAddress,
    balance,
    tokenBalance,
    tokenSymbol,
    refreshBalance,
    status,
  } = useWallet();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  useEffect(() => {
    if (owner || accountAddress) {
      refreshBalance();
    }
  }, [owner, accountAddress, refreshBalance]);

  useEffect(() => {
    const targetAddress = accountAddress || owner;
    if (!targetAddress) {
      setTransactions([]);
      return;
    }

    const fetchTransactions = async () => {
      setIsLoadingTx(true);
      setTxError(null);
      try {
        const query = new URLSearchParams({
          filter: "to | from",
        });
        const url = `${BLOCKSCOUT_BASE_URL}/api/v2/addresses/${targetAddress}/transactions`;
        // API実行
        const response = await fetch(url, {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        });

        console.log("url:", url);

        if (!response.ok) {
          throw new Error("トランザクションの取得に失敗しました");
        }

        const data = (await response.json()) as {
          items?: BlockscoutTransaction[];
        };

        const normalizedAddress = targetAddress.toLowerCase();
        const items = data.items ?? [];
        const mapped = items.map((tx) => {
          const toAddress = tx.to?.hash?.toLowerCase() || "";
          const fromAddress = tx.from?.hash?.toLowerCase() || "";
          const isReceive = toAddress === normalizedAddress;
          const ethValue = formatEther(BigInt(tx.value));
          const sign = isReceive ? "+" : "-";
          const description = isReceive
            ? "受け取り"
            : "送信";

          return {
            id: tx.hash,
            type: isReceive ? "receive" : "send",
            amount: `${sign}${ethValue} ETH`,
            description,
            time: new Date(tx.timestamp).toLocaleString("ja-JP"),
          };
        });

        setTransactions(mapped);
      } catch (error) {
        setTxError(
          error instanceof Error ? error.message : "取得に失敗しました",
        );
      } finally {
        setIsLoadingTx(false);
      }
    };

    fetchTransactions();
  }, [accountAddress, owner]);

  const displayBalance = balance ? `${balance} ETH` : "0.00 ETH";
  const displayTokenBalance = tokenBalance
    ? `${tokenBalance} ${tokenSymbol || ""}`.trim()
    : `0.00 ${tokenSymbol || "CVTT"}`;
  const hasTransactions = transactions.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header
        title={
          <DecryptedText
            text="ウォレット"
            animateOn="view"
            speed={100}
            className="font-bold text-xl text-primary"
          />
        }
      />

      <main className="flex-1 flex flex-col px-4 pb-20">
        {/* 接続ステータス */}
        <div className="flex justify-center mt-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
            <Clock className="h-4 w-4" />
            {status === "connecting"
              ? "接続中"
              : owner
              ? "接続済み"
              : "未接続"}
          </span>
        </div>

        {/* 残高カード */}
        <Card className="mt-6 border-primary/50 bg-black/60 backdrop-blur-xl relative overflow-hidden group">
          {/* Ambient Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

          <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/20 rounded-lg box-glow">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <span className="text-muted-foreground text-sm font-bold">
                CarWallet 残高
              </span>
            </div>
            <div className="mb-2">
              <ShinyText text={displayBalance} className="text-4xl font-bold" />
            </div>
            <p className="text-sm text-muted-foreground">
              <ShinyText text={displayTokenBalance} className="text-4xl font-bold" />
            </p>
            <p className="text-muted-foreground/80 text-sm">
              <DecryptedText
                text={
                  accountAddress
                    ? "CarWalletの残高を表示しています"
                    : "ウォレットを作成すると残高が表示されます"
                }
                speed={50}
                animateOn="view"
              />
            </p>
            {accountAddress && (
              <p className="mt-3 text-xs text-muted-foreground break-all">
                Wallet: {accountAddress}
              </p>
            )}
          </CardContent>
        </Card>

        {/* アクションボタン */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            disabled
            className="h-auto flex-col gap-2 p-4 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="p-3 bg-green-500/10 rounded-full">
              <ArrowDownLeft className="h-5 w-5 text-green-500" />
            </div>
            <span className="text-sm font-medium">受け取る</span>
          </Button>
          <Button
            variant="outline"
            disabled
            className="h-auto flex-col gap-2 p-4 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="p-3 bg-blue-500/10 rounded-full">
              <ArrowUpRight className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-sm font-medium">送る</span>
          </Button>
        </div>

        {/* 取引履歴 */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full box-glow" />
            取引履歴
          </h3>
          {isLoadingTx && (
            <div className="rounded-xl border border-border/50 bg-card/30 p-6 text-center text-sm text-muted-foreground">
              取引履歴を取得しています...
            </div>
          )}
          {txError && (
            <div className="rounded-xl border border-red-200/40 bg-red-500/10 p-6 text-center text-sm text-red-200">
              {txError}
            </div>
          )}
          {!isLoadingTx && !txError && !hasTransactions && (
            <div className="rounded-xl border border-border/50 bg-card/30 p-6 text-center text-sm text-muted-foreground">
              まだ取引履歴がありません
            </div>
          )}
          {hasTransactions && (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <Card
                  key={tx.id}
                  className="flex items-center gap-4 p-4 border-border/50 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors"
                >
                  <div
                    className={cn(
                      "p-2 rounded-full",
                      tx.type === "receive"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-blue-500/10 text-blue-500",
                    )}
                  >
                    {tx.type === "receive" ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {tx.description}
                    </p>
                    <p className="text-xs text-muted-foreground">{tx.time}</p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      tx.type === "receive"
                        ? "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                        : "text-foreground",
                    )}
                  >
                    {tx.amount}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 補足メッセージ */}
        <div className="mt-8 p-4 bg-muted/20 border border-muted/30 rounded-xl text-center">
          <p className="text-sm text-muted-foreground">
            <DecryptedText
              text="Base Sepoliaネットワークの残高を表示しています。"
              speed={30}
              animateOn="view"
            />
          </p>
        </div>
      </main>
    </div>
  );
}
