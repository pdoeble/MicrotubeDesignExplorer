# ADR-0012: GitHub-preserving static Pages portability

- Status: accepted
- Date: 2026-07-13
- Deciders: project maintainer, Codex implementation agent
- Related plan: `plans/260713-gitlab-pages-migration.md`
- Amends: ADR-0010

## Context

The application is live on GitHub Pages and must remain available there. A
future additional deployment to the Hochschule Esslingen Self-Managed GitLab
instance is desired, but the instance does not yet expose GitLab Pages. GitLab
Pages can use a unique-domain root, a project subpath, or a single-domain path
containing both namespace and project. The previous Vite configuration derived
only the GitHub repository path and otherwise used `/`.

ADR-0010 prohibited GitLab CI and Pages configuration while GitLab was only a
repository mirror. The maintainer has now authorized host-neutral preparation,
but not an active GitLab pipeline or a GitHub cutover.

## Decision

- GitHub remains the canonical repository, mandatory public Pages deployment,
  and authoritative active CI/deployment path.
- Permit host-neutral application, test, artifact-validation, governance, and
  documentation changes needed for a later parallel GitLab Pages deployment.
- Resolve the Vite base path in this order:
  1. explicit `VITE_PUBLIC_BASE_PATH`;
  2. path component of GitLab's predefined `CI_PAGES_URL`;
  3. the established GitHub Actions repository-name derivation;
  4. local `/` fallback.
- Keep all Pyodide, Python-wheel, Worker, JavaScript, CSS, and export runtime
  assets same-origin and relative to Vite's resolved base.
- Make every `pnpm build` verify the generated Pages artifact: non-empty index,
  expected base-prefixed JS/CSS references, file/size limits, prohibited source
  formats and source-path tokens, safe manifest-relative paths, and SHA-256
  manifests for Pyodide packages and the Python core wheel.
- Add a managed production-preview smoke at a nested
  `/phdoeble/MicrotubeDesignExplorer/` path as the most demanding anticipated
  GitLab single-domain layout.
- Do not add `.gitlab-ci.yml`, a GitLab access token, a Pages domain, or a
  GitLab deployment until the instance prerequisites in the related living
  plan are met and explicitly recorded.
- Do not remove, redirect, or weaken `.github/workflows/pages.yml` as part of
  GitLab preparation.

## Consequences

- Root, GitHub project, GitLab project, GitLab namespace-in-path, and unique
  domain layouts share one application build configuration.
- A malformed `CI_PAGES_URL` fails the build instead of silently producing
  root-relative broken assets.
- GitHub keeps the same `/MicrotubeDesignExplorer/` base and deployment trigger.
- The generated artifact is independently checked on local, GitHub, and future
  GitLab builds. Default limits are 1,000 files and 50 MiB uncompressed, both
  intentionally below the expected server limits and configurable by CI.
- The current operational statement in ADR-0010 remains true: no GitLab CI or
  Pages deployment exists yet. Its absolute prohibition on preparation is
  replaced by this narrower staged policy.
- An active GitLab Pages deployment still requires completion of the external
  enablement milestone and a further plan/ADR status update.
