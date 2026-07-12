# ADR-0007: Plot display fidelity policy

- Status: accepted
- Date: 2026-07-12
- Deciders: project maintainer, Codex implementation agent
- Related plan: `plans/260712-plot-fidelity-review.md`

## Context

The scientific core evaluates the native logarithmic wall-thickness × outer-
diameter grid. The accepted MATLAB paper figures display the same results in
outer-diameter × wall-thickness-ratio space, use the project spectral map, and
include three resistance-share panels whose ratios were not part of the public
result payload. The web implementation previously plotted raw SI values on the
native wall-thickness axis and therefore matched numerically but not visually.

## Decision

1. The frontend performs a display-only, column-wise linear resampling from
   native wall thickness to a regular τ = 100·t/d_o grid on [0, 40] %. It only
   interpolates between two adjacent finite values. It never bridges a NaN or
   masked interval. Binary masks and status values use nearest-neighbour
   selection. Scientific arrays and the public request remain unchanged.
2. The Python core exports `resistance_share_inner`,
   `resistance_share_wall`, and `resistance_share_outer` in percent. The
   existing sourced `resistance_shares` domain function performs the
   aggregation; no resistance physics is evaluated in TypeScript. This is an
   additive field-catalog change and does not break contract 1.0.0.
3. Scientific map exports omit in-figure descriptive titles. The application
   and report captions carry the descriptive title; approved multi-panel
   figures retain short panel labels.
4. The frontend project colormap is a typed snapshot of the ordered RGB fill
   sequence recovered from the approved MATLAB SVG generated with
   `slanCM('spectral')`. This makes the static build independent of a MATLAB or
   third-party runtime colormap package and avoids an undocumented fit.

## Consequences

- Hover, colorbars, summaries and reports use display units while all core and
  worker values remain SI.
- Contour geometry is a rendering product. Numerical exports and regression
  comparisons continue to use the unmodified native arrays.
- Plot tests must cover no-interpolation-across-NaN behavior, conservative mask
  handling, fixed domains and τ-axis limits.
- Adding or changing a display interpolation policy requires a new ADR; it may
  not be hidden inside a Plotly adapter.
