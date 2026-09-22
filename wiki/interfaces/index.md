---
canonical_status: unknown
normative_status: informative
lifecycle_state: unknown
currency_assessment: not_assessed
audit_role: operational
scope: project
review_disposition: review
provenance_origin: local_project_authoring
document_kind: technical_or_research_note
derivation: direct_authoring
---
# Interfaces

Shared contracts between the Python core, the Pyodide worker, and the
frontend. Contract changes follow semantic versioning; breaking changes
require an ADR (AGENTS §6, §14).

| Document | Content | Milestone |
|---|---|---|
| [contracts.md](contracts.md) | `SimulationRequest` / `SimulationResult`, defaults source, validity policy | M2 |
| [python-api.md](python-api.md) | Direct Python `simulate(request)` payload and array-buffer boundary | M3 |
| [worker-protocol.md](worker-protocol.md) | Pyodide worker message protocol, transferables, cancellation | M4 |
| [url-state.md](url-state.md) | Versioned URL serialization of scientific inputs | M5 |
| [report-payload.md](report-payload.md) | Report/export payload structure | M7 |

<!-- related-links-generated: fts5-lexical -->
## Related (automatisch, lexikalisch via FTS5/BM25)

Diese Links beruhen auf Wortueberlappung mit dem Projekt-Suchindex, nicht
auf inhaltlichem Verstehen. Sie sind Kandidaten, keine geprueften
fachlichen Relationen; falsch positive Treffer sind moeglich.

- [[MicrotubeDesignExplorer/wiki/interfaces/python-api|Return shape]] (microtubedesignexplorer)
- [[MicrotubeDesignExplorer/wiki/paper-companion-application|21. Weiterführende bindende Dokumentation]] (microtubedesignexplorer)
- [[MicrotubeDesignExplorer/wiki/interfaces/worker-protocol|Caching and supersession]] (microtubedesignexplorer)
