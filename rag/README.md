<!-- localrag-repo-readme-template: 1 -->
# LocalRAG-Anbindung dieses Repositories

Dieses Repository verwendet den zentralen, ausschliesslich lokalen LocalRAG
unter `P:\LocalRAG`.

## Projektidentitaet

- Project ID: `microtubedesignexplorer`
- Modus: `generic`
- Konfiguration: `rag/project.toml`
- Abgeleitete Daten: `P:\RAGData`
- Zentrale Primaerliteratur: `P:\Literature`

Die Project ID ist dauerhaft und muss dem zentralen Projektkatalog entsprechen.
MCP-Aufrufer duerfen keinen beliebigen Repository-Pfad auswaehlen.

## Was wird indexiert?

Die verbindlichen Include- und Exclude-Regeln stehen in `rag/project.toml`.
Standardmaessig werden kuratierte Markdown-Dokumente indexiert. Ausgeschlossen
sind insbesondere:

- `rag/` einschliesslich dieser Betriebsanleitung,
- Git-, Environment-, Cache-, Build- und Ergebnisverzeichnisse,
- generierte Sammeldateien und Transkriptionen,
- `.md.obsidian-disabled`, Primaerliteratur und RAG-Indizes.

## Datenzuordnung

- Projektspezifisches Wissen bleibt im Repository.
- Projektuebergreifendes Wissen gehoert nach `P:\Workspace\Knowledge`.
- Allgemeine externe Literatur gehoert nach `P:\Literature`.
- Extraktionen, Embeddings und Indizes gehoeren nach `P:\RAGData`.
- Generierte RAG-Daten duerfen nicht in Git committed werden.

## Dokumentation aktualisieren

1. Dokumentation bearbeiten, Links und Quellen pruefen.
2. Aenderungen moeglichst committen.
3. Status pruefen.
4. Projektinhalt aktualisieren.
5. Search -> Fetch testen.

```powershell
& P:\LocalRAG\scripts\status.ps1 -ProjectId microtubedesignexplorer
& P:\LocalRAG\scripts\update-content.ps1 -ProjectId microtubedesignexplorer -Check
& P:\LocalRAG\scripts\update-content.ps1 -ProjectId microtubedesignexplorer
```

Ein fehlgeschlagener Build darf den bisherigen aktiven Index nicht ersetzen.

## Neues Repository anbinden

```powershell
& P:\LocalRAG\scripts\onboard-repo.ps1 `
  -RepoRoot <ABSOLUTER_REPOSITORY-PFAD> `
  -ProjectId <PROJECT_ID> `
  -Mode generic
```

Das Onboarding aktualisiert danach den zentralen Dokumentindex und fuehrt fuer
das neue Projekt einen Search -> Fetch-Smoke-Test aus. Schlaegt ein Schritt fehl,
werden Katalogeintrag und neu erzeugte Repo-Dateien zurueckgerollt. Anschliessend
muessen `rag/project.toml` sowie die Git-Diffs beider Repositories geprueft werden.
Das Onboarding committet und pusht niemals automatisch.

## Retrieval verwenden

Fuer Projektdokumentation:

1. `project_search(project_id, query)` aufrufen.
2. Provenienz und Quellpfad kontrollieren.
3. Den Treffer mit `fetch(result_id)` vollstaendig laden.
4. Erst danach Schlussfolgerungen ziehen.

Fuer wissenschaftliche Quellen entsprechend `literature_search` und anschliessend
`fetch` verwenden. Vorschauen allein sind keine ausreichende Beleggrundlage.

## Wann ist ein spezialisiertes Backend noetig?

Nur bei Anforderungen, die generische Suche nicht abbildet, etwa dokumentierte
Prioritaets-/Konfliktregeln, ACLs, strukturierte Abbildungen oder besondere
Rankinglogik. Der Modus `both` muss die doppelte Indexierung begruenden.

## Fehlerbehebung

1. `status.ps1 -ProjectId microtubedesignexplorer -Deep` ausfuehren.
2. Project ID, Katalogeintrag und `rag/project.toml` vergleichen.
3. Include-/Exclude-Regeln pruefen.
4. `%LOCALAPPDATA%\LocalRAG\logs` pruefen.
5. Update erneut ausfuehren.

Keine SQLite-Dateien, Qdrant-Collections oder Aliase manuell aendern.
