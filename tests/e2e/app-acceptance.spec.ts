import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import type { SimulationRequest } from "../../src/contracts/generated/simulation-request";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const defaultsJson = JSON.parse(
  readFileSync(path.join(repoRoot, "src", "contracts", "defaults.json"), "utf8"),
) as { request: SimulationRequest };
const defaultsRequest = defaultsJson.request;

test("runs a reduced paper-default workflow and exports JSON plus HTML reports", async ({
  browserName,
  page,
}) => {
  test.skip(
    browserName === "firefox" && !process.env.PLAYWRIGHT_BASE_URL,
    "Firefox Pyodide startup hangs under the Vite dev server; production preview smoke passes.",
  );
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto(stateUrl("result-plots", reducedDefaultRequest()), { waitUntil: "networkidle" });

  await page.getByRole("button", { name: "Run simulation" }).click();
  await expect(page.getByText(/^Computed \d+ numeric fields\.$/)).toBeVisible({
    timeout: 120_000,
  });
  await expect(page.getByRole("heading", { name: "Design-point summary" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Report exports" })).toBeVisible();
  await expect(page.locator(".plot-figure__canvas")).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "VDI G1/G7 plus wall-conduction resistance aggregation.",
    }),
  ).toBeVisible();

  const [jsonDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "JSON" }).click(),
  ]);
  expect(jsonDownload.suggestedFilename()).toMatch(/^microtube-report-[0-9a-f]{12}\.json$/);
  const jsonPath = await jsonDownload.path();
  if (!jsonPath) throw new Error("JSON report download path was not available.");
  const sidecar = JSON.parse(readFileSync(jsonPath, "utf8")) as Record<string, unknown>;
  expect(sidecar.report_version).toBe("1.0.0");
  expect(Array.isArray(sidecar.array_manifest)).toBe(true);

  const [htmlDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 120_000 }),
    page.getByRole("button", { name: "HTML" }).click(),
  ]);
  expect(htmlDownload.suggestedFilename()).toMatch(/^microtube-report-[0-9a-f]{12}\.html$/);
  const htmlPath = await htmlDownload.path();
  if (!htmlPath) throw new Error("HTML report download path was not available.");
  const html = readFileSync(htmlPath, "utf8");
  expect(html).toContain("<h2>Figures</h2>");
  expect(html).toContain("data:image/svg+xml");
  expect(html).toContain("Canonical sidecar JSON");
  expect(consoleErrors).toEqual([]);
});

test("supports keyboard tab navigation, URL round-trips, and reset to defaults", async ({
  page,
}) => {
  await page.goto("./", { waitUntil: "networkidle" });

  await page.getByRole("tab", { name: "Start" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Input" })).toHaveAttribute("aria-selected", "true");

  const leftCooler = page.getByRole("region", { name: "Aluminum" });
  const widthInput = leftCooler.getByLabel("Package width (transverse)", { exact: true });
  await widthInput.fill("120");
  await expect(widthInput).toHaveValue("120");
  const changedUrl = page.url();
  expect(new URL(changedUrl).searchParams.get("state")).toBeTruthy();

  await page.goto(changedUrl, { waitUntil: "networkidle" });
  await expect(
    page
      .getByRole("region", { name: "Aluminum" })
      .getByLabel("Package width (transverse)", { exact: true }),
  ).toHaveValue("120");

  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Reset to paper defaults" }).click();
  await page.getByRole("tab", { name: "Input" }).click();
  await expect(
    page
      .getByRole("region", { name: "Aluminum" })
      .getByLabel("Package width (transverse)", { exact: true }),
  ).toHaveValue("98.4");
});

test("keeps visible controls labelled, contrasted, and within a mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("./#/input", { waitUntil: "networkidle" });

  const unlabeledControls = await page.evaluate(() => {
    const visible = (element: Element) => {
      const style = window.getComputedStyle(element);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        element.getClientRects().length > 0
      );
    };
    const labelText = (element: Element) => {
      if (element.getAttribute("aria-label")) return element.getAttribute("aria-label");
      const labelledBy = element.getAttribute("aria-labelledby");
      if (labelledBy) {
        return labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent ?? "")
          .join(" ")
          .trim();
      }
      if (element instanceof HTMLButtonElement) return element.textContent?.trim();
      const id = element.getAttribute("id");
      if (id) return document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent?.trim();
      return element.closest("label")?.textContent?.trim();
    };
    return Array.from(document.querySelectorAll("button,input,select,textarea"))
      .filter(visible)
      .filter((element) => !labelText(element))
      .map((element) => element.outerHTML);
  });
  expect(unlabeledControls).toEqual([]);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);

  const minimumContrast = await page.evaluate(() => {
    const parseRgb = (value: string) => {
      const match = value.match(/\d+(\.\d+)?/g)?.map(Number) ?? [0, 0, 0];
      return [match[0] ?? 0, match[1] ?? 0, match[2] ?? 0] as const;
    };
    const relativeLuminance = ([red, green, blue]: readonly number[]) => {
      const channel = (component: number) => {
        const value = component / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
    };
    const contrast = (foreground: string, background: string) => {
      const lighter = Math.max(
        relativeLuminance(parseRgb(foreground)),
        relativeLuminance(parseRgb(background)),
      );
      const darker = Math.min(
        relativeLuminance(parseRgb(foreground)),
        relativeLuminance(parseRgb(background)),
      );
      return (lighter + 0.05) / (darker + 0.05);
    };
    return Math.min(
      ...[
        document.body,
        document.querySelector(".tab--active"),
        document.querySelector(".primary-button"),
      ]
        .filter((element): element is Element => element !== null)
        .map((element) => {
          const style = window.getComputedStyle(element);
          return contrast(style.color, style.backgroundColor);
        }),
    );
  });
  expect(minimumContrast).toBeGreaterThanOrEqual(4.5);
});

test("exposes screen-reader landmarks and reflows under 200 percent text zoom", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("./#/input", { waitUntil: "networkidle" });

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("tablist", { name: "Main sections" })).toBeVisible();
  await expect(page.getByRole("tabpanel", { name: "Input" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Left/right linking" })).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Geometry and design point" }).first(),
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "Aluminum" })).toBeVisible();

  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await expect(page.getByLabel("Cooler label").first()).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("meets the Chromium reference budget for worker startup and reduced sweep", async ({
  browserName,
  page,
}) => {
  test.skip(browserName !== "chromium", "Reference budget is measured on Chromium.");
  await page.goto("./", { waitUntil: "networkidle" });
  const metrics = await page.evaluate(async (request) => {
    const { SimulationWorkerClient } = await import("/src/features/simulation/client.ts");
    const client = new SimulationWorkerClient();
    const start = performance.now();
    await client.initialize();
    const initialized = performance.now();
    const result = await client.compute(request);
    const computed = performance.now();
    client.dispose();
    return {
      arrayCount: result.arrays.length,
      computeMs: computed - initialized,
      startupMs: initialized - start,
      totalMs: computed - start,
    };
  }, reducedDefaultRequest());

  expect(metrics.arrayCount).toBeGreaterThan(0);
  expect(metrics.startupMs).toBeLessThan(60_000);
  expect(metrics.computeMs).toBeLessThan(30_000);
  expect(metrics.totalMs).toBeLessThan(90_000);
});

function reducedDefaultRequest(): SimulationRequest {
  const request = structuredClone(defaultsRequest) as SimulationRequest;
  request.sweep.n_outer_diameter = 16;
  request.sweep.n_wall_thickness = 16;
  return request;
}

function stateUrl(tab: string, request: SimulationRequest): string {
  const payload = JSON.stringify({ request, version: "1.0.0" });
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `?state=${encoded}#/${tab}`;
}
