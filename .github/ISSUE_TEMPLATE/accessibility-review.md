---
name: Accessibility release-candidate review
about: Record independent WCAG 2.2 AA approval or blocking findings for M8/M10.
title: "Accessibility RC review: v0.1.0"
labels: "review, accessibility"
assignees: ""
---

## Reviewer

- Reviewer name or role:
- Review date:
- Independent of implementation work: yes/no
- Reviewed commit:
- Reviewed deployed URL:
- Assistive technology and browser:

## Scope

Please review the static release candidate against WCAG 2.2 AA and:

- `wiki/ui/accessibility.md`
- `tests/e2e/app-acceptance.spec.ts`
- `plans/260710-validation-accessibility-performance.md`
- `plans/260710-master-roadmap.md`

## Checklist

- [ ] Keyboard-only navigation works across all five app tabs.
- [ ] Focus order and visible focus states are usable.
- [ ] Form controls, warnings, and validation messages have accessible names or descriptions.
- [ ] Result plots expose concise alt text and detailed tabular alternatives.
- [ ] Export controls and generated HTML/print report are understandable without the plot canvas.
- [ ] 200% text zoom and narrow viewport reflow do not introduce horizontal document overflow.
- [ ] Color is not the only carrier of feasibility, threshold, or warning meaning.
- [ ] Screen-reader traversal of the main compute and export flow is acceptable.
- [ ] WCAG 2.2 AA exceptions, if any, are documented in `wiki/decisions/`.

## Findings

List blocking findings first. Include browser, assistive technology, viewport,
steps to reproduce, screenshots, and relevant DOM/ARIA details where useful.

## Decision

- [ ] Approved.
- [ ] Approved with accepted exceptions documented in `wiki/decisions/`.
- [ ] Blocked pending findings above.
