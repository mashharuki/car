/**
 * ローディングコンポーネントのテスト
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InlineLoading } from "../inline-loading";
import { LoadingOverlay } from "../loading-overlay";
import { LoadingSpinner } from "../loading-spinner";

describe("LoadingSpinner", () => {
  it("デフォルトでレンダリングされる", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute("aria-label", "読み込み中");
  });

  it("ラベル付きでレンダリングされる", () => {
    render(<LoadingSpinner label="データを読み込んでいます..." />);
    expect(screen.getByText("データを読み込んでいます...")).toBeInTheDocument();
  });

  it("サイズが適用される", () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    let spinner = screen.getByRole("status");
    expect(spinner).toHaveClass("h-4", "w-4");

    rerender(<LoadingSpinner size="xl" />);
    spinner = screen.getByRole("status");
    expect(spinner).toHaveClass("h-16", "w-16");
  });
});

describe("LoadingOverlay", () => {
  it("isLoading=falseの場合は表示されない", () => {
    render(<LoadingOverlay isLoading={false} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("isLoading=trueの場合は表示される", () => {
    render(<LoadingOverlay isLoading={true} />);
    // role="status"が複数あるのでgetAllByRoleを使用
    const statuses = screen.getAllByRole("status");
    expect(statuses.length).toBeGreaterThan(0);
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  it("カスタムメッセージが表示される", () => {
    render(<LoadingOverlay isLoading={true} message="データを取得しています..." />);
    expect(screen.getByText("データを取得しています...")).toBeInTheDocument();
  });

  it("全画面表示の場合はfixedクラスが適用される", () => {
    const { container } = render(<LoadingOverlay isLoading={true} fullScreen={true} />);
    const overlay = container.querySelector(".fixed");
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass("fixed", "inset-0");
  });

  it("全画面表示でない場合はabsoluteクラスが適用される", () => {
    const { container } = render(<LoadingOverlay isLoading={true} fullScreen={false} />);
    const overlay = container.querySelector(".absolute");
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass("absolute", "inset-0");
  });
});

describe("InlineLoading", () => {
  it("ローディング中でない場合は通常のテキストが表示される", () => {
    render(<InlineLoading isLoading={false} text="送信" />);
    expect(screen.getByText("送信")).toBeInTheDocument();
  });

  it("ローディング中の場合はローディングテキストが表示される", () => {
    render(<InlineLoading isLoading={true} loadingText="送信中..." text="送信" />);
    expect(screen.getByText("送信中...")).toBeInTheDocument();
    expect(screen.queryByText("送信")).not.toBeInTheDocument();
  });

  it("textが指定されていない場合", () => {
    const { container } = render(<InlineLoading isLoading={false} />);
    // textがundefinedでも正常にレンダリングされる
    expect(container.querySelector("span")).toBeInTheDocument();
  });

  it("ローディング中にアイコンが表示される", () => {
    const { container } = render(<InlineLoading isLoading={true} />);
    // lucide-reactのLoader2アイコンはsvg要素として描画される
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("animate-spin");
  });
});
