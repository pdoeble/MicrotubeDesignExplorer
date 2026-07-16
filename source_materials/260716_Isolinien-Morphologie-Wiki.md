# Wiki: Isolinien-Morphologie der Widerstandsanteil-Karten (Paper Fig. 2)

**Stand:** 2026-07-16 · **Status:** abgeschlossen, ins Paper eingearbeitet, kompiliert (29 S.)
**Anlass:** Professor-Frage zur qualitativen Form der Subplots in Fig. 2
(`12_shares_alu_pa_portrait`): Warum „Nasen" der Isolinien (φ_i,Al / φ_o,Al nach unten
links, φ_i,PA entgegengesetzt) und warum ein gemeinsamer „Rücken" der Umkehrpunkte?
**Verwandte Dokumente:** [260715_RueckenAnalysis.md](260715_RueckenAnalysis.md) (externe
Erst-Recherche), [260716-Chatbericht](260716-Chatbericht) (externe visuelle Re-Analyse),
[../../Plots/diagnostic_maps_spec.md](../../Plots/diagnostic_maps_spec.md)
(Implementierungs-Spec der Diagnosekarten 23–28).

---

## 1. Kurzfassung (professorentauglich)

Die Isolinien der Anteile φ_j = R_j/R_tot drehen **nicht** an einem
Strömungsregimewechsel um (die Innenströmung ist im relevanten Bereich mit
Re_i ≈ 100–800 eindeutig laminar). Ursache ist ein **Wettbewerb der lokalen
Durchmesser-Sensitivitäten** der beiden Nusselt-Korrelationen:

- Innen (VDI G1, T_w = const): Die Graetz-Zahl Gz = Re_i·Pr_i·d_i/l wächst bei festem
  v_i mit d_i². Die lokale Sensitivität S_i = ∂ln Nu_i/∂ln d_i steigt dadurch **stetig**
  von 0 (thermisch ausgebildet, Nu = 3,66, wandstärkenblind, R_i ∝ d_o¹) in Richtung
  des Lévêque-Exponenten 2/3 (Einlaufterm Nu ∝ Gz^1/3, R_i ∝ d_o^1/3).
- Außen (VDI G7): n_o = ∂ln Nu_o/∂ln Re_o ≈ 0,51–0,60 (laminare Grenzschicht
  Nu ∝ Re^1/2 mit wachsendem turbulentem Beitrag) — **kein** Regimewechsel.

Wo die Sensitivitäten sich ausgleichen, ist der Anteil φ_i in d_o stationär → die
Isolinien kehren um. Die Verbindungslinie dieser Scheitelpunkte ist der „Rücken".
Die **Richtung** der Nasen entscheidet der Wandterm über die Biot-artige Kennzahl
Bi = k_o·d_o/λ_w: Al (Bi ~ 10⁻³) → Wand unsichtbar, φ_i steigt mit τ (Nasen unten
links); PA (Bi ≈ 0,6–1,6) → wachsender Wandanteil verdünnt φ_i (Nasen oben rechts).

**Wichtig:** „Wendepunkte" ist mathematisch unpräzise — es sind **Scheitel-/
Umkehrpunkte** (Stationaritätspunkte von φ entlang log d_o), kein
Krümmungsvorzeichenwechsel. Echte Knicke erzeugt nur das laminar-turbulente
Transition-Blending (Re_i = 2300–10⁴, d_i = 5,66 mm-Linie) am rechten Rand der
PA-Panels (wellige Konturen).

## 2. Exakte Bedingungen (verifiziert)

Alle drei Widerstände in Gl. (1) skalieren bei festem τ linear mit d_o → d_o kürzt
sich aus den Anteilen; die Kartenform hängt nur an Nu_i(d_i), Nu_o(d_o) und
w(τ) = ln(d_o/d_i) = −ln(1−2τ).

| Größe | Bedingung/Formel | Bedeutung |
| --- | --- | --- |
| Rücken („Ridge", F = 0) | S_i·(1−φ_i) = n_o·φ_o ⇔ **S_i = q_o·n_o**, q_o = R_o/(R_o+R_w) | ∂φ_i/∂ln d_o = 0; Umkehr der Isolinien |
| Flip-Linie (D = 0) | S_i·(1−φ_i) = Bi/2 ⇔ S_i = q_w/w·(…) | ∂φ_i/∂τ = 0; Vorzeichen der τ-Abhängigkeit |
| Wandanteil (exakt) | **φ_w = (Bi/2)·ln(d_o/d_i) ≈ Bi·τ** (dünnwandig) | Bi = k_o·d_o/λ_w; Bi=1 heißt NICHT φ_w=50 % |
| Nasenrichtung | τ″ = −φ_xx/φ_τ am Scheitel | Vorzeichen von ∂φ/∂τ bestimmt Richtung |

Für Al gilt q_o ≈ 1 → S_i ≈ n_o (reiner G1–G7-Ausgleich). Für PA verschiebt φ_w die
Bedingung zu kleinerem S_i (kleinerem d_i, höherem τ) — deshalb liegen Al- und
PA-Rücken nahe, aber nicht identisch.

## 3. Zahlenwerte (doppelt verifiziert)

Quelle: eigene Python-Gegenrechnung der exakten G1/G7-Implementierung aus
`Waermedurchgang_V10_physical.m` (Session 2026-07-15/16); unabhängig bestätigt durch
externe Recherche/Re-Analyse (260715/260716). Analytische vs. numerische
Rückenlage stimmen auf 0,1 % überein.

| Kennzahl | Werte |
| --- | --- |
| n_o(d_o) | 0,51 (0,3 mm) · 0,53 (1) · 0,55 (2) · 0,56 (3) · 0,58 (5) · 0,60 (10 mm) |
| S_i(d_i) | 0,02 (0,2 mm) · 0,28 (0,6) · 0,41 (0,8) · 0,52 (1,0) · 0,66 (1,5) · 0,77 (3 mm) |
| Al-Rücken | τ* = 14,6 % (1,5 mm) · 22,9 % (2) · 31,4 % (3) · 38,4 % (5 mm); d_i ≈ 1,06–1,16 mm ≈ const; Gz ≈ 31–37; Re_i ≈ 450 |
| PA-Rücken | τ* ≈ 28 % (1,5 mm) · 36 % (2 mm); d_i ≈ 0,66–0,55 mm (fallend) |
| PA-Flip | τ ≈ 33 % (3 mm) · 26 % (5 mm); dazu Transition-Äste bei d_o ≈ 6–10 mm |
| Bi (1 mm, τ=10 %) | Al 1,3·10⁻³ · PA 1,0 (Bi=1-Linie läuft ~durch den Benchmark!) |
| Sonder-Gz | Nu₂=Nu₁ bei Gz ≈ 11,7 · Rücken-Balance ≈ 33 · Re_i=2300 bei Gz ≈ 877 (d_i = 5,66 mm) |

Rückengeometrie: konstantes d_i\* ⇒ τ\*(d_o) = ½(1 − d_i\*/d_o) — konkav in log d_o
(„leichte negative Krümmung"). Prof-Ablesung „(1 mm, 7 %)→(3 mm, 40 %)" mittelt
Al- und PA-Panels; exakt: Al (1,1 mm, 0 %)→(3, 31 %)→(~6, 40 %), PA steiler.

## 4. Häufige Fehldeutungen (aus den externen Analysen, alle eingearbeitet)

1. **„Rücken = Nu₂=Nu₁-Punkt"** — falsch; die Nu₂=Nu₁-Linie (Gz ≈ 11,7) liegt sichtbar
   links vom Rücken (Gz ≈ 31–37). Nu₂=Nu₁ markiert nur den Beginn des
   Einlaufeinflusses, nicht das Anteils-Maximum.
2. **„Rücken = Übergang ausgebildet→einlaufend"** — zu stark; der Rücken liegt
   *innerhalb* des kontinuierlichen Entwicklungsbereichs, an der Sensitivitätsbalance.
3. **„Bi = 1 ⇒ Wand dominiert"** — falsch ohne den Faktor ½·ln(d_o/d_i): bei Bi = 1 und
   τ = 2,5 % ist φ_w ≈ 2,6 %; erst großes Bi UND großes τ machen die Wand dominant.
4. **„PA-Nasen rein einlaufbedingt"** — nein; Grundrücken aus G1-Sensitivität, die
   PA-Zusatzmorphologie (Verschiebung, Flip) kommt wesentlich aus R_w.
5. **„Rücken = laminar-turbulente Grenze"** — falsch; Re_i am Rücken ≈ 450.

## 5. Tragweite und Caveats

- **Sweep-Konvention ist tragend:** Nur bei festem v_i gilt Gz ∝ d_i². Bei festem
  Rohr-Massenstrom wird Gz durchmesserunabhängig → kein Crossover, keine Nasen. Bei
  festem Bündelstrom (N ∝ d_o⁻²) stirbt der τ-Kanal des Einlaufs → Al-Nasen ~weg.
  Formulierungs-Leitplanke: immer „at the fixed tube-side velocity" konditionieren.
- **Randbedingung:** G1 mit T_w = const ist für die schlecht leitende PA-Wand die am
  wenigsten passende Annahme (real konjugiert/3. Art; asymptotisch Nu 3,66–4,36,
  Kroulíková 2021). Konservativ für α_i; Rücken verschöbe sich, Mechanismus bleibt.
- **Nu₃-Term (∝Gz^1/2, simultaner Einlauf):** sekundär (d_i/l ≤ 0,033 im laminaren
  Ast; am Rücken 0,007); trägt ~20 % zu S_i am Rücken bei; ohne ihn d_i* ≈ 1,2 statt
  1,1 mm.
- **Transition-Zone** (Re_i = 2300–10⁴): Morphologie dort nicht mit der laminaren
  Korrelation interpretieren; die komplexen Flip-Äste bei d_o ≈ 5–10 mm nicht als
  Kernerkenntnis verkaufen.
- **Auslegungsrelevanz:** Das PA-Zielfenster (d_o ≈ 0,35–0,65 mm, τ ≈ 5–11 %) liegt
  links vom Rücken, laminar (Re_i ≈ 115–240), bei Gz ≈ 2–10 und φ_w von wenigen
  Prozent — der Bereich, der am unempfindlichsten gegen das Wandmaterial ist. Die
  Morphologie-„Spektakel" rechts bestimmen das Fenster nicht.

## 6. Diagnosekarten (Exporte 23–28, MATLAB, 2026-07-15)

Spec: [../../Plots/diagnostic_maps_spec.md](../../Plots/diagnostic_maps_spec.md);
Exporte in `Plots/Waermedurchgang_V10_physical_exports/`; NICHT in
`tools/sync_figures.py` (keine Paper-Figuren). Visuelle Auswertung 2026-07-16: alle
Erwartungen bestätigt.

| Nr. | Karte | Kernbefund |
| --- | --- | --- |
| 23 | Gz (log) + Sonderlinien | Gz-Isolinien = d_i-konst-Schar; Nu₂=Nu₁ / Rücken / Re=2300 sauber getrennt |
| 24 | S_i = dlnNu_i/dlnd_i | glattes Feld 0→>2/3; Al-Rücken liegt im Band S_i ≈ n_o (0,5–0,6) |
| 25/26 | Bi Al/PA (gleiche Skala) | drei Dekaden Abstand; Bi=1-Linie ~durch Benchmark (1 mm, 10 %) |
| 27/28 | φ_i + Ridge/Flip-Overlays | rote Linie durch alle Nasenspitzen; blaue Flip-Linie nur PA (Al: nur im maskierten Bereich) |

Offene Kosmetik (nur Diagnose, niedrige Prio): φ-Farbskala 0–25 % statt 0–100 %,
rote Linie auf rotem Grund (Halo/Farbwechsel), Querschnitts-Symbole entfernen,
F/D in Caption definieren, „Lévêque scaling" statt „asymptote".
Robustheitstests R1–R5 (Nu=3,66 erzwingen, Nu₃ entfernen, q̇=const,
Sweep-Konvention wechseln, alternative Bündelkorrelation) sind in der Spec §8
definiert, aber noch nicht gerechnet.

## 7. Einarbeitung ins Paper (Stand 2026-07-16, alle kompiliert)

| Datei | Änderung |
| --- | --- |
| `sections/02_methods.tex` | Brückensatz (Heat-Transfer Submodels): Gz = Argument der G1-Korrelation (Zitate Gnielinski 1989, Bertsche 2015); Gz und Bi folgen aus Gl. (1) + Korrelationen, „no additional model assumptions" |
| `sections/03_results.tex` (3.2) | Integriert statt Block: φ_w-Absatz erklärt 2,1–5,5 % über Bi (exakte ln-Form + Bi·τ, „wall dominates only where large Bi and large τ coincide"); φ_i-Absatz bekommt Gz mit Anschauung (Einlauflänge vs. Rohrlänge; R_i ∝ d_o¹ → ∝ d_o^1/3); Morphologie-Absatz: Sensitivitätsbalance (Dekoder: „whichever side's resistance grows faster with d_o gains share"), G7-Anker Nu ∝ Re^1/2, Transition-Wellen, Schluss aufs Zielfenster. Wort „ridge" kommt im Paper nicht vor. |
| `sections/05_discussion.tex` (5.1) | Nur noch Transfer: Bi·τ-Skalierung → PEEK erbt dieselbe Karte, Metalle bleiben Bi ≪ 1 |
| `sections/00_nomenclature.tex` | Bi und Gz ergänzt |
| `references.bib` | Neu (Crossref-verifiziert): `Gnielinski1989` (CIT 61:160–161, dt. Titel doppelt geklammert wg. spmpsci-Kleinschreibung), `Bertsche2015` (IJHMT 90:1255–1265, Autoren inkl. Dietrich) |

## 8. Quellenstatus

| Quelle | Status | Verwendung |
| --- | --- | --- |
| GnielinskiG1/G7 (VDI 12. Aufl. 2019 — nicht 2013!) | im Bib | Korrelationen, Transition, G7-Skalierung |
| Gnielinski 1989, CIT 61:160–161 | **zitiert**, Metadaten verifiziert | Primärquelle laminarer Blend (T_w=const) |
| Bertsche et al. 2015, IJHMT 90:1255 | **zitiert**, Metadaten verifiziert | Lévêque-Validierung |
| Kroulikova2021 | im Bib | 3.-Art-RB-Caveat (Nu 3,66–4,36) |
| Yi 2023 (J. Membr. Sci. 678:121664) | Kandidat — Claims am PDF prüfen | gleiches Serienwiderstandsmodell |
| Liu 2018 (AIChE 64:1783) | Kandidat — Schwellen (λ_w>1, t<0,1 mm) am PDF prüfen | Wandanteil-Sensitivität |
| Gnielinski 1975/1978, Hussain 2017, Graetz/Lévêque-Originale, Shah & London | bewusst nicht aufgenommen | Konferenzformat/Längenlimit |

## 9. Offene Punkte

1. Robustheitstests R1–R5 rechnen (Spec §8) — schärfster Mechanismusbeweis ist R1
   (Nu ≡ 3,66 ⇒ Nasen verschwinden).
2. Yi 2023 / Liu 2018 am PDF verifizieren, falls Zitierung gewünscht.
3. Optional: Conclusions-Halbsatz („Kartenstruktur kühlmittelseitig gesetzt, Material
   gewichtet nur um") — bisher nicht eingebaut.
4. Optional: 27/28 als Appendix-Figur (dann Kosmetik aus §6 umsetzen).
5. Änderungen committen (tex, bib, PDF, Spec, dieses Wiki).
