import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import type { SimulationRequest } from "../../src/contracts/generated/simulation-request";
import { plotRegistry } from "../../src/features/plots/plotRegistry";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const defaultsJson = JSON.parse(
  readFileSync(path.join(repoRoot, "src", "contracts", "defaults.json"), "utf8"),
) as { request: SimulationRequest };
const defaultsRequest = defaultsJson.request;

test("runs a reduced paper-default workflow and exports figures plus JSON/HTML reports", async ({
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

  const figure = page.locator(".plot-figure").first();
  await figure.getByLabel("PNG scale").selectOption("1");
  const [pngDownload] = await Promise.all([
    page.waitForEvent("download"),
    figure.getByRole("button", { exact: true, name: "PNG" }).click(),
  ]);
  expect(pngDownload.suggestedFilename()).toBe("overall-coefficient-map-cooler_left.png");
  const pngPath = await pngDownload.path();
  if (!pngPath) throw new Error("PNG figure download path was not available.");
  const png = readFileSync(pngPath);
  expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
  expect(png.readUInt32BE(16)).toBe(624);
  expect(png.readUInt32BE(20)).toBe(499);

  const [svgDownload] = await Promise.all([
    page.waitForEvent("download"),
    figure.getByRole("button", { exact: true, name: "SVG" }).click(),
  ]);
  expect(svgDownload.suggestedFilename()).toBe("overall-coefficient-map-cooler_left.svg");
  const svgPath = await svgDownload.path();
  if (!svgPath) throw new Error("SVG figure download path was not available.");
  const svg = readFileSync(svgPath, "utf8");
  expect(svg).toMatch(/<svg[^>]+width="624"[^>]+height="499"/);

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

test("renders every registered plot without Plotly runtime errors", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto(stateUrl("result-plots", reducedDefaultRequest()), { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Run simulation" }).click();
  await expect(page.getByText(/^Computed \d+ numeric fields\.$/)).toBeVisible({ timeout: 120_000 });

  for (const plot of plotRegistry) {
    await page.locator("#plot-id").selectOption(plot.id);
    await expect(page.locator(".plot-figure__title")).toContainText(plot.title);
    await expect(
      page.locator(".plot-figure__canvas .main-svg").first(),
      `Plotly SVG for ${plot.id}`,
    ).toBeVisible({ timeout: 15_000 });
    if (
      [
        "overall-coefficient-map",
        "tech-adjusted-delta-ka",
        "design-boundary-lines",
        "resistance-shares-grid",
      ].includes(plot.id)
    ) {
      await page
        .locator(".plot-figure")
        .first()
        .screenshot({
          path: testInfo.outputPath(`${plot.id}.png`),
        });
    }
  }
  expect(consoleErrors).toEqual([]);
});

test("supports keyboard tab navigation, URL round-trips, and reset to defaults", async ({
  page,
}) => {
  await page.goto("./", { waitUntil: "networkidle" });

  await page.getByRole("tab", { name: "Start" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Model Setup" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

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
  await page.getByRole("tab", { name: "Model Setup" }).click();
  await expect(
    page
      .getByRole("region", { name: "Aluminum" })
      .getByLabel("Package width (transverse)", { exact: true }),
  ).toHaveValue("98.4");
});

test("uses five model-setup categories and preserves the legacy materials route", async ({
  page,
}, testInfo) => {
  await page.goto("./#/materials", { waitUntil: "networkidle" });
  await expect(page.getByRole("tab", { name: "Model Setup" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect.poll(() => new URL(page.url()).hash).toBe("#/input");
  const categoryTabs = page.getByRole("tablist", { name: "Model setup categories" });
  await expect(categoryTabs.getByRole("tab")).toHaveText([
    "Geometry",
    "Solid material",
    "Air circuit",
    "Coolant circuit",
    "Screens & boundaries",
  ]);

  await page.getByRole("button", { name: "Comparison" }).click();
  let comparison = page.getByRole("region", { name: "Polyamide (PA)" });
  await expect(comparison.getByLabel("Geometry representation")).toHaveCount(0);
  await expect(comparison.getByText("Geometry is linked")).toBeVisible();
  await page.getByRole("tabpanel", { name: "Geometry" }).screenshot({
    path: testInfo.outputPath("model-setup-geometry.png"),
  });

  await page.getByRole("button", { name: "Separate values" }).click();
  await expect(comparison.getByLabel("Geometry representation")).toBeVisible();

  await page.getByRole("tab", { name: "Solid material" }).click();
  comparison = page.getByRole("region", { name: "Polyamide (PA)" });
  await expect(comparison.getByLabel("Material name")).toBeVisible();
  await page.getByRole("tabpanel", { name: "Solid material" }).screenshot({
    path: testInfo.outputPath("model-setup-solid-material.png"),
  });

  await page.getByRole("tab", { name: "Air circuit" }).click();
  await page.getByRole("button", { name: "Reference" }).click();
  const reference = page.getByRole("region", { name: "Aluminum" });
  await expect(reference.getByLabel("Air operating mode")).toBeVisible();
  await expect(reference.getByLabel("Air property set")).toBeVisible();

  await page.getByRole("tab", { name: "Screens & boundaries" }).click();
  await expect(page.getByRole("heading", { name: "Shared sweep grid" })).toBeVisible();

  await page.getByRole("button", { name: "Continue to results" }).click();
  await expect(page.getByRole("tab", { name: "Results" })).toHaveAttribute("aria-selected", "true");
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
  await expect(page.getByRole("tabpanel", { name: "Model Setup" })).toBeVisible();
  await expect(page.getByRole("tablist", { name: "Model setup categories" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Visible design" })).toBeVisible();
  await expect(page.getByRole("group", { name: "geometry value relationship" })).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Geometry and design point" }).first(),
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "Aluminum" })).toBeVisible();

  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await expect(page.getByLabel("Reference design")).toBeVisible();
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
