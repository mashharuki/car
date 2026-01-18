/**
 * ローディングスピナーコンポーネント
 *
 * @description
 * API呼び出しやデータ取得時に表示する汎用的なローディングスピナー。
 * サイズとカラーのカスタマイズが可能。
 */

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  /** スピナーのサイズ */
  size?: "sm" | "md" | "lg" | "xl";
  /** スピナーの色 */
  className?: string;
  /** ラベルテキスト */
  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
  xl: "h-16 w-16 border-4",
};

/**
 * ローディングスピナー
 *
 * @example
 * ```tsx
 * <LoadingSpinner size="md" label="読み込み中..." />
 * ```
 */
export function LoadingSpinner({ size = "md", className, label }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        className={cn(
          "animate-spin rounded-full border-solid border-gray-300 border-t-blue-600",
          sizeClasses[size],
          className,
        )}
        role="status"
        aria-label="読み込み中"
      />
      {label && <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>}
    </div>
  );
}
