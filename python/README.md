---
canonical_status: unknown
normative_status: informative
lifecycle_state: unknown
currency_assessment: not_assessed
audit_role: core
scope: project
review_disposition: review
provenance_origin: local_project_authoring
document_kind: unknown
derivation: direct_authoring
---
# microtubes-core

Pure, deterministic, side-effect-free Python port of the approved MATLAB
screening model `source_materials/Waermedurchgang_V10_physical.m`.

Public computation contract: `SimulationRequest` → `SimulationResult`
(see `microtubes_core/contracts.py` and `wiki/interfaces/`).

Every equation cites its source (VDI-Wärmeatlas, 12th ed. (2019), G1/G7;
Lamé; Darcy)
in the docstrings and in `wiki/model/`.

Golden parity against MATLAB-derived references in `/reference` is enforced
by `tests/python/` at `rtol=1e-8`, `atol=1e-10`.

<!-- related-links-generated: fts5-lexical -->
## Related (automatisch, lexikalisch via FTS5/BM25)

Diese Links beruhen auf Wortueberlappung mit dem Projekt-Suchindex, nicht
auf inhaltlichem Verstehen. Sie sind Kandidaten, keine geprueften
fachlichen Relationen; falsch positive Treffer sind moeglich.

- [[MicrotubeDesignExplorer/wiki/interfaces/contracts|Contracts — SimulationRequest / SimulationResult (frozen M2)]] (microtubedesignexplorer)
- [[MicrotubeDesignExplorer/wiki/paper-companion-application|6.3 Scientific Core]] (microtubedesignexplorer)
- [[MicrotubeDesignExplorer/wiki/interfaces/report-payload|Report payload]] (microtubedesignexplorer)
