/**
 * インラインローディングコンポーネント
 *
 * @description
 * ボタン内やカード内など、小さなエリアに表示するシンプルなローディング表示。
 * ボタンのsubmit状態などに使用。
 */

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface InlineLoadingProps {
  /** ローディング状態かどうか */
  isLoading: boolean;
  /** 読み込み中のテキスト */
  loadingText?: string;
  /** 通常時のテキスト */
  text?: string;
  /** アイコンサイズ */
  size?: "sm" | "md" | "lg";
  /** カスタムクラス名 */
  className?: string;
}

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

/**
 * インラインローディング
 *
 * @example
 * ```tsx
 * <Button disabled={isLoading}>
 *   <InlineLoading
 *     isLoading={isLoading}
 *     loadingText="送信中..."
 *     text="送信"
 *   />
 * </Button>
 * ```
 */
export function InlineLoading({
  isLoading,
  loadingText = "読み込み中...",
  text,
  size = "md",
  className,
}: InlineLoadingProps) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      {isLoading && <Loader2 className={cn("animate-spin", sizeClasses[size])} />}
      <span>{isLoading ? loadingText : text}</span>
    </span>
  );
}
