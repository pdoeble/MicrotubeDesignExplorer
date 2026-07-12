# Implementierungsanleitung für die interaktive GitHub-Pages-Begleitseite

Damit sind die Grundanforderungen weitgehend geklärt. Der verbindliche fachliche Stand ist das MATLAB-Skript einschließlich seiner Berechnungswege, Randbedingungen, Machbarkeitsgrenzen und sinnvoll nutzbaren Plots. 

## Festgelegte Grundstruktur

* Vergleich von **zwei Kühlern**
* Standardfall: gleiche Geometrie, unterschiedliche Materialien wie im Paper
* Beide Kühler können vollständig unterschiedliche Geometrien, Materialien und Betriebsbedingungen erhalten
* Kopplung der Eingaben gruppenweise, beispielsweise:

  * Geometrie
  * Material
  * Luftseite
  * Kühlmittelseite
  * Randbedingungen
* Geometrieeingabe umschaltbar zwischen:

  * Breite, Höhe und Tiefe
  * Volumen und Seitenverhältnissen
* Nur Größen mit tatsächlichem Einfluss auf das Modell werden einstellbar
* Kontinuierliche geometrische Verhältnisse, aber ganzzahlige diskrete Bauteilgrößen wie Rohrzahlen
* Keine Stoffdatenbank und keine temperaturabhängigen Stoffmodelle
* Fluide werden über frei einstellbare, statische Stoffwerte definiert
* Defaultwerte entsprechen dem Paper
* Betriebsrandbedingungen sind für Luft- und Kühlmittelseite separat wählbar
* Unterstützte Betriebsmodi:

  * konstante Geschwindigkeit
  * konstanter Volumenstrom
  * konstanter Massenstrom
  * konstanter Druckverlust
  * konstante hydraulische Leistung
* Ergebnisdarstellung als:

  * Tandem-Plot
  * Delta-, Verhältnis- oder Vergleichsplot
* Designraumdarstellung grundsätzlich wie im Paper
* Alle fachlich sinnvollen MATLAB-Plots werden übernommen und nach Plotart sortiert
* Vollständig statische und eigenständig funktionsfähige GitHub-Page



## Architektur und Grundentscheidung

Die Zielplattform ist **eine vollständig statische Webanwendung auf GitHub Pages**, ohne Backend. Dafür sollte die Seite als **statische Single-Page-App** gebaut und per **GitHub Actions** nach GitHub Pages veröffentlicht werden. GitHub Pages unterstützt statische Veröffentlichung aus einem Branch oder über einen benutzerdefinierten Actions-Workflow; für jedes Projekt mit eigenem Build-Prozess empfiehlt GitHub ausdrücklich den Workflow-Ansatz. Vite baut genau dafür einen statischen `dist`-Output, der sich direkt deployen lässt. citeturn19view1turn14view4turn19view2turn19view3

Die fachliche Rechenlogik soll **vollständig von MATLAB nach Python portiert** werden, aber **nicht auf einem Server** laufen, sondern im Browser über **Pyodide**. Pyodide ist CPython in WebAssembly, kann im Browser Python-Pakete laden und unterstützt wissenschaftliche Pakete wie NumPy, SciPy und Matplotlib. Für eine responsive Oberfläche ist die Rechenlogik **zwingend in einen Web Worker** zu legen; Pyodide dokumentiert dafür einen offiziellen Worker-Ansatz und weist darauf hin, dass rechenintensive Python-Ausführung im Hauptthread die UI blockiert. Der Worker muss als **module-type worker** umgesetzt werden. citeturn12view0turn12view1turn5search6

Für die Oberfläche ist **React mit TypeScript** die sinnvollste Wahl. React ist komponentenbasiert und ausdrücklich dafür ausgelegt, UI aus unabhängig entwickelbaren Komponenten zusammenzusetzen; das ist genau das, was ihr für parallel arbeitende Agenten braucht. Die Plotdarstellung soll **nicht** in Python gerendert werden, sondern als strukturierte Daten aus dem Python-Kern an die UI zurückgegeben und dort mit **Plotly.js** gerendert werden. Plotly integriert sich direkt in React, unterstützt interaktive Diagramme und kann clientseitig mindestens **PNG** und **SVG** exportieren. citeturn19view8turn19view9turn12view2

Die verbindliche Zielarchitektur lautet daher:

- **Frontend:** React + TypeScript + Vite  
- **Rechenkern:** reines Python-Paket  
- **Browser-Laufzeit für Python:** Pyodide im Web Worker  
- **Plots:** Plotly.js  
- **Deployment:** GitHub Actions + GitHub Pages  
- **Export:** Plotly für Einzelplot-Export, `pdf-lib` für vollständige PDF-Berichte im Browser citeturn12view0turn12view1turn14view4turn12view2turn7search1

Wichtig ist die saubere Trennung: **Python berechnet**, **TypeScript orchestriert**, **Plotly visualisiert**. Diese Trennung ist keine Geschmackssache, sondern die entscheidende Voraussetzung, damit mehrere Implementierungsagenten unabhängig arbeiten können, ohne sich gegenseitig in UI- oder Modellcode zu blockieren. Die Worker-/Message-Architektur ist dafür der feste Schnittstellenpunkt. citeturn12view1turn5search2

## Verbindliche Standards und Toolchain

Die Seite soll mindestens auf **WCAG 2.2 AA** ausgerichtet werden. W3C empfiehlt für neue oder aktualisierte Webangebote ausdrücklich WCAG 2.2. Für eure obere Tab-Navigation ist das nicht optional: sie muss dem **WAI-ARIA Tabs Pattern** folgen, also mit `tablist`, `tab`, `tabpanel`, korrekten `aria-controls`- und `aria-selected`-Beziehungen sowie vollständiger Tastaturbedienung per Tab, Pfeiltasten, Enter und Space. Das ist deshalb wichtig, weil ihr eine tabzentrierte Anwendung plant; hier scheitern viele Projekte an Barrierefreiheit, wenn Tabs nur visuell und nicht semantisch korrekt umgesetzt werden. citeturn14view1turn15view0turn15view1turn15view2

Sicherheitsseitig soll die Seite **möglichst alle Assets selbst hosten**. Das reduziert Risiken und vereinfacht die Reproduzierbarkeit. Wenn externe Skripte oder Styles doch unvermeidbar sind, müssen sie mit **Subresource Integrity** eingebunden werden. Zusätzlich ist eine **Content Security Policy** festzulegen, um erlaubte Ressourcenquellen explizit zu beschränken. Da GitHub Pages öffentlich ausliefert, gilt außerdem: **nie sensible Daten im Repository oder Build-Output** belassen. citeturn14view2turn14view3turn19view1

Für den Python-Teil soll **uv** als Paket- und Projektmanager verwendet werden. uv bietet Lockfiles und Workspaces und ist damit gut für reproduzierbare Builds und mehrere Teilpakete geeignet. **Ruff** ist als Linter und Formatter verbindlich, **mypy** als statischer Typchecker. Für die fachlichen Python-Tests ist **pytest** gesetzt; für numerische Vergleiche eignet sich dort ausdrücklich auch `pytest.approx`. Auf der Frontend-Seite soll **Vitest** für Unit-Tests verwendet werden, weil es die Vite-Konfiguration direkt versteht. Für Browser- und Integrationsprüfungen ist **Playwright** die richtige Wahl, weil es Chromium, Firefox und WebKit mit einem API-Set testet. citeturn12view4turn19view5turn19view6turn3search1turn18view1turn19view4turn14view5

Alle agentenübergreifenden Datenverträge sind mit **JSON Schema** zu definieren. JSON Schema ist genau für die deklarative Beschreibung und Validierung von JSON-Strukturen gedacht. Im Python-Kern werden dieselben Verträge zusätzlich in **Pydantic-Modelle** gespiegelt, damit Eingaben validiert und serialisiert werden können. Diese doppelte Abbildung ist hier sinnvoll: JSON Schema ist der sprachunabhängige Vertrag zwischen Teams, Pydantic ist die laufzeitnahe Validierung im Python-Code. citeturn17view0turn20view0

Für Projektführung und Releases werden folgende Standards verbindlich gesetzt: **Semantic Versioning**, **Conventional Commits**, **Keep a Changelog**, ein explizites **LICENSE**-File, **GitHub Releases**, **CITATION.cff** und optional die **Zenodo-GitHub-Integration** für einen DOI. Das ist gerade bei wissenschaftsnaher Software sinnvoll, weil GitHub CITATION-Dateien direkt auswertet und Zenodo GitHub-Releases archivieren kann. citeturn9search0turn9search1turn9search2turn9search3turn11search1turn17view1turn17view2

Eine weitere verbindliche Entscheidung betrifft Plotly: Wenn **Vektor-Export** Teil der Anforderungen ist, dürfen in der endgültigen Plotbibliothek **keine WebGL-Traces** eingesetzt werden, sofern diese Exportpfade Vektortreue verlieren würden. Plotly weist selbst darauf hin, dass bei WebGL-Traces Vektorformate teilweise Rasteranteile enthalten. Für eure Anwendung heißt das praktisch: die produktive Plotregistry soll nur trace-Typen verwenden, die saubere SVG-Ausgabe erlauben. citeturn12view2

## Verzeichnisstruktur und technische Schnittstellen

Die Codebasis soll als **Monorepo** mit klar getrennten Teilbereichen aufgebaut werden. Die folgende Struktur ist verbindlich:

```text
repo/
  app/
    frontend/
      src/
        app-shell/
        tabs/
        controls/
        plots/
        settings/
        export/
        state/
        schemas-generated/
      public/
      vite.config.ts
    worker/
      src/
        pyodide-worker.ts
        message-protocol.ts
    python_core/
      src/paper_companion/
        domain/
        geometry/
        materials/
        fluids/
        constraints/
        solver/
        plots/
        reports/
        validation/
      tests/
    schemas/
      scenario-input.schema.json
      scenario-state.schema.json
      compute-request.schema.json
      compute-response.schema.json
      plot-catalog.schema.json
      report-payload.schema.json
      error-envelope.schema.json
    baselines/
      baseline-cases.json
      matlab-reference-results.json
    docs/
      architecture.md
      parameter-manifest.md
      plot-catalog.md
      error-codes.md
      report-template.md
  .github/
    workflows/
  CHANGELOG.md
  CITATION.cff
  LICENSE
  README.md
```

Diese Struktur trennt die Verantwortlichkeiten hart. `frontend` enthält nur UI. `worker` enthält nur den TS-Wrapper für Pyodide und die Message-Grenze. `python_core` enthält nur fachliche Modell- und Auswertefunktionen. `schemas` ist der einzige verbindliche Vertrag zwischen den Teilteams. `baselines` enthält die eingefrorenen Vergleichsfälle gegen MATLAB. Diese Art der Trennung ist konsistent mit React-Komponentenarchitektur, JSON-Schema-Verträgen und Worker-Kommunikation per Message-Passing. citeturn19view8turn17view0turn12view1turn5search2

Zwischen Hauptthread und Worker darf **ausschließlich** über versionierte Nachrichten kommuniziert werden. Der Worker hat keinen DOM-Zugriff; genau deshalb darf dort keinerlei UI- oder Plotcode liegen. Das Kommunikationsprotokoll besteht aus folgenden Nachrichtentypen:

- `ComputeRequest`
- `ComputeResponse`
- `ValidationRequest`
- `ValidationResponse`
- `ExportRequest`
- `ExportResponse`
- `ErrorEnvelope`

Jede Nachricht enthält mindestens `schema_version`, `request_id`, `timestamp_utc` und `payload`. Nachrichten ohne gültige Schema-Version werden verworfen. Diese Regel ist zwingend, damit parallel entwickelte Komponenten nicht mit „stillen“ Inkompatibilitäten scheitern. Die technische Grundlage dafür liefern JSON Schema als Strukturvertrag und Web Worker als isolierte Ausführungsumgebung. citeturn17view0turn12view1turn5search2

Für alle Domänenobjekte gelten feste Benennungskonventionen:

- **JSON-Felder:** `snake_case`
- **TypeScript-Typen und React-Komponenten:** `PascalCase`
- **Python-Funktionen und Module:** `snake_case`
- **Plot-IDs:** `kebab-case`
- **Einheitenfelder:** immer separat und explizit, nie implizit im Namen
- **Booleans:** positiv formuliert, z. B. `use_shared_materials`, nicht `disable_individual_materials`

Das wichtigste Vertragsobjekt ist `ScenarioInput`. Dieses Objekt repräsentiert genau das, was der Nutzer setzen darf. Daraus entsteht nach Validation und Normalisierung ein `ScenarioState`, das zusätzlich abgeleitete Größen, aktiven Modus, diskrete Ganzzahlen und Warnungen enthält. Der Python-Kern nimmt **nur** `ScenarioState` entgegen. Das verhindert, dass mehrere Teams unterschiedliche Ad-hoc-Normalisierungen implementieren.

Ein minimales Beispiel der Verträge sieht so aus:

```json
{
  "schema_version": "1.0.0",
  "request_id": "uuid",
  "payload": {
    "scenario_id": "default-paper-case",
    "geometry_mode": "dimensions",
    "comparison_mode": "tandem",
    "cooler_left": {},
    "cooler_right": {},
    "shared_groups": {
      "geometry": true,
      "materials": false,
      "air_side": true,
      "coolant_side": true,
      "boundary_conditions": false
    }
  }
}
```

Das Antwortobjekt enthält nie fertige Pixelgrafik, sondern immer **Daten plus Metadaten**:

```json
{
  "schema_version": "1.0.0",
  "request_id": "uuid",
  "payload": {
    "scenario_state": {},
    "scalar_results": {},
    "plot_descriptors": [],
    "warnings": [],
    "errors": []
  }
}
```

`plot_descriptors` ist dabei der zentrale Plot-Vertrag. Jeder Descriptor enthält mindestens `plot_id`, `plot_family`, `title`, `x`, `y_series`, `axis_meta`, `supports_delta`, `supports_ratio`, `supports_svg_export` und `availability_rules`. Plotly nimmt solche strukturierten Daten in React direkt entgegen; deshalb ist diese Aufteilung für die UI sauber und für den Rechenkern unabhängig von der Darstellungsbibliothek. citeturn19view9turn17view0

## Fachfunktion, Verhalten und inhaltliche Festlegungen

Die Anwendung besteht gemäß ADR-0008 aus vier Workflow-Tabs: **Start**, **Model Setup**, **Results**, **Settings**. Model Setup bündelt die zuvor getrennten Tabs Input und Materials in zwei lokale Arbeitsschritte. Dadurch existiert jede Gruppenkopplung genau einmal und verknüpfte rechte Eingabegruppen werden nicht als identische Formulare wiederholt. Die Tabs werden beim Initialisieren vorgeladen, damit die Aktivierung ohne merkliche Latenz funktioniert; genau dafür empfiehlt das WAI-ARIA Tabs Pattern automatische Aktivierung auf Fokus nur dann, wenn die Inhalte ohne spürbare Verzögerung bereitstehen. Diese Bedingung ist hier erfüllbar, weil die Seitenstruktur statisch ist und nur die Rechenergebnisse asynchron nachgeladen werden. citeturn15view0

Im Tab **Start** stehen Paper-Bezug, kurze fachliche Einordnung, Bedienanleitung, Softwareversion, Release-Hash, bevorzugte Zitierweise und ein Verweis auf das Repository. Da es sich um wissenschaftsnahe Software handelt, soll die Startseite außerdem einen sichtbaren Hinweis auf `CITATION.cff` und die Softwareversion enthalten. GitHub unterstützt `CITATION.cff` nativ und zeigt daraus eine Cite-Option im Repository an; falls ihr später Zenodo koppelt, wird daraus zusätzlich ein dauerhaft zitierbarer Archivierungsweg. citeturn17view1turn17view2turn11search3

Im ersten Schritt von **Model Setup**, **Design & operation**, werden alle geometrischen, betrieblichen und randbedingungsbezogenen Eingaben geführt. Für jeden Kühler gibt es eine Spalte. Standardmäßig ist der im Paper beschriebene Vergleichsfall aktiv, also gleiche Geometrie mit Materialvariation, aber die Oberfläche muss auch vollständig unterschiedliche Geometrien zulassen. Kopplungen werden **gruppenweise** gesteuert, nicht global. Pflichtgruppen sind: `geometry`, `materials`, `air_side`, `coolant_side`, `boundary_conditions`. Die Kopplungen werden in einem einzigen, persistenten Vergleichsblock oberhalb der beiden Arbeitsschritte bedient. Jeder editierbare Parameter wird über dieselbe UI-Struktur abgebildet: Slider, direkt editierbares Zahlenfeld, Einheit, Reset auf Paper-Default. Ob ein Parameter linear oder logarithmisch gesteuert wird, wird **nicht** ad hoc im UI entschieden, sondern in einem zentralen **Parameter Manifest** festgeschrieben. Dasselbe Manifest definiert Default, Minimum, Maximum, Einheit, Rundung, Ganzzahligkeit und Sichtbarkeitsbedingungen. citeturn17view0turn20view0

Für **ungültige Eingaben** gilt folgende Regel, die ich als verbindlich empfehle: **strukturell ungültige Eingaben werden sofort blockiert**, **fachlich außerhalb des Modellgültigkeitsbereichs liegende Eingaben werden nicht gerechnet**, sondern mit eindeutigen Fehlercodes und Begründung zurückgewiesen. Es gibt also **keine stillschweigende Extrapolation** außerhalb der ausdrücklich freigegebenen Modellgrenzen. Nur weiche Hinweise, etwa „physikalisch ungewöhnlich, aber modellseitig noch zulässig“, erscheinen als Warnung. Diese Trennung verhindert Scheinvalidität und entspricht dem wissenschaftlichen Charakter eurer Anwendung. Die Fehler werden als typisierte `ErrorEnvelope`-Objekte zurückgegeben.

Im zweiten Schritt von **Model Setup**, **Materials & fluids**, werden alle Stoffwerte geführt, die tatsächlich in die Berechnung eingehen. Es gibt **keine Datenbank**, nur explizite Eingabefelder mit Paper-Defaults. Fluide und Materialien werden gleich behandelt: als statische Eigenschaftssätze ohne temperaturabhängige Stoffmodelle. Ist eine Gruppe gekoppelt, zeigt die rechte Spalte einen eindeutigen Link-Status statt eines zweiten identischen Formulars; „Edit separately“ stellt die vorherigen unabhängigen Werte wieder her. Jedes Feld braucht Name, Symbol, Einheit, Default, zulässigen Bereich und eine Kurzbeschreibung der Wirkung im Modell.

Im Tab **Results** wird oben zwischen **Tandem**, **Delta** und – soweit fachlich vorgesehen – **Ratio** umgeschaltet. Darüber liegt ein Dropdown mit allen freigegebenen Plot-IDs aus dem MATLAB-Bestand. „Freigegeben“ heißt hier: Der Plot muss fachlich sinnvoll, im Python-Paket berechenbar und im Plot-Katalog beschrieben sein. Neben den Plots soll die Seite immer auch einen numerischen KPI-Block anzeigen. Nach meiner Einschätzung gehören dort mindestens hinein: Wärmeübertragungskennwert des Modells, Wärmeleistung, Druckverluste auf Luft- und Kühlmittelseite, Volumen- und Massenströme, hydraulische Leistung, Reynolds-Zahlen, diskrete Geometriezahlen sowie ein Feasibility-/Constraint-Status. Diese Zahlen sind nicht Beiwerk, sondern Diagnoseinstrumente für Interaktivität und Plausibilitätsprüfung.

Im Tab **Settings** werden nur Darstellungsoptionen geführt, keine Modellparameter. Pflichtoptionen sind: Schriftgröße, Linienbreite, Legendenverhalten, Raster an/aus, Achsenskalierung, feste oder automatische Achsenbereiche, Zahlformat, Exportauflösung, Plot-Layout für Tandemplots und Auswahl, ob Default-Ansicht eher paper-nah oder explorativ sein soll. Zusätzlich soll hier die Sprache der Oberfläche vorbereitet werden. Da das Paper sehr wahrscheinlich englisch gelesen wird, empfehle ich **Englisch als Primärsprache der Anwendung** und Deutsch später nur als optionale Übersetzung.

Für **Export und Bericht** wird verbindlich festgelegt: Einzelplots müssen als **PNG** und **SVG** exportierbar sein. Plotly unterstützt diese clientseitigen Formate direkt. Der vollständige Bericht wird als **PDF im Browser** erzeugt; dafür ist `pdf-lib` geeignet, weil es rein in JavaScript läuft, Fonts und Vektorgrafiken einbetten kann und ohne Server auskommt. Zusätzlich muss jede Sitzung als **JSON-Szenario-Datei** exportiert und importiert werden können. Dieses JSON ist das maßgebliche Austauschformat für Wiederholbarkeit, Review und Bugreports. citeturn12view2turn7search1

Ein fachlich sehr wichtiger Zusatzpunkt: Weil GitHub Pages und Pyodide ohne Backend arbeiten, sollen **nur genau die Python-Pakete geladen werden, die das Modell wirklich braucht**. Pyodide erlaubt sowohl `micropip` als auch `loadPackage`, aber jedes zusätzliche Paket erhöht Browser-Ladezeit und Komplexität. Daraus folgt als Projektregel: Der Rechenkern soll zunächst nur auf **Python-Standardbibliothek plus NumPy** aufbauen; SciPy wird nur dann freigegeben, wenn das portierte MATLAB-Modell es tatsächlich benötigt. Diese Minimalabhängigkeit ist kein Luxus, sondern Performance- und Wartungsmaßnahme. citeturn12view0turn4search5turn4search6

## Umsetzungsplan, Arbeitspakete und Meilensteine

Der erste Meilenstein ist der **Spec Freeze**. In diesem Schritt wird noch nichts „schön“ gebaut; hier werden nur die Artefakte erzeugt, die alle späteren Agenten brauchen. Ergebnis dieses Meilensteins sind: ein vollständiger **Parameter Manifest**, ein vollständiger **Plot-Katalog**, ein **Constraint- und Fehlercode-Katalog**, ein Satz von **Baseline-Cases** aus MATLAB, ein **Report-Template** und die initialen **JSON Schemas**. Ohne diese sechs Artefakte darf kein paralleler Implementierungsagent starten, weil sonst fast sicher mehrere Wahrheiten über Parametergrenzen, Plotnamen oder Abhängigkeiten entstehen.

Der zweite Meilenstein ist der **Python-Kern mit MATLAB-Parität**. In diesem Schritt wird das MATLAB-Modell fachlich nach Python übertragen, aber noch ohne Pyodide und ohne UI. Ziel ist ein reines, lokal unter CPython testbares Paket. Dieses Paket muss deterministische Funktionen für Geometrie, Stoffwerte, Randbedingungen, diskrete Ableitungen, Solverlogik und Ergebnisaggregation bereitstellen. Parallel dazu entsteht die Baseline-Teststrecke mit `pytest`, Typprüfung mit `mypy` und Codequalität mit `Ruff`. Erst wenn diese Stufe sauber ist, lohnt es sich, die Modelllogik in Pyodide zu packen. citeturn3search1turn19view6turn19view5

Der dritte Meilenstein ist das **App Shell Frontend**. Hier kann ein separates Team unabhängig vom Rechenkern arbeiten, solange es nur gegen die Schemas arbeitet. Das Frontend baut die Tab-Navigation, die Formularbibliothek, die Kopplungslogik, die Validationsanzeige, die Statusmeldungen und das globale State-Management. Gleichzeitig implementiert ein Worker-Team den Pyodide-Loader, die Initialisierung des module workers und die Message-Grenze. Dass diese Aufteilung funktioniert, ist genau der Vorteil der gewählten Architektur mit React-Komponenten und Worker-Protokoll. citeturn19view8turn12view1turn5search2

Der vierte Meilenstein ist **Ploting, KPI-Panel und Export**. Dieses Arbeitspaket hängt nur von `ComputeResponse` und `PlotDescriptor` ab und kann deshalb ebenfalls parallel entwickelt werden. Hier werden Plot-Renderer, Plot-Familien-Wechsel, KPI-Darstellung, Warnsymbolik, PNG-/SVG-Export und der PDF-Bericht umgesetzt. Der Bericht zieht seine Inhalte nicht direkt aus beliebigen UI-Komponenten, sondern aus einem eigenen `ReportPayload`, damit Reportlogik und Bildschirmdarstellung nicht unkontrolliert auseinanderlaufen. Für React-Plotly-Integration und Bildexport ist die technische Grundlage bereits durch Plotly dokumentiert. citeturn19view9turn12view2turn7search1

Der fünfte Meilenstein ist **Qualität, Accessibility und Deployment**. Hier werden Vitest, pytest, Playwright und die GitHub-Pages-Pipeline verbindlich geschaltet. Der Deploy-Workflow soll über GitHub Actions mit `configure-pages`, `upload-pages-artifact` und `deploy-pages` laufen. GitHub dokumentiert dafür sowohl die Workflow-Struktur als auch die erforderlichen Berechtigungen `pages: write` und `id-token: write`. In diesem Meilenstein werden außerdem `CITATION.cff`, Releases, Changelog und Lizenz finalisiert. citeturn19view2turn19view3turn12view3turn14view5turn19view4turn17view1

Die parallele Aufteilung der Agenten soll deshalb verbindlich so aussehen:

- **Agentengruppe Modell:** Portierung MATLAB → Python, Baselines, Formeln, Constraints  
- **Agentengruppe Verträge:** JSON Schemas, Pydantic-Modelle, Protokolle, Fehlercodes  
- **Agentengruppe UI:** Tabs, Controls, Validation UX, Gruppenkopplung, Settings  
- **Agentengruppe Plot/Report:** Plotregistry, Plotly-Renderer, KPI-Panel, PNG/SVG/PDF  
- **Agentengruppe QA/DevOps:** Tests, GitHub Actions, GitHub Pages, Releases, CITATION  

Diese Gruppen dürfen nur über versionierte Schemas und dokumentierte Artefakte miteinander interagieren. Direkte Querverweise zwischen Modul-Interna sind verboten.

## Abnahmekriterien und noch verbindlich festzuschreibende Artefakte

Die Anwendung gilt erst dann als abnahmefähig, wenn sie **ohne Backend vollständig auf GitHub Pages läuft**, per **GitHub Actions** gebaut und veröffentlicht wird und der veröffentlichte Build nur aus statischen Assets besteht. GitHub empfiehlt den Actions-basierten Veröffentlichungsweg für kontrollierte Build-Prozesse, und Vite baut genau den dafür vorgesehenen `dist`-Ordner. citeturn19view1turn14view4turn19view2turn19view3

Die Anwendung gilt nur dann als fachlich korrekt, wenn für einen eingefrorenen Satz von Baseline-Cases die Python-Ergebnisse gegen MATLAB geprüft wurden. Ich empfehle hierfür als verbindliches Kriterium: **exakte Gleichheit für diskrete Integer-Ergebnisse**, **relative Toleranz von `1e-6` für skalare kontinuierliche Ergebnisgrößen**, und **punktweise Toleranz von `1e-5` für geplottete Kurvenwerte**, sofern nicht eine fachlich begründete Ausnahme dokumentiert ist. Diese Kriterien sind streng genug für wissenschaftliche Reproduzierbarkeit, aber tolerant genug für Unterschiede in numerischer Auswertungskette.

Die Accessibility-Abnahme verlangt mindestens: vollständige Tastaturbedienung aller Tabs nach WAI-ARIA Tabs Pattern, sinnvolle Fokusreihenfolge, sichtbare Fokusindikatoren, korrekte `aria`-Semantik und eine Umsetzung, die gegen **WCAG 2.2 AA** geprüft wurde. Die Browser-Abnahme soll auf aktuellen Versionen von **Chromium, Firefox und Safari/WebKit** erfolgen; Pyodide selbst empfiehlt aktuelle Browser, weil WebAssembly-Features sich laufend weiterentwickeln. Für genau diese Browserstrecke ist Playwright auch technisch passend ausgelegt. citeturn15view0turn14view1turn10search15turn14view5

Die Export-Abnahme verlangt drei Dinge: Erstens den erfolgreichen Export jedes freigegebenen Einzelplots in **PNG** und **SVG**. Zweitens den erfolgreichen Export eines vollständigen **PDF-Berichts** im Browser. Drittens den Import und Export eines vollständigen **Szenario-JSON**, sodass eine Sitzung reproduzierbar wiederhergestellt werden kann. Für Vektor-Exports dürfen nur Plottypen verwendet werden, die keine versteckten Rasteranteile durch WebGL einführen. citeturn12view2turn7search1

Die CI-Abnahme verlangt, dass vor jedem Deployment mindestens **Ruff**, **mypy**, **pytest**, **Vitest** und **Playwright** grün sind. Das ist keine übertriebene Strenge, sondern die minimale Sicherung, wenn mehrere Teams gleichzeitig an Modell, UI und Deployment arbeiten. Die eingesetzten Test- und Prüfwerkzeuge sind genau für diese Schichten gedacht: Ruff für Stil und Linting, mypy für Python-Typfehler, pytest für Fachtests, Vitest für Vite/TS-Tests und Playwright für echte Browserläufe. citeturn19view5turn19view6turn3search1turn19view4turn14view5

Vor Beginn der Implementierung müssen außerdem noch folgende Artefakte **einmalig und verbindlich** eingefroren werden, weil sie sonst unweigerlich zu Abweichungen zwischen parallelen Agenten führen:

- der vollständige **Parameter Manifest** mit Default, Einheit, Range, Skalierung, Ganzzahligkeit und Sichtbarkeitsregeln,
- der vollständige **Plot-Katalog** mit Plot-ID, Achsen, Sweep-Definition, Verfügbarkeitsbedingungen und Plot-Familie,
- der vollständige **Fehler- und Warnkatalog**,
- der vollständige **Baseline-Satz** gegen MATLAB,
- das feste **Report-Template**,
- die finalen **Design Tokens** für Typografie, Abstände, Farben und Tabellenstil,
- die feste **Release- und Versionierungspolitik**,
- sowie die endgültige **CITATION.cff** und Lizenzentscheidung. citeturn17view1turn9search0turn9search1turn9search2

Die kurze Endfassung der Empfehlung lautet deshalb: **Baut die Anwendung als statische React/TypeScript-App mit Python-Kern in Pyodide-Web-Worker, nutzt JSON-Schema/Pydantic als harte Vertragsgrenze, rendert in Plotly, testet mit pytest/Vitest/Playwright, veröffentlicht über GitHub Actions auf GitHub Pages, und friert vor jeder Parallelentwicklung zuerst Parameter-, Plot-, Fehler- und Baseline-Artefakte ein.** Das ist für euren Anwendungsfall die robusteste, reproduzierbarste und am wenigsten missverständliche Lösung. citeturn12view0turn12view1turn17view0turn19view9turn19view2turn19view3
