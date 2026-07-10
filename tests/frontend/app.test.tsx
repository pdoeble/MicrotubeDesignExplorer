import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../src/App";

describe("App shell", () => {
  it("renders the five fixed tabs with correct ARIA semantics", () => {
    render(<App />);
    const tablist = screen.getByRole("tablist", { name: "Main sections" });
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual([
      "Start",
      "Input",
      "Materials",
      "Result Plots",
      "Settings",
    ]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
  });

  it("activates tabs with arrow keys (roving tabindex)", async () => {
    const user = userEvent.setup();
    render(<App />);
    const startTab = screen.getByRole("tab", { name: "Start" });
    startTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Input" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveAttribute("aria-selected", "true");
  });
});
