# ADR-0014: VDI-Wärmeatlas edition citation follows the paper

- Status: accepted
- Date: 2026-07-13
- Deciders: project maintainer, Codex implementation agent
- Related plan: `plans/260713-external-reader-copy.md`
- Affected documentation: `wiki/model/equations.md`, Start page, Python model
  docstrings

## Context

The current paper is the highest-priority scientific source. Its bibliography
entries [9] and [10] cite the G1 and G7 chapters from the 12th edition of the
VDI-Wärmeatlas, Springer Vieweg (2019). The read-only legacy MATLAB reference
instead labels the same G1/G7 model as “VDI-Waermeatlas 2013”, and that year was
carried into the application Start page and port documentation.

This is a bibliographic conflict between the paper and legacy comments. No
evidence in the repository identifies a corresponding difference in the
implemented equations or branch logic.

## Decision

- Cite the VDI-Wärmeatlas, 12th edition (2019), chapters G1 and G7, in the
  deployed application, Python docstrings, and current model documentation.
- Treat the paper bibliography as authoritative under the repository's
  source-of-truth order.
- Leave `source_materials/Waermedurchgang_V10_physical.m` unchanged because
  `source_materials/` is read-only and remains the executable legacy reference.
- Do not alter equations, constants, validity limits, branch logic, numerical
  tolerances, or golden reference data as part of this citation correction.

## Consequences

- External readers see the same edition that is cited in the accompanying
  paper.
- The difference from the legacy MATLAB comment remains explicit and
  traceable instead of being silently resolved.
- Numerical results and MATLAB parity are unchanged.
