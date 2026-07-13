# Plot visual polish — per-plot living checklist

> **Path:** `/plans/260712-plot-visual-polish.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** M8/M9 (review-finding closure), workstream W7 (Plots)
> **Status:** completed
> **Created:** 2026-07-12
> **Last updated:** 2026-07-13
> **Predecessor:** `/plans/260712-plot-fidelity-review.md` (completed)
> **Reference figures:** `source_materials/Waermedurchgang_V10_physical_exports/*.svg|pdf`
> **Reference script:** `source_materials/Waermedurchgang_V10_physical.m` (V10)

---

## 1. Scope (user findings 2026-07-12)

1. **Cross-section sketches distort** unless the HTML container happens to
   match the assumed aspect ratio.
2. **Spacing/typography drift** — margins, titles, colorbars, legends, axes
   not positioned/proportioned like the approved MATLAB figures.
3. **Colormap inexact** — old 60-color SVG-recovered sequence covered only
   ~27–100 % of `slanCM('spectral')`; the deep-red low end was missing.

Out of scope: physics, contracts, golden data, the parallel model-setup UX
work (`/plans/260712-model-setup-ux.md`).

## 2. What was implemented

- **A1 Exact colormap** — `src/features/plots/colormap.ts` now holds the
  exact 256×3 `slanCM('spectral')` table dumped from the local MATLAB R2024b
  (`matlab -batch "writematrix(slanCM('spectral'), ...)"`, CSV in scratchpad
  `slancm_spectral.csv`). Provenance comment in the file. VERIFIED r2/r3.
- **A2 cm-faithful scaled layout** — new `src/features/plots/paperLayout.ts`
  replicates every MATLAB figure geometry in cm (SINGLE_MAP 16.5×13.2,
  BURST_GRID, CAPILLARY_GRID (share-grid panel positions!), SHARES_GRID,
  BUNDLE_KA_PORTRAIT, DESIGN_BOUNDARY, TECH_KA_DELTA 19×17.9 for Fig. 22).
  `paperZoom` scales *every* px quantity (margins, fonts, line widths,
  marker sizes, colorbar thickness) by `containerWidth / referenceWidth`
  (96 dpi ⇒ 37.795 px/cm), so the plot-area aspect is invariant and sketch
  circles stay round at any width. VERIFIED r1–r3 at width 1200.
- **Sketch geometry** — `crossSectionTraces(paper)` in `plotSpec.ts` uses the
  panel's own axes aspect (`geometry.axesCm[0]`), matching MATLAB
  `plotCrossSectionSketches` incl. the grids' per-panel
  `cross_section_reference_axes_cm` override. VERIFIED round in r2/r3.
- **Typography/axes** — Times serif; ticks base pt (19 single / 15 grids),
  labels ×1.1, contour labels −2 pt; boxed axes, mirrored inside ticks,
  light solid major grid `#dfdfdf`, dotted minor grid `#c6c6c6` with
  `minor.dtick:"D1"`; single maps use power tick labels (10⁻¹/10⁰/10¹),
  grids use plain 0.1/1/10 (`paperAxisStyle(paper, axis, style)`).
- **Colorbars** — framed, inside ticks, 1/2/5-decade ticks
  (`makeLogColorbarTicks` port); vertical bar label = rotated annotation
  reading bottom-up (plotly's side-right title reads top-down — wrong);
  horizontal top bars via invisible **carrier trace**
  (`colorbarCarrierTrace`) because plotly cannot reverse a bar: negated
  color axis + mirrored scale reproduces MATLAB `Direction='reverse'`
  exactly. Tick labels of top bars are **annotations above the bar**
  (`horizontalBarTickAnnotations`) — plotly ignores `ticklabelposition` on
  carrier colorbars (tested, ineffective).
- **Contours** — drawn on linear display values (labels show physical
  levels); MATLAB label selection ported (`plain` 100·n, `bar` preferred
  sets, `cost` spread-7, `percent` explicit, shares dynamic
  `sparseShareLevels` incl. sub-percent steps); per-cooler burst steps
  Al 200 / PA 10 bar; percent labels via z/100 + d3 `"+.0%"`/`".0%"`
  (signed only when negative levels exist).
- **Color domains** — fixed caxis via `colorLimits`; robust shared limits
  (k, kA, burst) now apply in *single* mode too and collect values with the
  cooler's own `mask_below_min_wall` applied (MATLAB uses `*_plot` fields,
  l. 609–629). `zmid:0` only for auto-symmetric delta domains — explicit
  MATLAB caxis maps linearly (Fig. 22 was distorted before).
- **Overlays** — tech-limit curves (Al `#001999` dash / PA `#00801a` dot,
  2.6 pt, white underlay), validated-ref X (10 pt/2.2 pt, `x-thin`),
  comparison maps show only composite boundaries (+ ref X only per
  `showValidatedRef`), capillary maps/grid use flipped colormap
  (MATLAB `flipud`, l. 2080) and the capillary grid hides the ref X
  (burst + shares grids KEEP it — Fig. 15/12 show it).
- **Composites** (`compositePlotSpec.ts`) — full cm layout: panel domains
  from `paperMargins`, per-panel axes anchored (`anchor: "yN"` — without it
  tick labels leak between panels), panel titles at MATLAB y-norm 1.012,
  figure-wide axis labels + provenance as annotations, shared top colorbar
  carrier + tick annotations, extra 0.6 cm web-only bottom band so the
  provenance never collides with the x label. Design-boundary: fine 0.05 %
  display resampling for smooth screen boundaries, hatch every 29th edge
  cell, HTML legend under the figure (labels "Coolant throughput", "Tube
  cost" per Fig. 20_design), y-dtick 5, kA iso labels mode "all".
- **Fig. 22 dressing** — short label "Δ(k_oA_o)_feas", reversed top bar with
  tick annotations, simplified brace shapes + superiority labels,
  data-driven callouts (`percentCalloutAnnotations`) for +100/+150 that only
  appear when those levels exist in the data (current default data max is
  ~+76 %, so none appear — correct behavior; the paper reference was made
  from a different data state). The horizontal title is a separate annotation
  at the MATLAB position, and the −25/0/+25/+50 % contours use deterministic,
  data-interpolated annotations in the narrow feasible band.
- **Deterministic contour labels** — annotation targets reproduce the MATLAB
  label coverage where Plotly cannot place text reliably: k_o 300/400 W/m²K,
  bundle kA 50/300/500 W/K, all drawable aluminum design-boundary levels,
  and the 0 % Fig. 9 contour. Target points are interpolated on the computed
  contour and rotated from its local tangent; no scientific values are fitted
  or changed.
- **Components** — `PlotFigure`/`CompositePlotFigure` measure width via
  `useContainerWidth` (ResizeObserver, jsdom-guarded) and re-render at the
  paper zoom; exports render a fresh spec at reference size via
  `Plotly.downloadImage(figureObject, {width/height from geometry})`
  (single 624×499). CSS: `.plot-figure__frame` + legend styles in
  `styles.css` (min-heights removed).
- **Types** — `src/types/plotly.js-dist-min.d.ts` extended (axis style,
  minor, colorbar, marker colorbar, shapes, figure-object export).
- **Report capture** — `reportFigures.ts` uses `layout.width/height`.

## 3. Effective vs. ineffective measures (lessons)

Effective:

- Exact colormap via MATLAB dump (256 entries; old map lacked ~27 % low end).
- One zoom factor for *all* px quantities ⇒ round sketches at any width.
- `minor.dtick:"D1"` — without it plotly draws dense **linear** minor grid
  on log axes (was the mysterious stripe pattern in NaN regions; proven by
  hiding traces one-by-one, `scratchpad/.../shots/diag`).
- Carrier-trace colorbars for reversed bars; annotations for top tick labels
  and for the rotated vertical bar label.
- Axis `anchor` on composite subplots.
- Contours on linear display values (log z made labels show log10 numbers).
- Mask-aware robust percentiles (MATLAB `*_plot` semantics).

Ineffective / rejected:

- `colorbar.ticklabelposition:"outside top"` — ignored for carrier traces.
- `heatmap.zmid` with explicit caxis — distorts MATLAB linear mapping.
- `yaxis.scaleanchor` was rejected (breaks fixed ranges); CSS transform
  scaling rejected (breaks hover).
- plotly cannot place inline contour labels on short/steep segments (thin
  Fig. 22 band, some k_o 300/400 labels) — needs annotation-based labels.
- `crop.mjs` (screenshot crop via file:// in Chromium) renders black — use
  Playwright `clip` on the live page instead (see diagnose-pattern.mjs).

## 4. Per-plot checklist

Status: every item is visually verified in r4 against the corresponding
MATLAB export or, for app-only plots, against the shared approved conventions.

### 4.1 Paper figures

- [x] `overall-coefficient-map` ↔ 01/02 — colors, ticks, contours including
  200/300/400 labels, sketches and both coolers.
- [x] `bundle-conductance-map` ↔ 20/21 (+ portrait via tandem) — both
  coolers, 50/300/500 labels and shared limits.
- [x] `burst-pressure-map` ↔ 03/04 — both coolers and 800/1200/1600 labels.
- [x] `reynolds-tube-side-map` ↔ 05 — levels and Re=2300 transition.
- [x] `reynolds-air-simple-map` ↔ 07 / `reynolds-air-vdi-map` ↔ 08.
- [x] `friction-pressure-drop-map` ↔ 18 — reversed color orientation.
- [x] `coolant-throughput-map` ↔ 19 — reversed linear colorbar.
- [x] spacing maps ↔ 06/10/11/13.
- [x] `tube-supply-cost-map` ↔ 16/17 — both coolers and approved layering.
- [x] `tech-adjusted-delta-k` ↔ 09 — fixed ticks, annotated 0 % contour,
  no validated-reference marker.
- [x] `tech-adjusted-delta-ka` ↔ 22 — separate title, top ticks, braces and
  data-interpolated −25/0/+25/+50 % labels.
- [x] `burst-tolerance-grid` ↔ 15 — layout, bar direction and reference X.
- [x] `capillary-rise-grid` ↔ 14 — flipped colormap, no reference X.
- [x] `resistance-shares-grid` ↔ 12 — sparse levels, ticks and figure label.
- [x] `design-boundary-lines` ↔ 20_design — anchored panels, 5 % y ticks,
  top bar, smoothed display boundary, labels, hatch and HTML legend.

### 4.2 App-only diagnostics (shared style)

- [x] `inner/outer-heat-transfer`, `tube-count`, `bundle-area`,
  `hydraulic-power`, `coolant-mass-flow`, `capillary-rise(-1g/-5g/-10g)`,
  `resistance-inner/wall/outer` — shared pipeline spot-checked in r4;
  capillary singles deliberately use the flipped map.
- [x] `feasibility-mask-map` — binary white/accent with white infeasible.
- [x] `tech-adjusted-ratio-k/-ka`, `same-geometry-ratio(-value)` —
  composite boundaries only and both-feasible clipping.

### 4.3 Cross-cutting

- [x] Width sweep 700/1100/1600 px — invariant plot-area ratio and round
  cross-section circles at every width.
- [x] Tandem mode — two scaled panels, shared domains, no overlap.
- [x] PNG/SVG export — single-map reference size 624×499 and paper zoom 1,
  asserted from real Chromium downloads.
- [x] HTML report figure spot-check — same fixed-size specs captured as SVG;
  JSON sidecar remains embedded and machine-readable.
- [x] Colormap exactness (256-entry MATLAB dump).

## 5. Verification log

| Date | Round | Evidence |
| --- | --- | --- |
| 2026-07-12 | r1 | `scratchpad/shots/r1` — post A1–A3; findings F1–F10 |
| 2026-07-13 | diag | `scratchpad/shots/diag` — stripe pattern = plotly linear log-minor fallback |
| 2026-07-13 | r2 | `scratchpad/shots/r2` — F1–F9 verified; findings F11–F16 |
| 2026-07-13 | r3 | `scratchpad/shots/r3` — F10–F16 partially verified; Fig. 22 title/band labels still open |
| 2026-07-13 | r4 | `scratchpad/shots/r4`, `r4-target*`, `r4-final-labels` — all registered plots and both-cooler variants reviewed; F17–F19 closed |
| 2026-07-13 | width/tandem | `scratchpad/shots/r4-width-{700,1100,1600}`, `r4-tandem` — responsive geometry and tandem layout verified |

### Findings (all fixed)

- F1 robust/fixed shared color limits missing in single mode → always via
  `colorDomainForPlot`.
- F2 contour labels showed log10 values → contours on linear display values.
- F3 vertical colorbar label read top-down → rotated annotation.
- F4 x-title/provenance collision (single) → `title.standoff`.
- F5 composite axes unanchored → `anchor: "yN"/"xN"`.
- F6 `zmid` distorted explicit caxis → only for auto-symmetric domains.
- F7 stripe pattern = dense linear minor ticks on log axes → `dtick:"D1"`.
- F8 design-boundary y-dtick 5; legend wording per paper.
- F9 Fig. 22 short bar label.
- F10 top-bar tick labels below bar (plotly limitation) → annotations above.
- F11 robust percentiles must skip below-min-wall cells.
- F12 capillary flipped colormap + no ref X in capillary grid only.
- F13 composite footer band (+0.6 cm) against x-label collision.
- F14 shares grid: dynamic sparse/stepped levels, MATLAB ticks/label.
- F15 design-boundary labels all kA levels; screen lines smoothed (0.05 %).
- F16 Fig. 22 braces + data-driven callouts.
- F17 Fig. 22 h-bar title collision → blank trace title plus annotation at
  the MATLAB 17.15 cm position.
- F18 missing thin-band percent labels → data-interpolated annotations at
  the MATLAB target positions for Fig. 9/22.
- F19 incomplete single-map label coverage → deterministic annotations along
  the actual k_o, kA and design-boundary contours.
- Accepted deviation: d3 contour label format lacks the thin space
  ("+25%" vs MATLAB "+25 %"); colorbar tick annotations keep the spaced form.

## 6. Completion evidence and reproducibility

- Dev server: `pnpm dev --host 127.0.0.1 --port 5199 --strictPort`
  (background task; port 5174 is used by Playwright/parallel worker).
- Screenshot round: `node <scratchpad>/shoot-plots.mjs r4 [plotId ...]`
  (env `BASE_URL`, `WIDTH`; full paper-default request via URL state; both
  coolers for overall/bundle/burst/cost; writes `<scratchpad>/shots/r4`).
  Scratchpad = `C:\Users\Doebler\AppData\Local\Temp\claude\c--Users-Doebler-Documents-Modelle-MicrotubeDesignExplorer\e8b1328e-f4c2-4696-8df4-7d2fdad5ffdd\scratchpad`.
- Trace-level diagnosis: `diagnose-pattern.mjs` (hides traces one by one,
  clipped screenshots; uses Vite `/@id/plotly.js-dist-min` import).
- Reference views: Read the export PDFs directly (14/15/12/22/19/09/01 and
  20_design were reviewed and their conventions are encoded above).
- Colormap regeneration: `matlab -batch "writematrix(slanCM('spectral'),
  '<out>.csv')"` then the node generator (see git diff of colormap.ts).

The r4 artifacts are scratch evidence, not source-controlled deliverables.
The durable reproduction inputs are the immutable MATLAB exports, the exact
colormap table and provenance in source control, the cm geometry constants,
unit tests for annotation placement/export dimensions, and Chromium E2E tests
that render every registered plot without Plotly runtime errors.

## 7. Validation checklist

- [x] `pnpm test` (Vitest) green — 51 passed (2026-07-13).
- [x] `pnpm typecheck` green (2026-07-13).
- [x] `pnpm lint` (0 errors, 2 known generated-file warnings) and
  `pnpm format:check` green after `pnpm format` (2026-07-13).
- [x] `pnpm build` green (2026-07-13).
- [x] `pnpm test:e2e:chromium` green — every registered plot plus PNG/SVG,
  JSON/HTML report, URL/reset and accessibility acceptance flows.
- [x] Wiki: ADR-0007, plot catalog and result-plot conventions describe the
  exact colormap, cm layouts, annotation policy, smoothing and export sizes.
- [x] Conventional Commits: intermediate `f14562c`; completion changes are
  recorded by the commit containing this completed plan.

## 8. Status history

| Date | Change | Author/agent |
| --- | --- | --- |
| 2026-07-12 | Plan created from user findings; approach A1–A4 fixed | Claude (plot polish) |
| 2026-07-13 | A1–A3 implemented (exact colormap, cm layouts, typography, carrier colorbars, composites); visual rounds r1–r3 with findings F1–F19; F1–F16 fixed, F17–F19 open; handover notes in §2/§3/§6 | Claude (plot polish) |
| 2026-07-13 | F17–F19 closed with data-interpolated contour annotations; r4 covered all registered plots plus width sweep, tandem and export/report checks; validation and documentation completed | Codex |
