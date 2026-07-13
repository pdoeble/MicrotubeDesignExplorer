# ADR-0010: GitHub canonical repository with internal GitLab mirror

- Status: accepted with external limitation
- Date: 2026-07-13
- Deciders: project maintainer, Codex implementation agent
- Related plan: `plans/260713-github-gitlab-mirroring.md`

## Context

The repository is published publicly on GitHub and deployed to GitHub Pages.
The maintainer requested an additional copy in the personal namespace of the
Hochschule Esslingen GitLab instance, automatic publication to both hosts from
the local checkout, and GitLab pull mirroring as a recovery mechanism.

GitLab administrator policy rejected creation with public visibility. The
maintainer therefore approved internal visibility. The GitLab 19.1.2 instance
accepted the internal project but exposes neither the current pull-mirroring
API nor the deprecated API-v4 configuration path for this project tier.

## Decision

- Keep `https://github.com/pdoeble/MicrotubeDesignExplorer.git` canonical,
  public, and authoritative for CI and GitHub Pages.
- Maintain `phdoeble/MicrotubeDesignExplorer` on Hochschule Esslingen GitLab as
  an internal downstream repository. Do not create independent commits there.
- Keep `origin` fetching from GitHub and tracking `origin/main`.
- Give `origin` two credential-free push URLs, GitHub first and GitLab second,
  so the existing `git push` workflow publishes to both destinations.
- Keep a distinct `gitlab` remote for explicit inspection, fetching, and
  recovery operations.
- Store GitLab authentication only in Git Credential Manager. Never put a
  password or token in `.git/config`, repository files, CI variables, or URLs.
- Disable GitLab Auto DevOps and do not add GitLab CI or Pages configuration.
- Retain GitLab pull mirroring as a requested but blocked enhancement. Do not
  emulate it with a scheduled CI job or new repository secret without a new
  maintainer decision.

## Consequences

- A normal push through `origin` attempts both destinations. One destination
  can succeed while the other fails, so errors must not be ignored and remote
  refs should be compared after a partial failure.
- The dual-push configuration is local `.git/config` state. Other clones must
  reproduce it explicitly if they should publish to both hosts.
- GitLab users with access to internal projects can use the downstream copy;
  anonymous users cannot.
- GitHub remains the only source for deployment and automation behavior.
- Server-side recovery from GitHub is not automatic until the institutional
  GitLab license or administrator settings expose pull mirroring.
