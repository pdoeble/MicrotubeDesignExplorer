# GitHub-to-GitLab mirroring — living plan

> **Path:** `/plans/260713-github-gitlab-mirroring.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Milestone:** Repository operations
> **Workstream:** Distribution and redundancy
> **Owner:** Codex (`/root`), requested by repository owner
> **Status:** blocked
> **Created:** 2026-07-13
> **Last updated:** 2026-07-13

## Scope

Keep `https://github.com/pdoeble/MicrotubeDesignExplorer.git` as the canonical
public repository and add an internal downstream copy at
`https://gitlab.hs-esslingen.de/phdoeble/MicrotubeDesignExplorer.git`.

The setup must provide both:

- local pushes that publish the same selected refs to GitHub and GitLab; and
- GitLab pull mirroring from GitHub as a recovery path for pushes performed
  outside this checkout.

This work does not change application code, scientific data, GitHub Pages, or
the contents of `/source_materials`. GitLab is downstream and must not be used
for independent commits.

## Interfaces

- Local Git configuration in `.git/config` (not version-controlled).
- GitHub remote `origin` and upstream branch `origin/main`.
- GitLab project and repository-mirroring settings.
- HTTPS authentication through Git Credential Manager; credentials must never
  be written into repository files or remote URLs.

## Tasks

- [x] Diagnose local refs, worktree state, object sizes, and current remotes.
- [x] Authenticate to `gitlab.hs-esslingen.de` as `phdoeble`.
- [x] Create or confirm the internal GitLab project without an initial commit.
- [ ] Configure GitLab pull mirroring from the public GitHub repository —
  blocked because both the GitLab 19.1 pull-mirror endpoint (`404`) and the
  deprecated API-v4 configuration path (`400`) are unavailable for this tier.
- [x] Add a distinct local `gitlab` remote.
- [x] Configure automatic dual pushes without changing GitHub fetch/upstream.
- [x] Push the committed branches and tags to GitLab.
- [x] Verify visibility, default branch, and ref equality.
- [x] Record final evidence and the remaining external limitation.

## Risks

| Risk | Mitigation |
|---|---|
| GitLab and GitHub diverge | Treat GitHub as canonical and GitLab as read-only downstream. |
| One endpoint accepts a dual push while the other fails | Verify both remote SHAs after the initial push and report partial failures explicitly. |
| Credentials leak into Git configuration or logs | Use Git Credential Manager/API headers in memory; store only credential-free HTTPS URLs. |
| Uncommitted application work is published accidentally | Push only committed refs; do not stage or commit unrelated working-tree changes. |
| GitLab CI or Pages runs unintentionally | Do not add `.gitlab-ci.yml`; leave GitHub Pages as the sole deployment target. |
| Pull mirroring is unavailable on the institutional GitLab license | Retain automatic local dual push and report the unavailable server-side feature. |

## Tests / evidence

- `git remote -v` shows credential-free GitHub and GitLab endpoints.
- `git remote get-url --push --all origin` shows both push destinations.
- `git ls-remote --heads --tags origin` and `git ls-remote --heads --tags gitlab`
  resolve the same committed refs.
- GitLab API reports `visibility=internal`, `default_branch=main`, and an enabled
  downstream repository. Pull-mirror API availability is recorded separately.
- `git status --short` confirms that pre-existing application changes remain
  unstaged and otherwise untouched.

## Status log

| Date | Change |
|---|---|
| 2026-07-13 | Diagnosis completed; implementation authorized as public dual-push plus GitLab pull mirror. |
| 2026-07-13 | Authenticated as `phdoeble`; GitLab 19.1.2 rejected public project creation because public visibility is restricted by the administrator. Both attempts were atomic and the target remains absent (`HTTP 404`). Implementation paused without changing remotes. |
| 2026-07-13 | Repository owner approved `internal` visibility; implementation resumed with the remaining topology unchanged. |
| 2026-07-13 | Created internal GitLab project `4659`, disabled Auto DevOps, added the `gitlab` remote, configured two `origin` push URLs, and verified equal `main` refs on GitHub and GitLab at `f3420cd36f3c9eeab9eaf8547abde12c08382a9e`. |
| 2026-07-13 | Pull mirroring remains blocked by the GitLab tier: `PUT/GET /projects/4659/mirror/pull` is unavailable and the API-v4 compatibility update is rejected. |

## Final commits

- `docs(repo): document GitHub-GitLab mirror topology`

Local remote configuration and GitLab settings are operational state and are
not stored in the commit.
