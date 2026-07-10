# ADR-0006: Pyodide and core-wheel asset hosting

> **Status:** accepted
> **Date:** 2026-07-10
> **Milestone:** M4
> **Related:** `/plans/260710-pyodide-worker-bridge.md`

## Context

The application must run as a static GitHub Pages site without a backend. The
browser computation path needs Pyodide runtime assets, Pyodide package wheels
for NumPy/Pydantic, and the locally built `microtubes_core` wheel.

Using a third-party CDN at runtime would introduce an external availability and
supply-chain dependency. Committing large generated runtime files would make
normal source diffs noisy and duplicate the package-manager lockfile.

## Decision

Use the pinned NPM `pyodide` package as the source of Pyodide runtime assets.
Before `vite build` or local `vite` dev startup, run
`scripts/prepare_pyodide_assets.mjs`, which:

- copies the pinned Pyodide runtime files from `node_modules/pyodide` to
  `public/vendor/pyodide/`;
- builds the local Python wheel with `uv build --wheel`;
- writes the wheel to `public/wheels/`;
- writes SHA-256 manifests for generated public artifacts.

Generated `public/vendor/pyodide/` and `public/wheels/` contents are ignored in
Git and are reproduced from committed lockfiles and source.

## Consequences

- GitHub Pages serves all runtime assets from the same origin as the app.
- The committed source remains small while the deployed artifact remains fully
  static.
- Build determinism depends on `pnpm-lock.yaml`, `python/uv.lock`, and the
  `microtubes_core` source tree.
- Any Pyodide version change must update the lockfile and rerun the M4/M8
  browser parity checks.
