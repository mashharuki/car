/**
 * ローディングオーバーレイコンポーネント
 *
 * @description
 * 画面全体またはコンテナ上に表示される半透明のオーバーレイ付きローディング表示。
 * API呼び出し中などにユーザーのアクションを一時的にブロックするために使用。
 */

import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./loading-spinner";

interface LoadingOverlayProps {
  /** ローディング状態かどうか */
  isLoading: boolean;
  /** ローディングメッセージ */
  message?: string;
  /** 全画面表示するかどうか */
  fullScreen?: boolean;
  /** カスタムクラス名 */
  className?: string;
  /** スピナーのサイズ */
  spinnerSize?: "sm" | "md" | "lg" | "xl";
}

/**
 * ローディングオーバーレイ
 *
 * @example
 * ```tsx
 * <LoadingOverlay
 *   isLoading={isLoading}
 *   message="データを取得中..."
 *   fullScreen={true}
 * />
 * ```
 */
export function LoadingOverlay({
  isLoading,
  message = "読み込み中...",
  fullScreen = false,
  className,
  spinnerSize = "lg",
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-black/20 backdrop-blur-sm z-50",
        fullScreen ? "fixed inset-0" : "absolute inset-0 rounded-lg",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4 rounded-lg bg-white dark:bg-gray-800 px-8 py-6 shadow-xl">
        <LoadingSpinner size={spinnerSize} />
        <p className="text-base font-medium text-gray-700 dark:text-gray-200">{message}</p>
      </div>
    </div>
  );
}
