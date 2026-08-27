# Claude Code guidance

Before creating or editing Markdown, read and follow
[AGENTS.md](AGENTS.md). Its `Obsidian-compatible links (mandatory)` section
applies to docs, wikis, reports, plans, handoffs, and reusable Markdown output.
Nested instructions may add stricter project rules but must not relax this link
contract. Whenever current work encounters an outdated, broken, ambiguous, or
non-compliant link, correct it in the same change and verify the target. Do not
bulk-migrate unvisited documents.

<!-- local-rag-agent-guidance: start -->
## Lokale RAG (projektübergreifend)

Der zentrale, nur lesende LocalRAG-Singleton liegt unter `P:\LocalRAG`. Bei Wissens- und Dokumentationsfragen zuerst RAG abfragen; Quellcode weiterhin mit der Codesuche untersuchen. Treffer sind nur Wegweiser: Maßgeblich bleibt die jeweilige Originalquelle.

- `knowledge_system.knowledge_search(query, limit)` — kanonische Querschnittsnotizen aus `P:\Workspace\Knowledge` zu Projekten, Methoden, Policies, Entscheidungen und Migration.
- `knowledge_system.project_search(project_id, query, limit)` — versionierte Projektdokumentation. Freigegebene IDs: `amg_files`, `cooltool`, `copulaantrag`, `komponentenpruefstand`, `mbintra`, `microtubedesignexplorer`, `openclaw-setup`, `pdfscrape`, `pv_biz`, `review_papers`, `schaltkombinationen`, `simdbwiki`, `thermocopula`, `thermocycles`, `thermoexpress`, `thermoexpresql`, `thermoexpressref`, `thermoml`, `wasseraufspritzung_doe_auswertung`, `wasseraufspritzungturinsae`, `wetbulbpotential`.
- `knowledge_system.literature_search(query, limit, topic, source)` — lokale Primärliteratur aus `P:\Literature`. Themenfilter: `Books`, `Papers`, `Standards`, `PV_Solar`; enthalten sind u. a. Statistik/Copulas, Thermodynamik/Wärmeübertragung, Fahrzeug- und Messdaten, Data Engineering/ML sowie PV (Energierecht, Mieterstrom, Finanzierung, Messwesen, Netzanschluss, Speicher, Steuern).
- Nach jeder Suche Provenienz prüfen und mit `knowledge_system.fetch(result_id)` den vollständigen Abschnitt holen; Vorschauen nie allein als Beleg verwenden. `knowledge_system.status()` zeigt Index- und Quellenstand.

Spezialadapter, sofern der Client sie anbietet:

- `copulaantrag_rag`: Ausschreibungen, Hintergrunddokumente und Antragsliteratur (`search`, `fetch`, `status`).
- `thermoexpress_rag`: ThermoExpress-Wiki, Regeln und Konflikte (`search_docs`, `get_doc_section`, `get_normative_rules`, `resolve_conflicts`, `status`).
- `mbintra_rag`: MBintra-Dokumente, Passagen, Abbildungen und Beziehungen (`search_knowledge`, `fetch_passage`, `fetch_document`, `fetch_figure`, `list_documents`, `related_documents`).

Fehlt ein Adapter wegen des geöffneten Roots, ihn rootunabhängig als STDIO-MCP aus `P:\LocalRAG` starten/registrieren: `P:\LocalRAG\.venv\Scripts\python.exe -m local_rag.adapter --project-id <knowledge_system|copulaantrag|thermoexpress|mbintra>` (Arbeitsverzeichnis `P:\LocalRAG`). Diagnose: `& P:\LocalRAG\scripts\status.ps1 -Deep`.
<!-- local-rag-agent-guidance: end -->
