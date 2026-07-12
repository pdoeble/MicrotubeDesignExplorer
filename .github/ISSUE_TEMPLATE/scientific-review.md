---
name: Scientific release-candidate review
about: Record independent scientific approval or blocking findings for M8/M10.
title: "Scientific RC review: v0.1.0"
labels: "review, scientific"
assignees: ""
---

## Reviewer

- Reviewer name or role:
- Review date:
- Independent of implementation work: yes/no
- Reviewed commit:
- Reviewed deployed URL:

## Scope

Please review the scientific implementation against:

- `source_materials/Paper.pdf`
- `source_materials/Waermedurchgang_V10_physical.m`
- `wiki/model/matlab-inventory.md`
- `wiki/model/equations.md`
- `wiki/model/golden-data.md`
- `wiki/model/scientific-validation.md`
- `plans/260710-master-roadmap.md`

## Checklist

- [ ] Accepted MATLAB outputs are implemented or explicitly excluded.
- [ ] Golden-data provenance and tolerances are acceptable.
- [ ] Equation implementations cite the paper, MATLAB reference, or wiki source.
- [ ] SI internal units and display-only conversions are preserved.
- [ ] Validity masks, warnings, and screen boundaries are scientifically clear.
- [ ] No hidden fit, clipping, smoothing, extrapolation, or calibration factor is present.
- [ ] Release gates were run or reviewed.

## Findings

List blocking findings first. Include file paths, equations, commands, screenshots,
or deployed-site steps where useful.

## Decision

- [ ] Approved.
- [ ] Approved with accepted exceptions documented in `wiki/decisions/`.
- [ ] Blocked pending findings above.
