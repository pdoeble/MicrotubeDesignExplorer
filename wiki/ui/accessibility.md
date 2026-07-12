# Accessibility evidence

Target: WCAG 2.2 AA for the static scientific application.

## Implemented conventions

- Main navigation follows the WAI-ARIA Tabs pattern with roving tabindex,
  arrow-key navigation, Home/End support, and visible focus states.
- Model Setup uses labelled step-navigation buttons with `aria-current`, one
  accessible link checkbox per scientific group, and contextual linked-group
  regions whose `Edit separately` action reveals the independent controls.
- Numeric controls expose native labels, number inputs, sliders, visible units,
  per-field reset buttons, and validation text through `aria-describedby`.
- Plot figures expose captions and a tabular data summary tied to the canvas by
  `aria-describedby`; report exports include figure alt text and descriptions.
- Feasibility and validity are not conveyed by color alone; masks, boundaries,
  legends, hover text, and table/status summaries carry the same meaning.

## M8 automated checks

`tests/e2e/app-acceptance.spec.ts` verifies on Chromium:

- keyboard tab navigation and activation;
- versioned URL state round-trip and reset-to-default workflow;
- visible controls in Model Setup have accessible names;
- the 390 px mobile viewport has no horizontal document overflow;
- body text, active tabs, and primary buttons meet at least 4.5:1 contrast;
- screen-reader landmarks/roles for banner, main, tablist, tabpanel, fieldset
  groups, and cooler regions are present;
- 200% text zoom reflows the Model Setup workflow without horizontal document
  overflow;
- reduced paper-default compute completes and JSON/HTML report exports work.

## Open review gates

- Chromium and WebKit pass the current Playwright E2E suite locally.
- Firefox passes the production-preview app acceptance smoke. Firefox-specific
  Pyodide tests are skipped only for the Vite dev-server path because startup
  hangs there while requesting `python_stdlib.zip`/`pyodide.asm.wasm`.
- Screen-reader traversal has not yet been reviewed by an independent user.
- Scientific and accessibility approval by an independent reviewer remains an
  M8 exit dependency before M9 can be treated as a release candidate gate.
