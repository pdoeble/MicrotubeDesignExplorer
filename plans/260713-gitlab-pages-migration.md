# GitLab-Pages-Migration (Self-Managed) — Living Plan

> **Path:** `/plans/260713-gitlab-pages-migration.md`
> **Master plan:** `/plans/260710-master-roadmap.md`
> **Related:** `/plans/260710-ci-pages-release.md`,
> `/plans/260713-github-gitlab-mirroring.md`,
> `/wiki/decisions/ADR-0010-github-canonical-gitlab-internal-mirror.md`
> **Milestone:** post-M9 deployment portability / on-premise readiness
> **Workstream:** deployment, CI/CD, access control, operations
> **Owner:** project maintainer; GitLab administrators for instance prerequisites
> **Status:** blocked on external GitLab Pages enablement; repository preparation ready
> **Created:** 2026-07-13
> **Last updated:** 2026-07-13

## Kurzurteil

Die Anwendung kann technisch auf GitLab Pages der Self-Managed-Instanz
`https://gitlab.hs-esslingen.de/` betrieben werden. React/Vite, der Module Web
Worker, Pyodide, WebAssembly, NumPy/Pydantic-Wheels, Plotly und alle Exporte
arbeiten vollständig statisch und benötigen weder Backend noch Datenbank noch
Server-Session. GitLab Pages unterstützt statische HTML-/JavaScript-/Wasm-Sites
und geschützte Sites in privaten oder internen Projekten.

Ein sofortiger produktiver Deploy ist trotzdem **noch nicht freigabefähig**.
Folgende Gates sind offen:

1. GitLab Pages und Pages Access Control müssen instanzweit durch die
   Administratoren aktiviert und mit DNS/TLS/OAuth fertig konfiguriert werden.
2. Der Vite-Basispfad ist derzeit ausschließlich auf GitHub Actions oder `/`
   ausgelegt. Er muss den tatsächlichen `CI_PAGES_URL`-Pfad unterstützen, ohne
   das bestehende GitHub-Verhalten zu ändern.
3. Der aktuelle shareable URL state überschreitet mit etwa 4.3 KiB das
   GitLab-Pages-Standardlimit von 2,048 Zeichen. Vor dem Canary ist entweder
   `gitlab_pages['max_uri_length'] >= 8192` erforderlich oder eine
   rückwärtskompatible kompakte URL-Kodierung muss ausgeliefert sein. Für eine
   robuste Dauerlösung sind beide Maßnahmen vorgesehen: vorübergehendes
   Serverlimit plus kompakte, versionierte Kodierung.
4. Der vorhandene Runner ist online, aber sein Build-Image, seine
   Netzwerkfreigaben, Artefaktgrenzen und die ausgelieferten MIME-Typen müssen
   in einem Canary nachgewiesen werden.

Bis alle Gates nachweislich grün sind, bleibt GitHub das kanonische Repository,
GitHub Actions bleibt der maßgebliche CI-/Pages-Pfad und
`https://pdoeble.github.io/MicrotubeDesignExplorer/` bleibt die produktive
Seite. Dieser Plan autorisiert **weder** das Abschalten noch eine Umleitung der
GitHub Page.

## Scope und Nicht-Ziele

Dieser Plan umfasst:

- die technische und organisatorische Vorbereitung eines zusätzlichen,
  zugriffsgeschützten GitLab-Pages-Deployments auf der Hochschule-Instanz;
- die Portabilität desselben statischen Buildoutputs zwischen GitHub Pages und
  GitLab Pages;
- CI-/Runner-, Pfad-, Authentifizierungs-, DNS-/TLS-, Limit-, Smoke-Test-,
  Rollback- und Betriebsanforderungen;
- einen sicheren Parallelbetrieb und die Kriterien für eine mögliche spätere
  Umstellung auf GitLab als primären Pages-Ursprung;
- die Trennung zwischen Pages-Hosting, Repository-Hoheit und öffentlicher
  Langzeitarchivierung/Zitation.

Nicht Bestandteil der aktuellen Dokumentationsphase sind:

- das Anlegen oder Aktivieren einer `.gitlab-ci.yml`;
- Änderungen an GitLab-Projekt- oder Instanzeinstellungen;
- das Abschalten, Umleiten oder Herabstufen der GitHub Page;
- ein Wechsel der kanonischen Repository-, Issue-, Release-, CITATION- oder
  DOI-Links;
- Änderungen an Physik, numerischen Verträgen, Golden Data oder
  `/source_materials`;
- serverseitige Berechnung, Persistenz oder ein neuer Produktionsdienst.

## Verbindliche Entscheidungsgrenzen

### Aktuell gültig

- `AGENTS.md` legt GitHub Pages als festen Deploymentpfad fest.
- ADR-0010 hält GitHub als kanonische Quelle fest und verbietet derzeit eine
  GitLab-CI-/Pages-Konfiguration.
- Das GitLab-Projekt ist ein interner Downstream-Mirror; unabhängige Commits auf
  GitLab sind nicht erlaubt.

### Für die Vorbereitung neu bestätigt

- Ein späterer GitLab-Pages-Betrieb wird vorbereitet, ohne die aktuelle
  GitHub-Produktion zu verändern.
- Der erste GitLab-Deploy ist ein zusätzlicher Canary/Shadow-Deploy, kein
  Cutover.
- `pages_access_level=public` beziehungsweise die UI-Option **Everyone** wird
  nicht verwendet. Für das interne Projekt ist zunächst **Only project
  members** vorgesehen; **Everyone with access** kann nach expliziter
  Maintainer-Entscheidung den gesamten internen Hochschulnutzerkreis öffnen.

### Vor Implementierung zwingend neu zu entscheiden

Vor dem Commit einer `.gitlab-ci.yml` oder einer Änderung der Repository-Hoheit
muss ein neues ADR ADR-0010 gezielt ergänzen oder teilweise ersetzen. In
demselben kohärenten Änderungssatz müssen `AGENTS.md`, die Release-Dokumentation
und der Masterplan auf den dann tatsächlich freigegebenen Parallelbetrieb
aktualisiert werden. Eine angestrebte Migration allein hebt die aktuellen
Entscheidungen nicht stillschweigend auf.

## Audit-Snapshot vom 2026-07-13

### Hochschule-GitLab

| Befund | Nachweis | Bewertung |
| --- | --- | --- |
| GitLab Self-Managed `19.1.2`, Revision `d1f345880dd` | authentifizierte read-only API `GET /api/v4/version` | Aktuelle Pages-Syntax `pages.publish` ist verfügbar. |
| Projekt ID `4659`, `phdoeble/MicrotubeDesignExplorer` | Projects API | Zielprojekt existiert. |
| Projektsichtbarkeit `internal` | Projects API | Mit Hochschulrichtlinie vereinbar. |
| `pages_access_level=private` | Projects API | Beabsichtigt derzeit Zugriff nur für Projektmitglieder; nicht mit Projektsichtbarkeit verwechseln. |
| CI/CD aktiviert, Auto DevOps deaktiviert | Projects API | Explizite Pipeline kann später verwendet werden; keine versteckte Auto-DevOps-Pipeline. |
| Instance Runner `54` online, Linux/amd64, Runner `19.1.1`, untagged jobs erlaubt | Runners API; Beschreibung nennt Docker `24.0.6` | Grundvoraussetzung vorhanden; Toolchain und Egress noch nicht nachgewiesen. |
| Keine vorhandenen Projektpipelines | Pipelines API | Es gibt noch keinen GitLab-CI-Nachweis. |
| Pages-Menü fehlt; Pages-Domains-API antwortet `404` | Benutzerbeobachtung plus read-only API-Probe | Konsistent mit noch nicht instanzweit freigeschaltetem Pages-Dienst; Administrator muss den Zustand verbindlich bestätigen. |

### Anwendung und aktueller GitHub-Deploy

| Befund | Gemessener Stand | Bewertung |
| --- | --- | --- |
| Produktionsbuild | 25 Dateien, 33.18 MiB unkomprimiert, 14.64 MiB als ZIP | Weit unter dem GitLab-Pages-Dateilimit von 200,000 Einträgen; Instanz-Artefaktlimit bleibt zu bestätigen. |
| Größte Einzeldateien | Plotly-Sourcemap 10.62 MiB, Pyodide Wasm 9.61 MiB, Plotly JS 4.68 MiB | Für Pages plausibel; Proxy-/Artefakt-Einzeldateilimits prüfen. |
| GitHub-Subpfadbuild | `/MicrotubeDesignExplorer/...` korrekt in `dist/index.html` und Worker eingebettet | Bestehendes GitHub-Verhalten funktioniert und ist zu konservieren. |
| GitHub Live-Header | `.wasm`: `application/wasm`; `.mjs`: `text/javascript`; `.zip`: ZIP; `.whl`: `application/octet-stream` | Diese Matrix ist auf GitLab identisch zu prüfen. |
| GitHub Live-Smoke | Chromium: Pyodide-Start, reduzierte Rechnung, Plots sowie JSON/HTML/PNG/SVG-Exporte bestanden | Referenz für GitLab-Canary. |
| URL state | Standardrequest: 4,312 Zeichen im `state`-Wert; GitHub request target ca. 4,344 Zeichen | GitHub liefert HTTP 200; GitLab-Pages-Default `max_uri_length=2048` reicht nicht. |

## Technische Kompatibilitätsmatrix

| Bereich | Ist-Zustand | GitLab-Pages-Eignung | Erforderliche Maßnahme |
| --- | --- | --- | --- |
| React/TypeScript/Vite | Statischer `dist/`-Output | geeignet | `dist` über `pages.publish` veröffentlichen. |
| Routing | Hash-Routing plus Query-Parameter, kein BrowserRouter | geeignet | Kein serverseitiger SPA-Fallback erforderlich. Direkte `#/...`-Links testen. |
| Vite base | `GITHUB_ACTIONS` + `GITHUB_REPOSITORY`, sonst `/` | bedingt | Expliziten, normalisierten Basispfad ergänzen und aus `CI_PAGES_URL` ableiten. GitHub-Fallback unverändert lassen. |
| Module Web Worker | Vite-erzeugter same-origin Worker | geeignet | Root-, Projektpfad-, Single-Domain- und Unique-Domain-Build testen. |
| Pyodide/WebAssembly | Same-origin, single-threaded | geeignet | MIME, OAuth-Session, Wasm-CSP und Download aller Runtime-Assets im Canary prüfen. Kein COOP/COEP oder SharedArrayBuffer erforderlich. |
| Python Core | Reproduzierbares lokales Wheel | geeignet | Wheel im Runner mit `uv` bauen; SHA-256-Manifest und direkte Python-Parität prüfen. |
| NumPy/Pydantic | Build-time kopierte, hashgeprüfte Pyodide-Wheels | geeignet | Runner-Egress oder internen Cache für jsDelivr sicherstellen. Keine Runtime-CDN-Abhängigkeit. |
| Plotly | Gebündeltes JavaScript, clientseitige SVG/PNG-Exporte | geeignet | Große Bundle-/Sourcemap-Dateien und CSP prüfen. |
| HTML/PDF report | Clientseitig; PDF über Printdialog | geeignet | Popup/Blob/Data-URI-Verhalten unter den institutionellen Browserregeln testen. |
| URL state | Versioniertes Base64URL-JSON | derzeit nicht vollständig geeignet | URI-Limit >= 8192 und später rückwärtskompatible kompakte Kodierung. |
| Access Control | Noch nicht instanzweit verfügbar | blockiert | Pages Access Control aktivieren; niemals öffentliches Pages-Level wählen. |
| CI Runner | Online, aber für dieses Projekt unbenutzt | bedingt | Reproduzierbares Image, Egress, Cache, Speicher und Timeout nachweisen. |
| Provenienz | Appversion und Commit werden zur Buildzeit injiziert | geeignet | GitLab: `VITE_APP_VERSION=$CI_COMMIT_REF_NAME`, `VITE_COMMIT_HASH=$CI_COMMIT_SHA`. |
| Repository-Links | UI, CITATION und Release-Gates zeigen bewusst auf GitHub | geeignet im Parallelbetrieb | Erst bei separatem Authority-Cutover ändern; nicht für den Canary. |
| Secrets | Keine Runtime-Secrets | geeignet | Auth-Smoke-Token nur masked/protected in CI; niemals in Buildartefakt oder URL. |

## Zieltopologie

### Phase A — aktueller Zustand

```text
lokaler main-Branch
  ├─ Push → GitHub (kanonisch) → GitHub Actions → GitHub Pages (produktiv)
  └─ Push → GitLab (interner Mirror; keine CI/Pages)
```

### Phase B — empfohlener Parallelbetrieb

```text
identischer freigegebener Commit
  ├─ GitHub Actions → öffentliche GitHub Page (weiterhin produktiv)
  └─ GitLab CI      → authentifizierte GitLab Page (Canary / on-premise)
```

Die Buildartefakte dürfen wegen unterschiedlicher Basispfade nicht zwingend
byte-identisch sein. Commit, Lockfiles, Python-Wheel, wissenschaftlicher Request
Hash, Ergebnisfelder, Masken und Provenienz müssen jedoch identisch sein.

### Phase C — optionaler späterer Authority-Cutover

Ein Wechsel von GitHub zu GitLab als kanonisches Repository ist **nicht** mit
dem Pages-Hosting-Cutover gleichzusetzen. Die Instanz bietet für dieses Projekt
aktuell kein serverseitiges Pull-Mirroring. Soll GitLab später kanonisch werden
und GitHub Pages weiterlaufen, ist vorher genau eine belastbare Synchronisation
zu beschließen:

1. freigeschaltetes GitLab→GitHub Push-Mirroring;
2. ein explizit genehmigter, geschützter CI-Mirror mit minimalem GitHub-Token;
3. ein dokumentierter Maintainer-Dual-Push mit Ref-Paritätsgate.

Ohne eine dieser Lösungen bleiben unabhängige GitLab-Commits verboten. Ein
Pages-Cutover darf nicht versehentlich die öffentliche GitHub Page veralten
lassen.

## Administrator-Voraussetzungen

Die Freischaltungsanfrage soll mindestens folgende Punkte beantworten und als
Betriebsnachweis zurückliefern.

### Domain, DNS und TLS

- [ ] Einen eigenen Pages-Ursprung festlegen, der nicht der GitLab-Ursprung ist.
  Bei `gitlab.hs-esslingen.de` wäre eine Schwester-Domain wie
  `pages.hs-esslingen.de` grundsätzlich sicherer als ein Unterpfad auf der
  GitLab-Domain; die endgültige Domain bestimmt die Administration.
- [ ] Eine der unterstützten Betriebsarten festlegen:
  - Wildcard-Domain: `https://<namespace>.<pages-domain>/<project>`;
  - Single-Domain: `https://<pages-domain>/<namespace>/<project>` mit
    `gitlab_pages['namespace_in_path']=true`;
  - standardmäßig aktivierte Unique Domain: eigener Host und Pfad `/`.
- [ ] DNS, HTTPS-Zertifikat, Zertifikatskette, Redirect HTTP→HTTPS und
  Erreichbarkeit aus dem Hochschulnetz/VPN dokumentieren.
- [ ] Pages-Domain so wählen, dass keine GitLab-Session-Cookies an Pages-Sites
  vererbt werden. Bei öffentlich erzeugbaren Pages-Sites Public-Suffix-List-
  Anforderungen bewerten.

### Pages-Dienst und Zugriff

- [ ] `pages_external_url` konfigurieren und GitLab Pages/Pages NGINX oder den
  vorgesehenen Reverse Proxy aktivieren.
- [ ] `gitlab_pages['access_control']=true` setzen und GitLab reconfigure/restart
  erfolgreich abschließen.
- [ ] OAuth-Systemanwendung, HTTPS-Redirect-URI und vorzugsweise den reduzierten
  `read_api`-Scope konsistent konfigurieren.
- [ ] In **Admin > Settings > Preferences > Pages** öffentlichen Zugriff auf
  alle Pages-Sites deaktivieren, sofern dies der Hochschulrichtlinie entspricht.
  Mindestens auf Projektebene darf für diese Site nie **Everyone** gewählt
  werden.
- [ ] Entscheiden, ob der Pilot nur Projektmitglieder oder alle normalen
  angemeldeten internen Benutzer zulässt. Externe Benutzer erhalten im Modus
  **Everyone with access** nur mit Projektmitgliedschaft Zugriff.
- [ ] SAML-/SSO-Weiterleitung testen, falls die Instanz SSO erzwingt.
- [ ] Cache-Verzögerung bei Access-Level-Änderungen (typisch unter einer Minute)
  in den Betriebsablauf aufnehmen.

### Limits, Storage und Betrieb

- [ ] Übergangsweise `gitlab_pages['max_uri_length']` auf mindestens `8192`
  setzen. `0` (unbegrenzt) ist nicht erforderlich. Nach Einführung kompakter
  URLs kann eine Rückkehr zum Instanzstandard bewertet werden.
- [ ] Zulässige Job-Artefaktgröße mit mindestens 50 MiB Headroom bestätigen;
  aktueller Build: 33.18 MiB unkomprimiert und 14.64 MiB als ZIP.
- [ ] Maximalgröße einzelner Proxy-/Artefaktdateien über 11 MiB bestätigen.
- [ ] Pages-Deployment-Storage, Backup, Aufbewahrung, Monitoring, Healthcheck,
  Logzugriff und Wiederanlauf nach GitLab-Updates dokumentieren.
- [ ] Pages-Daemon-Zugriff auf die interne GitLab API nachweisen; bei getrenntem
  Pages-Server `internal_gitlab_server`, Secrets-Reihenfolge und Storage gemäß
  GitLab-Admin-Dokumentation umsetzen.
- [ ] Runner-Kapazität: mindestens Linux amd64, Node 22, Python >=3.12, `uv`,
  pnpm 11.11.0, ungefähr 1 GiB freier Arbeitsspeicher für Browserbuild plus
  Reserve und ein ausreichend langer Jobtimeout. Der echte Peak wird im Canary
  gemessen und ersetzt diese Planungsannahme.

### Build-Netzwerk

Für einen kalten Build muss der Runner kontrollierten HTTPS-Zugriff auf die
folgenden, durch Lockfiles beziehungsweise Hashes abgesicherten Quellen haben
oder institutionelle Mirrors bereitstellen:

- npm/pnpm Registry für `pnpm install --frozen-lockfile`;
- PyPI für `uv sync --locked` und den Hatchling-Wheelbuild;
- `cdn.jsdelivr.net/pyodide/v314.0.2/full/` für noch nicht gecachte
  Pyodide-Paketwheels; jedes heruntergeladene Wheel wird gegen den
  Pyodide-Lockfile-SHA-256 geprüft;
- die freigegebene Bezugsquelle für das gepinnte `uv`-Werkzeug oder ein
  vorgebautes internes CI-Image.

Caches dürfen die Builds beschleunigen, sind aber keine Vertrauensquelle.
Cachekeys müssen mindestens `pnpm-lock.yaml`, `python/uv.lock`, Pyodide-Version
und Runner-Plattform enthalten.

## Geplante Repository-Änderungen nach Freischaltung

Keine der folgenden Änderungen wird vor dem erforderlichen ADR und einer
erreichbaren Pages-Canary-Umgebung aktiviert.

### 1. Hosting-neutraler Vite-Basispfad

`vite.config.ts` erhält einen expliziten `VITE_PUBLIC_BASE_PATH` mit
Normalisierung auf führenden und abschließenden Slash. Die Reihenfolge soll
sein:

1. expliziter `VITE_PUBLIC_BASE_PATH`;
2. bestehende GitHub-Actions-Ableitung aus `GITHUB_REPOSITORY`;
3. lokaler Fallback `/`.

Die GitLab-Pipeline leitet `VITE_PUBLIC_BASE_PATH` aus dem Pfadanteil von
`CI_PAGES_URL` ab. Damit funktionieren Unique Domains (`/`), klassische
Projektseiten (`/<project>/`) und Single-Domain-Sites
(`/<namespace>/<project>/`) ohne hartcodierte Hochschuldomain. Der Worker darf
weiter ausschließlich `import.meta.env.BASE_URL` verwenden.

Pflichttests:

- `base=/`;
- `base=/MicrotubeDesignExplorer/`;
- `base=/phdoeble/MicrotubeDesignExplorer/`;
- fehlerhafte Werte ohne Slashes werden normalisiert oder mit klarer Meldung
  abgelehnt;
- bestehender GitHub-Build erzeugt weiterhin exakt den bisherigen Projektpfad.

### 2. Rückwärtskompatible URL-state-Strategie

Kurzfristig schützt das 8-KiB-Serverlimit die vorhandene Kodierung. Dauerhaft
wird ein neues URL-state-Schemaversion-Format entworfen, das wissenschaftliche
Eingaben verlustfrei und deterministisch komprimiert. Dabei gelten:

- alte `version=1.0.0`-Links bleiben dekodierbar;
- keine Rundung, Einheitenänderung oder Auslassung von Nicht-Defaultwerten;
- Defaults-Version wird mitgeführt, falls nur Abweichungen gespeichert werden;
- Encoder/Decoder erhalten Roundtrip-, Unicode-, Grenzwert- und
  Migrationsregressionen;
- Zielgröße für den Default- und typische geänderte Requests: unter 1,800
  Zeichen einschließlich Pfad und Query;
- bei unvermeidbar größeren Requests zeigt die UI eine verständliche Warnung,
  statt einen scheinbar teilbaren defekten Link zu erzeugen.

Da dies ein persistierter öffentlicher Zustand ist, erfordert die
Schemaversionierung eine Interface-Dokumentation und bei Breaking Changes ein
ADR.

### 3. GitLab-CI-Konfiguration

Die spätere `.gitlab-ci.yml` bildet die bestehenden Gates ab und verwendet die
aktuelle Syntax mit einem frei benannten Job und:

```yaml
pages:
  publish: dist
  expire_in: never
```

Der Jobname `pages` selbst wird nicht verwendet, da diese Form veraltet ist.
Der produktive Pages-Job läuft nur für den Defaultbranch; Merge Requests führen
Qualitäts- und Buildchecks aus, dürfen aber ohne gesonderte Entscheidung keine
Parallel-Deployments erzeugen.

Mindestens auszuführende Schritte:

1. Checkout des unveränderten Commits;
2. `python scripts/check_prohibited_files.py`;
3. gepinnte Toolchain bereitstellen;
4. `pnpm install --frozen-lockfile` und `uv sync --locked`;
5. Python: Ruff, Ruff format, mypy, pytest und Contract-Drift;
6. Frontend: Contract-Generierung/Drift, TypeScript, ESLint, Prettier, Vitest;
7. `VITE_APP_VERSION=$CI_COMMIT_REF_NAME` und
   `VITE_COMMIT_HASH=$CI_COMMIT_SHA` setzen;
8. Basispfad aus `CI_PAGES_URL` setzen und `pnpm build`;
9. `dist/index.html`, Artefaktgröße, Dateianzahl, verbotene Dateien und
   erwartete Pyodide/Wheel-Manifeste prüfen;
10. `dist` als nicht ablaufendes Defaultbranch-Pages-Deployment publizieren;
11. nach Deployment einen authentifizierten Smoke-Test ausführen.

Das exakte kombinierte Node-/uv-Image wird erst nach Runner-Canary festgelegt.
Es muss per unveränderlichem Digest oder internem freigegebenem Tag gepinnt
werden. Installationsskripte dürfen nicht ungeprüft `latest` beziehen.

### 4. Authentifizierter Deployed-Smoke

GitLab Pages akzeptiert für geschützte Sites einen Bearer Access Token mit
`read_api`. Falls ein automatischer Post-Deploy-Smoke gewünscht ist, wird ein
dedizierter, minimal berechtigter und kurzlebiger Project Access Token als
masked/protected Variable gespeichert. Er darf weder ausgegeben noch an fremde
Origins weitergeleitet werden. Alternativ bleibt der externe Smoke zunächst ein
manuell dokumentierter Browsernachweis.

Der vorhandene Playwright-Test erhält die Pages-URL über
`PLAYWRIGHT_BASE_URL`. Authentifizierung wird in einem GitLab-spezifischen
Adapter gekapselt; wissenschaftliche Testlogik bleibt hostneutral.

## Milestones und Tasks

### G0 — Readiness-Audit und Plan

- [x] Repository-, Worker-, Routing-, Build- und Exportpfade prüfen.
- [x] Aktuelle GitLab-19.1-Dokumentation für Pages, Access Control,
  `pages.publish`, Domains, Runner und Limits prüfen.
- [x] Instanz/Projekt/Runner read-only inventarisieren.
- [x] Produktionsartefakt vermessen und GitHub-Live-Smoke ausführen.
- [x] Basispfad- und URI-Limit-Risiken identifizieren.
- [x] Living Plan erstellen.

### G1 — Externe Instanzfreischaltung

- [ ] Pages-Domainmodus, DNS, TLS und Netzwerkreichweite freigeben.
- [ ] Pages-Dienst und Access Control aktivieren.
- [ ] Nichtöffentliche Zugriffspolitik bestätigen.
- [ ] URI-, Artefakt-, Datei- und Runnerlimits bestätigen.
- [ ] Test-/Produktions-URL, OAuth-Verhalten und Betriebsansprechpartner
  dokumentieren.
- [ ] Pages-Reiter und Pages-API im Projekt nachweislich verfügbar.

**Blocker owner:** GitLab/IT administration.

### G2 — Entscheidungs- und Codevorbereitung

- [ ] ADR für GitHub+GitLab-Parallelbetrieb beschließen; ADR-0010 gezielt
  aktualisieren/ersetzen.
- [ ] `AGENTS.md`, Masterplan und Release-Handbuch konsistent aktualisieren.
- [ ] Hosting-neutralen Vite-Basispfad plus Regressionstests implementieren.
- [ ] URL-state-Policy beschließen; kurzfristiges Limit und langfristige
  Kodierung dokumentieren.
- [ ] `.gitlab-ci.yml` mit vollständigen Qualitätsgates implementieren.
- [ ] CI-Lint gegen exakt GitLab 19.1.2 ausführen.
- [ ] Keine Änderungen an `.github/workflows/pages.yml`, außer ein Test weist
  einen echten hostneutralen Bedarf nach.

### G3 — GitLab Canary

- [ ] Pipeline auf einem explizit freigegebenen Commit ausführen.
- [ ] `CI_PAGES_URL`, Unique-Domain-Status und tatsächlichen Basispfad
  protokollieren.
- [ ] MIME-/Header-/Redirectmatrix prüfen.
- [ ] Zugriffsmatrix für anonym, internes Nichtmitglied, Projektmitglied und
  externen Benutzer prüfen.
- [ ] Pyodide-Initialisierung, reduzierte und vollständige Standardrechnung
  durchführen.
- [ ] Numerische Parität gegen direkte Python-Ausführung und denselben
  GitHub-Commit prüfen.
- [ ] URL-state-Links unterhalb und oberhalb von 2 KiB prüfen.
- [ ] Alle Plot- und Reportexporte prüfen.
- [ ] Browsermatrix Chromium, Firefox und WebKit ausführen; bekannte lokale
  Firefox-Vite-Einschränkung nicht mit einem Production-Pages-Fehler
  verwechseln.
- [ ] Laufzeit, Speicher, Downloadmenge, Cacheverhalten und Runnerverbrauch
  protokollieren.

### G4 — Parallelbetrieb

- [ ] GitLab Page als sekundäre on-premise URL dokumentieren, ohne GitHub-
  Redirect oder Canonical-Link-Änderung.
- [ ] Für jeden Releasekandidaten SHA-Parität GitHub/GitLab und grüne Deploys
  verlangen.
- [ ] Mindestens 14 Tage beziehungsweise zwei erfolgreiche Releasekandidaten
  beobachten, je nachdem was später eintritt.
- [ ] Update-, Ausfall-, Rollback- und Authentifizierungsfall praktisch testen.
- [ ] Betriebsevidence in `wiki/release-and-maintenance.md` aufnehmen.

### G5 — Optionaler On-Premise-Cutover

- [ ] Scope getrennt entscheiden: nur Pages primär oder auch Repository/Issues/
  Releases kanonisch.
- [ ] Verlässlichen GitLab→GitHub-Synchronisationspfad nachweisen, solange die
  GitHub Page weiterlaufen soll.
- [ ] Review-, CITATION-, DOI-, Release- und UI-Repository-Links einzeln
  migrieren oder bewusst auf GitHub belassen.
- [ ] Neues ADR mit Cutoverdatum, Primär-URL, Rollbackfenster und Owner
  beschließen.
- [ ] GitHub Page nur nach einer weiteren ausdrücklichen Entscheidung umleiten
  oder abschalten. Standard dieses Plans ist: weiter betreiben.

## Zugriffstestmatrix

| Benutzerfall | `Only project members` | `Everyone with access` bei internem Projekt |
| --- | --- | --- |
| Anonym | kein Zugriff; Login/Autorisierung erforderlich | kein Zugriff; Login erforderlich |
| Normales internes Hochschulkonto, kein Mitglied | kein Zugriff | Zugriff |
| Projektmitglied ab Guest | Zugriff | Zugriff |
| Als external markierter GitLab-Benutzer ohne Mitgliedschaft | kein Zugriff | kein Zugriff |
| Externer Benutzer mit Projektmitgliedschaft | Zugriff | Zugriff |

Zusätzlich prüfen:

- Die Startseite und **jedes** Runtime-Asset liefern nach erfolgreicher
  Authentifizierung Inhalt statt Login-HTML oder Redirectschleife.
- Ein abgelaufener/revozierter Token liefert keinen Site-Inhalt.
- Query und Fragment bleiben über OAuth-Redirects erhalten; andernfalls gehen
  geteilte wissenschaftliche Zustände verloren.
- Keine Pages-Session, kein Token und keine GitLab-Cookies erscheinen in
  Reportexporten, URLs, Konsolenlogs oder Buildartefakten.

## Abnahme- und Reproduzierbarkeitsnachweise

### Repository-/CI-Gates

```powershell
python scripts/check_prohibited_files.py
cd python
uv sync --locked
uv run ruff check ..
uv run ruff format --check ..
uv run mypy .
uv run pytest
cd ..
pnpm install --frozen-lockfile
pnpm generate:contracts
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
python scripts/check_release_gate.py
```

Danach müssen generierte Contracts unverändert und der Working Tree sauber
sein. Die GitLab-Pipeline darf keine Golden Files aktualisieren.

### Deployment-Gates je Host

- HTTP 200 für HTML, JS, CSS, Worker, `.mjs`, `.wasm`, `.zip`, alle Pyodide
  Wheels und das `microtubes_core`-Wheel;
- korrekte MIME-Typen, insbesondere `application/wasm` und ein ausführbarer
  JavaScript-MIME-Typ für `.mjs`;
- keine Mixed-Content-, CORS-, CSP-, OAuth- oder Workerfehler;
- `pnpm exec playwright test --project=chromium
  tests/e2e/app-acceptance.spec.ts -g "runs a reduced paper-default workflow"`;
- vollständiger Paper-Default-Run und Vergleich der skalaren Werte, Arrays,
  Masken, Screenübergänge und Request-/Provenienz-Hashes;
- JSON, standalone HTML, PNG, SVG und Print/PDF funktionieren;
- URL-state-Roundtrip aus einer frisch geöffneten authentifizierten Session;
- Appanzeige enthält exakt den deployten Commit SHA.

### Hostübergreifende Parität

Für denselben Commit und Request:

- GitHub und GitLab müssen denselben `SimulationRequest` dekodieren;
- Python-Wheel-Manifest und wissenschaftliche Contractversion stimmen überein;
- Ergebnisse erfüllen mindestens die bestehenden Toleranzen
  `rtol=1e-8`, `atol=1e-10`;
- erwartete Differenzen sind auf Basispfad, Host-URL, Access-Control-Header und
  Buildplattform-Metadaten beschränkt und werden dokumentiert.

## Rollback

Ein GitLab-Fehler darf GitHub Pages nicht beeinträchtigen.

1. GitHub Pages und die GitHub-Workflows bleiben während Canary und
   Parallelbetrieb unverändert aktiv.
2. Bei fehlerhaftem GitLab-Deploy wird die letzte nachweislich funktionierende
   GitLab-Pages-Deploymentversion wiederhergestellt oder der Pages-Job für
   weitere Commits manuell gesperrt.
3. Keine DNS-/Redirectänderung darf zuerst auf GitLab zeigen, solange die
   Abnahme nicht abgeschlossen ist.
4. Ein Code-Rollback erfolgt als normaler Revert-Commit; kein `reset --hard`,
   keine Golden-File-Neugenerierung und keine Änderung der Physik.
5. Nach einem partiellen Dual-Push werden `refs/heads/main` auf GitHub und
   GitLab explizit verglichen. Der Fehlschlag eines zweiten Pushziels darf nicht
   übergangen werden.
6. Ein späterer Cutover erhält ein dokumentiertes Rückfallfenster, in dem die
   GitHub-URL weiterhin den letzten grünen Build ausliefert.

## Risiken

| Risiko | Auswirkung | Mitigation / Gate |
| --- | --- | --- |
| Pages bleibt instanzweit deaktiviert | Kein UI-Reiter, kein Deploy | G1 ist externer harter Blocker; keine CI-Datei vor Freischaltung aktivieren. |
| Access Control ist nicht aktiviert oder Pages-Level versehentlich `public` | Ungewollt öffentliche Hochschulsite | Instanzweit public Pages deaktivieren; API-/UI-Wert und anonymen Zugriff testen. |
| GitLab Unique Domain versus Projekt-/Single-Domain-Pfad | HTML lädt, Assets/Worker 404 | Basispfad aus tatsächlichem `CI_PAGES_URL`; Drei-Pfad-Testmatrix. |
| URL > 2,048 Zeichen | Geteilte Zustände liefern 414 | Übergangslimit 8192 plus versionierte kompakte URL-Kodierung. |
| OAuth entfernt Query/Fragment | Wissenschaftliche Konfiguration geht beim Login verloren | End-to-end Test mit langem `state` und `#/input`; bei Fehler vor Freigabe stoppen. |
| Auth-Redirect statt Worker-/Wheel-Datei | Pyodide-Start schlägt mit schwer verständlichem Fehler fehl | Jede Assetklasse nach eingeloggter und abgelaufener Session testen. |
| CSP blockiert Wasm oder Worker | Leere/fehlerhafte Simulation | Keine ungeprüfte globale CSP; falls gesetzt, Canary für `script-src`/Wasm, `worker-src`, `connect-src`, `img-src data: blob:` und Report-Popups. |
| Falscher `.mjs`-/`.wasm`-MIME-Typ | Browser verweigert Ausführung | Header-Gate vor Funktionssmoke. |
| Runner ohne Egress/uv/Node oder zu wenig RAM | Build hängt oder scheitert | Gepinntes Image, kontrollierte Mirrors/Caches, kalter Canary, Ressourcenmessung. |
| Artefaktlimit unter Buildgröße | Pages-Upload scheitert | Mindestens 50 MiB freigeben; aktuelle 14.64-MiB-ZIP als Baseline überwachen. |
| GitHub und GitLab bauen verschiedene Commits | Wissenschaftliche Ergebnisse/Provenienz divergieren | SHA-Paritätsgate und sichtbarer Commit in beiden Apps. |
| GitLab wird kanonisch ohne Rückspiegelung | GitHub Page veraltet | Authority-Cutover blockieren, bis GitLab→GitHub-Sync bewiesen ist. |
| Doppelte CI erhöht Wartung und Supply-Chain-Fläche | Drift oder unterschiedliche Gates | Gleiche Befehle/Lockfiles, kleine hostbezogene Adapter, gemeinsame Skripte nur bei echtem Bedarf. |
| Hardcodierte GitHub-Links wirken nach Pages-Cutover inkonsistent | Nutzer landen auf anderer Plattform | Im Parallelbetrieb absichtlich GitHub behalten; erst beim Authority-Cutover einzeln entscheiden. |
| Private/internal wird mit Vertraulichkeit verwechselt | Falsche Sicherheitsannahme | Dokumentieren, dass Anwendung und Quellen parallel weiterhin öffentlich auf GitHub liegen. |
| GitLab-Update ändert Pages/OAuth-Verhalten | Später Ausfall | Runner/GitLab-Versionen beobachten; Smoke nach jedem Serverupdate. |

## Offene Entscheidungen

| Entscheidung | Empfohlener Startwert | Owner / Zeitpunkt |
| --- | --- | --- |
| Pages-Zugriff | `Only project members` für Canary | Maintainer vor G3 |
| Späterer interner Nutzerkreis | `Everyone with access`, niemals `Everyone` | Maintainer + IT nach G3 |
| Domainmodus | Unique Domain oder Wildcard-Domain; Pfad dynamisch ableiten | IT in G1 |
| URI-Übergangslimit | 8192 | IT in G1 |
| URL-state-Dauerformat | versioniert, kompakt, verlustfrei, v1 lesbar | ADR in G2 |
| CI-Toolchain | gepinntes/internes OCI-Image bevorzugt | DevOps in G2 |
| Automatischer Auth-Smoke | kurzlebiger Project Token mit `read_api` oder zunächst manuell | Maintainer/Security in G3 |
| Beobachtungszeit | mindestens 14 Tage oder zwei Releasekandidaten | Maintainer in G4 |
| GitLab nur als Pages-Host oder auch kanonisches Repo | zunächst nur zusätzlicher Pages-Host | separates ADR in G5 |
| Lebensdauer GitHub Page | unverändert weiterbetreiben | nur durch spätere ausdrückliche Entscheidung änderbar |

## Kompakte Anfrage an die GitLab-Administration

> Für das interne Projekt `phdoeble/MicrotubeDesignExplorer` (ID 4659) wird
> GitLab Pages auf der Self-Managed-Instanz 19.1.2 benötigt. Die Site ist eine
> vollständig statische Vite-Anwendung mit einem same-origin Module Web Worker,
> WebAssembly/Pyodide und etwa 15 MiB komprimiertem Pages-Artefakt. Bitte Pages
> mit HTTPS und Pages Access Control aktivieren, öffentlichen Pages-Zugriff
> sperren, Domainmodus und `CI_PAGES_URL` mitteilen, OAuth/SSO testen,
> `max_uri_length` übergangsweise auf mindestens 8192 setzen sowie mindestens
> 50 MiB Artefaktgröße und einen Linux-amd64-Runner mit kontrolliertem
> npm/PyPI/jsDelivr-Egress bestätigen. Benötigt werden anschließend ein
> interner Canary, die Header/MIME-Matrix und ein authentifizierter Browser-
> Smoke; GitHub Pages bleibt währenddessen unverändert produktiv.

## Quellen und Prüfbasis

Offizielle GitLab-Dokumentation, abgerufen am 2026-07-13:

- [GitLab Pages](https://docs.gitlab.com/user/project/pages/) — statische Sites,
  Wasm, Projektvisibilitäten, Unique Domains und Self-Managed-Betrieb;
- [GitLab Pages administration](https://docs.gitlab.com/administration/pages/)
  — Domainmodi, DNS/TLS, `pages_external_url`, Access Control,
  `max_uri_length`, OAuth und Betriebsoptionen;
- [GitLab Pages access control](https://docs.gitlab.com/user/project/pages/pages_access_control/)
  — Zugriffsmatrix für private/interne Projekte und Bearer Tokens;
- [CI/CD YAML syntax: `pages`](https://docs.gitlab.com/ci/yaml/#pages) und
  [`pages.publish`](https://docs.gitlab.com/ci/yaml/#pagespublish) — aktueller
  Pages-Job und Veröffentlichung von `dist`;
- [Predefined CI/CD variables](https://docs.gitlab.com/ci/variables/predefined_variables/)
  — `CI_PAGES_URL`, `CI_PAGES_HOSTNAME`, Commit- und Refvariablen;
- [GitLab Pages default domains and base URLs](https://docs.gitlab.com/user/project/pages/getting_started_part_one/)
  — Projektpfade und Unique Domains;
- [Projects API](https://docs.gitlab.com/api/projects/#project-feature-visibility-level)
  — Semantik von `pages_access_level`;
- [GitLab Pages limits](https://docs.gitlab.com/administration/instance_limits/#gitlab-pages-limits)
  — 200,000 Dateieinträge je Site;
- [GitLab Runner](https://docs.gitlab.com/runner/) — Self-Managed-Runner und
  Versionskompatibilität.

Repositoryinterne Prüfbasis:

- `.github/workflows/pages.yml`, `.github/workflows/ci.yml`;
- `vite.config.ts`;
- `scripts/prepare_pyodide_assets.mjs`;
- `src/workers/pyodide.worker.ts`, `src/workers/runtime-config.ts`;
- `src/state/urlState.ts`;
- `wiki/decisions/ADR-0006-pyodide-asset-hosting.md`;
- `wiki/decisions/ADR-0010-github-canonical-gitlab-internal-mirror.md`;
- `wiki/release-and-maintenance.md`.

## Status log

| Date | Change |
| --- | --- |
| 2026-07-13 | Read-only Audit der GitLab-Instanz 19.1.2, des internen Projekts 4659 und des vorhandenen Runners durchgeführt. Pages-Menü/API sind noch nicht verfügbar; externe Freischaltung bleibt harter Blocker. |
| 2026-07-13 | Anwendung als grundsätzlich GitLab-Pages-kompatibel bewertet. GitHub-Live-Smoke bestand; Artefakt mit 25 Dateien, 33.18 MiB roh und 14.64 MiB ZIP vermessen. |
| 2026-07-13 | Zwei konkrete Migrationsgates identifiziert: hostneutraler Vite-Basispfad und GitLab-URI-Limit für den derzeit etwa 4.3-KiB-langen URL state. |
| 2026-07-13 | Stufenplan für Adminfreischaltung, ADR, Canary, Parallelbetrieb und optionalen Authority-Cutover erstellt. GitHub Pages bleibt ausdrücklich unverändert. |

## Final commits

Dieser Living Plan bleibt bis zum Abschluss von G5 oder einer dokumentierten
Entscheidung, GitLab nur dauerhaft als sekundären Pages-Host zu nutzen, aktiv.
Implementierungscommits werden milestoneweise ergänzt; die Erstellung des Plans
ist kein Migrations-Cutover.
