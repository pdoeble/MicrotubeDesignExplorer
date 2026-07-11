# Release and maintenance handover

This page is the M10 handover guide for building, releasing, and maintaining
the static application.

## Release candidate checklist

1. Confirm independent scientific and accessibility review findings are closed
   or formally accepted in `wiki/decisions/`.
2. Run the local release gates from a clean checkout:

   ```powershell
   python scripts/check_prohibited_files.py
   cd python
   uv sync --locked
   uv run ruff check ..
   uv run ruff format --check ..
   uv run mypy .
   uv run pytest
   cd ..
   pnpm install --frozen-lockfile
   pnpm generate:contracts
   pnpm typecheck
   pnpm lint
   pnpm format:check
   pnpm test
   pnpm build
   python scripts/check_release_gate.py
   ```

3. Push `main` to GitHub and let the CI and Pages workflows complete.
4. Verify the deployed URL with the deployed Playwright smoke:

   ```powershell
   $env:PLAYWRIGHT_BASE_URL="https://<owner>.github.io/<repo>/"
   pnpm exec playwright test --project=chromium tests/e2e/app-acceptance.spec.ts -g "runs a reduced paper-default workflow"
   ```

5. Tag the release only after the deployed site matches the source commit.

## Current release-candidate evidence

- Source: latest `main` commit with passing CI and Pages workflows.
- Initial CI evidence: run `29140082451` passed on GitHub Actions.
- Initial Pages evidence: run `29140082435` passed on GitHub Actions.
- Live URL: `https://pdoeble.github.io/MicrotubeDesignExplorer/`.
- Deployed smoke: reduced compute, plot rendering, JSON/HTML report export,
  full paper-default compute, SVG/PNG figure export, and print/PDF report popup
  have been verified on the live site.

## Version metadata

- `package.json` is the JavaScript package version source.
- `CITATION.cff` must use the same semantic version before a release tag.
- `CHANGELOG.md` keeps the human release notes.
- `src/contracts/defaults.json` and generated TypeScript contracts are drift
  gates; update them only through the Python contract exporter.

## Adding scientific fields

1. Add the field in the Python model or sweep output, preserving SI units.
2. Add provenance and source documentation in `wiki/model/`.
3. Add golden regression coverage if the field maps to MATLAB behavior.
4. Export the field through `microtubes_core.api`.
5. Regenerate contracts when the public payload changes.
6. Add plot/report adapters only after the field exists in `SimulationResult`.

## Adding plots

1. Add or reuse a stable plot id in `src/features/plots/plotRegistry.ts`.
2. Build the Plotly spec from existing `SimulationResult` fields only.
3. Include units, alt text, detailed description, validity masks, and overlays
   where applicable.
4. Add unit tests in `tests/frontend/plot-spec.test.ts`.
5. Update `wiki/model/plot-catalog.md` and `wiki/ui/result-plots.md`.

## Adding operating modes or contract versions

New public modes or breaking request/result changes require:

- an ADR under `wiki/decisions/`;
- a semantic contract-version increment;
- Pydantic schema changes in `python/microtubes_core/contracts.py`;
- regenerated JSON Schema and TypeScript artifacts;
- worker protocol and URL-state migration notes where affected;
- focused golden or acceptance tests for the new behavior.

## Golden-data regeneration

Golden regeneration is documented in
[model/golden-data.md](model/golden-data.md). Never update golden files merely
to make tests pass. A golden-data commit must include provenance notes and a
review of the MATLAB reference script hash.

## Severity policy

| Severity | Criteria | Expected handling |
|---|---|---|
| Critical | Wrong scientific result, prohibited source leak, broken deployed app, or corrupt export | Stop release; fix with regression test |
| High | Major accessibility blocker, missing warning/provenance, broken core workflow, or CI release-gate failure | Fix before release candidate |
| Medium | Usability issue with workaround, non-blocking browser-specific problem, or incomplete documentation | Track in the next dated plan |
| Low | Cosmetic issue, copy edit, or minor maintenance improvement | Batch in backlog |

## Known limitations before release

- Independent scientific and accessibility approval is still required.
- The first formal release tag and GitHub release have not been published.
- Firefox-specific Pyodide tests are skipped only for the Vite dev-server path;
  production-preview smoke has passed locally.
