import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../App";
import { builtInExperts } from "../data/expertPresets";

describe("app smoke", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the usable tool surface on the first screen", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "多专家圆桌" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "推荐 Top 3" })).toBeInTheDocument();
    expect(screen.getByText(`${builtInExperts.length} 个专家`)).toBeInTheDocument();
    expect(screen.getByText("本地目录")).toBeInTheDocument();
  });
});
