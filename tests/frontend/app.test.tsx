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

  it("provides one guided setup workflow without duplicate linked editors", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("tab", { name: "Model Setup" }));

    expect(screen.getAllByRole("group", { name: "Reference/comparison linking" })).toHaveLength(1);
    expect(screen.getAllByLabelText("Air circuit")).toHaveLength(1);
    const comparison = screen.getByRole("region", { name: "Polyamide (PA)" });
    expect(within(comparison).queryByLabelText("Geometry representation")).not.toBeInTheDocument();

    const geometryNotice = within(comparison).getByRole("region", {
      name: "Geometry & design point linked",
    });
    await user.click(within(geometryNotice).getByRole("button", { name: "Edit separately" }));
    expect(within(comparison).getByLabelText("Geometry representation")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Continue to materials & fluids" }));
    expect(screen.getByRole("heading", { name: "Materials & fluids" })).toBeVisible();
    const comparisonProperties = screen.getByRole("region", { name: "Polyamide (PA)" });
    expect(within(comparisonProperties).getByLabelText("Material name")).toBeVisible();
    expect(
      within(comparisonProperties).queryByLabelText("Air property set"),
    ).not.toBeInTheDocument();
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
