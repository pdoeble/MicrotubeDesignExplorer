# ADR-0015: Adaptive dimensionless diagnostic maps

- Status: accepted
- Date: 2026-07-16
- Deciders: project maintainer, Codex implementation agent
- Related plan: `plans/260716-dimensionless-diagnostic-plots.md`
- Affected components: Python sweep/API, MATLAB goldens, plot registry/specs,
  exports, model/UI documentation

## Context

The committed `Paper.pdf` and its TeX source predate the diagnostic section
added to the current MATLAB master and the two supplied 2026-07-16 morphology
notes. The paper therefore remains authoritative for the accepted G1/G7 and
resistance equations but does not select or define public Graetz, wall-Biot,
ridge, flip, or local-sensitivity figures. This is a source-order conflict
that cannot be resolved silently.

The maintainer explicitly requested useful new MATLAB diagnostics in the web
application while requiring them to remain stable for arbitrary user sweep
ranges and operating inputs. The new MATLAB explanatory lines and prose use
fixed default-case values, a fixed interpolation range, and clipped display
fields, so copying that presentation would not satisfy the interactive model.

## Decision

- Add three algebraic diagnostics built only from accepted model quantities:
  `Gz_i = Re_i Pr_i d_i/L`, `Bi_w = k_o d_o/lambda_w`, and
  `S_i = partial ln(Nu_i)/partial ln(d_i)`.
- Define `Bi_w` with the outside-area overall coefficient `k_o`, not the
  air-side coefficient `alpha_o`. Treat `Bi_w = 1` as a scale contour, not a
  50 % wall-resistance statement.
- Evaluate `S_i` pointwise at fixed local tube velocity, fluid properties,
  length, and G1 boundary condition with a central logarithmic stencil
  `h = 1e-5`. Do not interpolate from MATLAB's fixed 0.01–10 mm support and do
  not clip the result.
- Preserve invalid geometry, unsolved operating points, and cells outside the
  calculation window as NaN float64 values.
- Expose the fields additively under contract `1.0.0`; the request schema and
  worker protocol shape remain unchanged.
- Add public plots `graetz-tube-side-map`, `wall-biot-map`, and
  `g1-diameter-sensitivity-map`. Use exact finite-value color domains from
  both coolers: logarithmic for Graetz/Biot and linear for sensitivity.
- Draw dynamic `Re_i = 2300`, `Bi_w = 1`, and `S_i = 2/3` reference contours
  from the active result. Do not port fixed `Gz = 11.7/33/877`, ridge, flip,
  or fixed-value explanatory lines. The established resistance-share grid is
  the public morphology view.
- Derive all map axes, τ resampling, contours, screen lines, hatches, and
  comparison limits from one active request domain. Keep the established
  0.1–10 mm and 0–40 % paper presentation only for the default 0–45 %
  calculation window; omit paper-specific cross-section sketches otherwise.
- Leave `source_materials`, `Paper.pdf`, and TeX sources unchanged.

## Consequences

- Diagnostics respond to all supported user operating modes, fluids,
  geometries, sweep ranges, and both G1 thermal boundary conditions without
  hidden fits or display clipping.
- Tandem figures remain quantitatively comparable because both panels share
  one untrimmed domain.
- Exact MATLAB parity applies to Graetz and Biot. Sensitivity parity is tested
  against MATLAB's interpolated gradient with documented branch-aware
  tolerances while the public implementation remains resolution-independent.
- The public registry grows from 37 to 40 stable plot IDs; the compact default
  report-figure selection remains unchanged.

