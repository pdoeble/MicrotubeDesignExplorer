import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import type { SimulationRequest } from "../../src/contracts/generated/simulation-request";
import { isCompositePlot } from "../../src/features/plots/compositePlotSpec";
import { plotRegistry, type PlotId } from "../../src/features/plots/plotRegistry";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const defaultsJson = JSON.parse(
  readFileSync(path.join(repoRoot, "src", "contracts", "defaults.json"), "utf8"),
) as { request: SimulationRequest };

test("visually audits every plot and material at paper-default resolution", async ({
  page,
}, testInfo) => {
  test.skip(
    process.env.PLOT_VISUAL_AUDIT !== "1",
    "Set PLOT_VISUAL_AUDIT=1 for the exhaustive 250×250 screenshot and collision audit.",
  );
  test.setTimeout(600_000);
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto(stateUrl("result-plots", defaultsJson.request), { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Run simulation" }).click();
  await expect(page.getByText(/^Computed \d+ numeric fields\.$/)).toBeVisible({ timeout: 180_000 });

  const requestedPlots = new Set(
    (process.env.PLOT_VISUAL_AUDIT_FILTER ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  const plots = requestedPlots.size
    ? plotRegistry.filter((plot) => requestedPlots.has(plot.id))
    : plotRegistry;
  const reports: VisualReport[] = [];
  for (const plot of plots) {
    await page.locator("#plot-id").selectOption(plot.id);
    await expect(page.locator(".plot-figure__title").first()).toContainText(plot.title);
    if (plot.source === "comparison" || isCompositePlot(plot.id)) {
      reports.push(await captureVariant(page, testInfo, plot.id, "comparison-or-composite"));
      continue;
    }
    await page.locator("#plot-display").selectOption("single");
    for (const cooler of ["cooler_left", "cooler_right"] as const) {
      await page.locator("#plot-cooler").selectOption(cooler);
      reports.push(await captureVariant(page, testInfo, plot.id, cooler));
    }
    if (plot.id === "overall-coefficient-map" || plot.id === "bundle-conductance-map") {
      await page.locator("#plot-display").selectOption("tandem");
      reports.push(await captureVariant(page, testInfo, plot.id, "tandem"));
    }
  }

  await testInfo.attach("plot-visual-audit.json", {
    body: JSON.stringify(reports, null, 2),
    contentType: "application/json",
  });
  const collisions = reports.flatMap((report) =>
    report.collisions.map((message) => `${report.plotId}/${report.scope}: ${message}`),
  );
  const clippedText = reports.flatMap((report) =>
    report.clippedText.map((message) => `${report.plotId}/${report.scope}: ${message}`),
  );
  expect(collisions, JSON.stringify(collisions, null, 2)).toEqual([]);
  expect(clippedText, JSON.stringify(clippedText, null, 2)).toEqual([]);
});

type VisualReport = {
  collisions: string[];
  clippedText: string[];
  plotId: PlotId;
  scope: string;
};

async function captureVariant(
  page: Page,
  testInfo: TestInfo,
  plotId: PlotId,
  scope: string,
): Promise<VisualReport> {
  const frames = page.locator(".plot-figure__frame");
  await expect(frames.first().locator(".main-svg").first()).toBeVisible({ timeout: 20_000 });
  // React removes the previous Plotly tree before the new spec is mounted;
  // two animation frames plus a short image-paint allowance make Plotly's
  // rasterized heatmap layer deterministic before capture.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.waitForTimeout(200);
  const safeScope = scope.replace(/[^a-z0-9-]+/gi, "-");
  if (scope === "tandem" && (await page.locator(".plot-tandem-grid").count()) > 0) {
    await page.locator(".plot-tandem-grid").screenshot({
      path: testInfo.outputPath(`${plotId}--${safeScope}.png`),
    });
  } else {
    await frames.first().screenshot({ path: testInfo.outputPath(`${plotId}--${safeScope}.png`) });
  }

  const geometry = await frames.evaluateAll((elements) => {
    const intersectionArea = (left: DOMRect, right: DOMRect) =>
      Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left)) *
      Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
    const visible = (element: Element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const collisions: string[] = [];
    const clippedText: string[] = [];
    for (const [frameIndex, frame] of elements.entries()) {
      const frameRect = frame.getBoundingClientRect();
      const allTexts = Array.from(frame.querySelectorAll("svg text"))
        .filter(visible)
        .map((element) => ({
          element,
          rect: element.getBoundingClientRect(),
          text: element.textContent?.trim() ?? "",
        }))
        .filter((entry) => entry.text.length > 0);
      const collisionTexts = Array.from(frame.querySelectorAll("g.annotation text, g.cbaxis text"))
        .filter(visible)
        .map((element) => ({
          rect: element.getBoundingClientRect(),
          text: element.textContent?.trim() ?? "",
        }))
        .filter((entry) => entry.text.length > 0);
      const bars = Array.from(
        frame.querySelectorAll(
          "g.colorbar rect.cbfill, g.colorbar path.cbfill, g.colorbar .cbfill rect",
        ),
      ).filter(visible);
      for (const text of allTexts) {
        if (
          text.rect.left < frameRect.left - 1 ||
          text.rect.right > frameRect.right + 1 ||
          text.rect.top < frameRect.top - 1 ||
          text.rect.bottom > frameRect.bottom + 1
        )
          clippedText.push(`frame ${frameIndex}: ${text.text}`);
      }
      for (const text of collisionTexts) {
        for (const bar of bars) {
          if (intersectionArea(text.rect, bar.getBoundingClientRect()) > 1)
            collisions.push(`frame ${frameIndex}: colorbar intersects "${text.text}"`);
        }
      }
      for (let leftIndex = 0; leftIndex < collisionTexts.length; leftIndex += 1) {
        const left = collisionTexts[leftIndex]!;
        for (let rightIndex = leftIndex + 1; rightIndex < collisionTexts.length; rightIndex += 1) {
          const right = collisionTexts[rightIndex]!;
          const overlap = intersectionArea(left.rect, right.rect);
          const smallerArea = Math.min(
            left.rect.width * left.rect.height,
            right.rect.width * right.rect.height,
          );
          if (smallerArea > 0 && overlap / smallerArea > 0.08)
            collisions.push(`frame ${frameIndex}: text "${left.text}" intersects "${right.text}"`);
        }
      }
    }
    return { collisions, clippedText };
  });
  return { ...geometry, plotId, scope };
}

function stateUrl(tab: string, request: SimulationRequest): string {
  const payload = JSON.stringify({ request, version: "1.0.0" });
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `?state=${encoded}#/${tab}`;
}
