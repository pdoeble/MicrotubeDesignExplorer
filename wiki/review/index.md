# Release-candidate review package

This package defines the independent review evidence required before M8, M9,
and M10 can be closed. It is intentionally separate from the implementation
evidence because the reviewer must not be the implementation agent.

## Reviewer independence

The reviewer must record:

- name or role;
- date of review;
- reviewed source commit;
- reviewed deployed URL;
- whether they were independent of the implementation work;
- approval, approval with accepted exceptions, or blocking findings.

Approval with accepted exceptions requires an ADR under `wiki/decisions/`.
Blocking findings require tracked issues and regression tests for fixes where
the finding is testable.

## Scientific review checklist

Review source commit: `git rev-parse HEAD`.

Review deployed URL: `https://pdoeble.github.io/MicrotubeDesignExplorer/`.

Required checks:

- Compare the implemented scientific scope against
  `source_materials/Paper.pdf` and
  `source_materials/Waermedurchgang_V10_physical.m`.
- Inspect `wiki/model/matlab-inventory.md`, `wiki/model/equations.md`,
  `wiki/model/golden-data.md`, and `wiki/model/scientific-validation.md`.
- Confirm every accepted MATLAB output is either implemented or explicitly
  documented as excluded.
- Confirm no hidden calibration factor, undocumented empirical fit, clipping,
  smoothing, or extrapolation has been introduced.
- Confirm units remain SI internally and display conversions happen only at
  boundaries.
- Confirm validity masks and warnings distinguish invalid geometry,
  outside-validity regions, screened-out designs, and non-optimal designs.
- Run or inspect the release gates:

  ```powershell
  cd python
  uv run pytest
  uv run mypy .
  uv run ruff check ..
  uv run ruff format --check ..
  cd ..
  pnpm test
  pnpm typecheck
  pnpm build
  python scripts/check_release_gate.py
  ```

Reviewer output:

- approved;
- approved with documented exceptions;
- blocked with findings.

## Accessibility review checklist

Required checks:

- Review `wiki/ui/accessibility.md` and the M8 Playwright evidence.
- Use keyboard-only navigation across Start, Input, Materials, Result Plots,
  and Settings.
- Review at least one complete compute and export flow using a screen reader
  such as NVDA, JAWS, VoiceOver, or Narrator.
- Verify focus visibility, tab order, form labels, field errors, warnings,
  plot alternative text, plot data tables, and report export controls.
- Verify 200% text zoom/reflow on a narrow viewport without horizontal document
  overflow.
- Verify information conveyed by color is also available through text, symbols,
  tables, legends, or warnings.
- Confirm any WCAG 2.2 AA exception is documented and approved through an ADR.

Reviewer output:

- WCAG 2.2 AA approved;
- approved with documented exceptions;
- blocked with findings.

## GitHub issue templates

Use `.github/ISSUE_TEMPLATE/scientific-review.md` for scientific approval and
`.github/ISSUE_TEMPLATE/accessibility-review.md` for accessibility approval.
The master roadmap can close M8/M9 review items only after those issue records
show approval or accepted exceptions.
