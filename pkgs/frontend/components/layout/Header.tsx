"use client";

/**
 * ヘッダーコンポーネント
 *
 * @description
 * ページ上部のヘッダー。アプリタイトルとオプションの戻るボタンを表示。
 *
 * @see Requirements 1.1
 */

import ShinyText from "@/components/ui/react-bits/ShinyText";
import { cn } from "@/lib/utils";
import { useWallet } from "@/lib/wallet/wallet-context";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// ============================================================================
// 型定義
// ============================================================================

export interface HeaderProps {
  /** ヘッダータイトル */
  title?: React.ReactNode;
  /** 戻るボタンを表示するか */
  showBackButton?: boolean;
  /** 追加のCSSクラス */
  className?: string;
}

// ============================================================================
// 定数
// ============================================================================

const DEFAULT_TITLE = "CarWallet";

// ============================================================================
// コンポーネント
// ============================================================================

/**
 * ヘッダーコンポーネント
 *
 * @example
 * ```tsx
 * <Header title="ウォレット" showBackButton />
 * ```
 */
export function Header({
  title = DEFAULT_TITLE,
  showBackButton = false,
  className,
}: HeaderProps) {
  const router = useRouter();
  const { owner, status, connect } = useWallet();

  const formatAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  const handleBack = () => {
    router.back();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40",
        "h-14 px-4",
        "flex items-center",
        "bg-background/80 backdrop-blur-md",
        "border-b border-border",
        className,
      )}
    >
      <div className="flex items-center gap-3 w-full max-w-3xl mx-auto">
        {showBackButton && (
          <button
            type="button"
            onClick={handleBack}
            className={cn(
              "flex items-center justify-center",
              "w-10 h-10 -ml-2",
              "rounded-full",
              "text-muted-foreground",
              "hover:bg-accent hover:text-foreground",
              "transition-colors duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
            aria-label="戻る"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        <h1 className="text-lg font-semibold">
          {typeof title === "string" ? (
            <ShinyText text={title} className="font-bold text-xl" />
          ) : (
            title
          )}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          {owner ? (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-600">
              {formatAddress(owner)}
            </span>
          ) : (
            <button
              type="button"
              onClick={connect}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90",
                "transition-colors duration-200",
                "disabled:opacity-60",
              )}
              disabled={status === "connecting"}
            >
              {status === "connecting" ? "接続中..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
