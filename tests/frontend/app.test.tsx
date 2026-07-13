import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../src/App";
import { useSimulationStore } from "../../src/state/simulationStore";

describe("App shell", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    useSimulationStore.getState().resetAll();
  });

  it("renders the four workflow tabs with correct ARIA semantics", () => {
    render(<App />);
    const tablist = screen.getByRole("tablist", { name: "Main sections" });
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Start", "Model Setup", "Results", "Settings"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
  });

  it("activates tabs with arrow keys (roving tabindex)", async () => {
    const user = userEvent.setup();
    render(<App />);
    const startTab = screen.getByRole("tab", { name: "Start" });
    startTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Model Setup" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveAttribute("aria-selected", "true");
  });

  it("organizes model setup into five categories with per-category design and link switches", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("tab", { name: "Model Setup" }));

    const categoryTabs = within(
      screen.getByRole("tablist", { name: "Model setup categories" }),
    ).getAllByRole("tab");
    expect(categoryTabs.map((tab) => tab.textContent)).toEqual([
      "Geometry",
      "Solid material",
      "Air circuit",
      "Coolant circuit",
      "Screens & boundaries",
    ]);
    categoryTabs[0]?.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Solid material" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Geometry" })).toHaveAttribute("aria-selected", "true");

    expect(screen.getByRole("button", { name: "Reference" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Same values" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("region", { name: "Aluminum" })).toHaveAccessibleName("Aluminum");

    await user.click(screen.getByRole("button", { name: "Comparison" }));
    let comparison = screen.getByRole("region", { name: "Polyamide (PA)" });
    expect(within(comparison).queryByLabelText("Geometry representation")).not.toBeInTheDocument();
    expect(within(comparison).getByRole("region", { name: "Geometry linked" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Separate values" }));
    comparison = screen.getByRole("region", { name: "Polyamide (PA)" });
    const width = within(comparison).getByLabelText("Package width (transverse)", {
      exact: true,
    });
    await user.clear(width);
    await user.type(width, "120");
    await user.click(screen.getByRole("button", { name: "Same values" }));
    expect(
      within(comparison).queryByLabelText("Package width (transverse)"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Separate values" }));
    expect(
      within(comparison).getByLabelText("Package width (transverse)", { exact: true }),
    ).toHaveValue(120);

    await user.click(screen.getByRole("tab", { name: "Solid material" }));
    comparison = screen.getByRole("region", { name: "Polyamide (PA)" });
    expect(within(comparison).getByLabelText("Material name")).toBeVisible();

    await user.click(screen.getByRole("tab", { name: "Air circuit" }));
    await user.click(screen.getByRole("button", { name: "Reference" }));
    const reference = screen.getByRole("region", { name: "Aluminum" });
    expect(within(reference).getByLabelText("Air operating mode")).toBeVisible();
    expect(within(reference).getByLabelText("Air property set")).toBeVisible();

    await user.click(screen.getByRole("tab", { name: "Screens & boundaries" }));
    expect(screen.getByRole("heading", { name: "Shared sweep grid" })).toBeVisible();
  });

  it("normalizes the legacy materials route to model setup", async () => {
    window.history.replaceState(null, "", "#/materials");
    render(<App />);
    expect(screen.getByRole("tab", { name: "Model Setup" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await waitFor(() => expect(window.location.hash).toBe("#/input"));
  });
});
