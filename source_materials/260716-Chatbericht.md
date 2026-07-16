## Kernaussage der visuellen Re-Analyse

Die neuen Diagnoseplots stützen die Grundhypothese deutlich, präzisieren sie aber:

> Der „Rücken“ der inneren Widerstandsanteile entsteht **nicht direkt bei (Nu_2=Nu_1)** und auch nicht an der laminaren–turbulenten Grenze. Er entsteht dort, wo die **lokale Durchmessersensitivität des inneren G1-Modells** ungefähr der Durchmessersensitivität des äußeren G7-Modells entspricht.

Für Aluminium ist das nahezu ein reiner **G1–G7-Sensitivitätsausgleich**. Bei PA kommt der Wandwiderstand als dritter, geometrieabhängiger Mechanismus hinzu und erzeugt die ausgeprägteren Krümmungen und Richtungswechsel.

---

## 1. Graetz-Zahl: `23_graetz_number.pdf`

Die Farbfläche zeigt

[
Gz=Re_iPr_i\frac{d_i}{l}.
]

Da im Modell (v_i), (Pr_i), (\nu_i) und (l) konstant gehalten werden, gilt

[
Re_i\propto d_i
\qquad\Rightarrow\qquad
Gz\propto d_i^2.
]

Deshalb folgen die Graetz-Isolinien näherungsweise Linien konstanten Innendurchmessers:

[
d_i=d_o(1-2\tau)=\text{const.}
]

Das erklärt die starke Rechtskrümmung bei hohen Wanddickenverhältnissen: Je näher (\tau) an (50,%) kommt, desto größer muss (d_o) werden, um denselben Innendurchmesser und damit dieselbe Graetz-Zahl zu behalten. 

### Was der Plot eindeutig zeigt

* Der validierte Aluminiumreferenzpunkt bei (d_o=1,\mathrm{mm}), (\tau=10,%) liegt im **mittleren Graetz-Bereich**, ungefähr in der Größenordnung (Gz\sim10).
* Die relevanten dünnwandigen PA- und Aluminiumgeometrien liegen weit links von der roten Linie (Re_i=2300).
* Der beobachtete Rücken kann daher **kein laminar–turbulenter Übergang** sein.
* Die Linie (Nu_2=Nu_1) liegt sichtbar **links vom eigentlichen Sensitivitätsrücken**.

Dieser letzte Punkt ist wichtig: Die Gleichheit des voll entwickelten Grundterms (Nu_1) und des Eintrittsterms (Nu_2) kennzeichnet lediglich den Beginn eines relevanten thermischen Eintrittseinflusses. Sie ist **nicht** die mathematische Bedingung für das Maximum des Widerstandsanteils.

### Interpretation der drei Bereiche

**Kleine Durchmesser und (Gz\ll1):**

[
Nu_i\approx Nu_1\approx3.66.
]

Der innere Nusselt-Wert reagiert kaum auf den Durchmesser.

**Mittlere Graetz-Zahlen:**

Der thermische Eintrittsterm gewinnt an Einfluss. (Nu_i) wird deutlich durchmessersensitiv.

**Große Graetz-Zahlen:**

Das Eintrittsverhalten dominiert zunehmend; später kommen in der zusammengesetzten G1-Korrelation weitere Beiträge hinzu.

---

## 2. G1-Durchmessersensitivität: `24_g1_diameter_sensitivity.pdf`

Dieser Plot ist die physikalisch wichtigste Diagnosekarte. Dargestellt ist

[
S_i=
\frac{\partial\ln Nu_i}{\partial\ln d_i}.
]

Die Farbfläche entwickelt sich sehr glatt:

* links: (S_i\approx0),
* im Übergangsbereich: (S_i\approx0.2) bis (0.6),
* rechts: Werte um und teilweise oberhalb von (2/3).

Es gibt keinen Sprung oder eine unstetige Regimegrenze. Die Morphologie entsteht aus einem **stetigen Wechsel der lokalen Skalierung** innerhalb derselben laminaren G1-Korrelation. 

### Zusammenhang mit dem inneren Widerstand

Auf Außenflächenbasis gilt

[
R_i
===

# \frac{d_o}{d_i\alpha_i}

\frac{d_o}{\lambda_i Nu_i}.
]

Bei konstantem (\tau) ist (d_i\propto d_o), daher

[
\frac{\partial\ln R_i}{\partial\ln d_o}
=======================================

1-S_i.
]

Für die Außenseite gilt lokal näherungsweise

[
Nu_o\propto d_o^{m_o},
\qquad
R_o\propto d_o^{1-m_o}.
]

Wenn der Wandwiderstand vernachlässigbar ist, liegt das Maximum des normierten inneren Widerstandsanteils dort, wo

[
\frac{\partial\ln R_i}{\partial\ln d_o}
=======================================

\frac{\partial\ln R_o}{\partial\ln d_o}.
]

Damit folgt

[
S_i\approx m_o.
]

Die rote Aluminium-Rückenlinie liegt visuell ungefähr bei der (S_i\approx0.5)-Zone. Das passt sehr gut zu einer äußeren lokalen Skalierung in der Größenordnung

[
Nu_o\sim Re_o^{0.5}.
]

Das ist der stärkste visuelle Beleg für die Sensitivitätsbalance-Hypothese.

### Bedeutung der (2/3)-Linie

Die als „Lévêque asymptote: (2/3)“ bezeichnete Linie liegt rechts vom Aluminiumrücken.

Unter konstantem (v_i) gilt für den klassischen Lévêque-Term

[
Nu_i\propto Gz^{1/3}\propto d_i^{2/3}.
]

Daher ist

[
S_i=\frac23
]

die erwartete lokale Durchmesserskalierung eines reinen Lévêque-Terms.

Allerdings überschreitet die dargestellte Sensitivität rechts teilweise (2/3). Deshalb wäre die Beschriftung

> (S_i=2/3): Lévêque scaling

präziser als „Lévêque asymptote“. Der vollständige G1-Ansatz enthält weitere Beiträge und muss nicht überall bei (2/3) verbleiben.

---

## 3. Wand-Biot-Kennzahl für Aluminium: `25_wall_biot_aluminum.pdf`

Dargestellt ist

[
Bi_w^\ast=\frac{k_od_o}{\lambda_w}.
]

Im gesamten praktisch zugänglichen Aluminiumgebiet liegt diese Kennzahl ungefähr im Bereich

[
10^{-4}\text{ bis wenige }10^{-2}.
]

Am Referenzpunkt liegt sie etwa in der Größenordnung (10^{-3}). 

Die fast vertikalen Konturen zeigen außerdem:

* Die Kennzahl wird überwiegend durch (d_o) bestimmt.
* Der Einfluss von (\tau) ist gering.
* Der Aluminium-Wandwiderstand beeinflusst (k_o) so wenig, dass praktisch keine Rückkopplung auf die Karte entsteht.

### Direkter Zusammenhang mit dem Wandanteil

Mit

[
R_w=
\frac{d_o}{2\lambda_w}
\ln\left(\frac{d_o}{d_i}\right)
]

und

[
\phi_w=k_oR_w
]

folgt exakt:

[
\boxed{
\phi_w=
\frac{Bi_w^\ast}{2}
\ln\left(\frac{d_o}{d_i}\right)
}
]

Damit wird die geringe Bedeutung der Aluminiumwand unmittelbar sichtbar.

Beispielsweise bei (\tau=10,%):

[
\ln\left(\frac{d_o}{d_i}\right)
===============================

\ln\left(\frac1{0.8}\right)
\approx0.223.
]

Bei (Bi_w^\ast\approx10^{-3}) ergibt sich

[
\phi_w\approx0.00011
]

beziehungsweise etwa (0.01,%). Der Aluminium-Wandwiderstand ist dort thermisch tatsächlich vernachlässigbar.

---

## 4. Wand-Biot-Kennzahl für PA: `26_wall_biot_polymer.pdf`

Bei PA liegt dieselbe Kennzahl typischerweise zwischen ungefähr

[
0.5\text{ und }2,
]

teilweise auch darüber. Die (Bi_w^\ast=1)-Kontur verläuft ungefähr durch den Bereich um (d_o\sim1,\mathrm{mm}). 

Die PA-Konturen sind merklich stärker gekrümmt als bei Aluminium. Das ist eine reale Rückkopplung:

1. Kleine (\lambda_w) erhöht den Wandwiderstand.
2. Der Wandwiderstand senkt (k_o).
3. (k_o) ist selbst Bestandteil von (Bi_w^\ast).

### Wichtige Einschränkung

[
Bi_w^\ast=1
]

bedeutet **nicht**, dass der Wandwiderstand automatisch (50,%) des Gesamtwiderstands beträgt.

Entscheidend bleibt

[
\phi_w=
\frac{Bi_w^\ast}{2}
\ln\left(\frac{1}{1-2\tau}\right).
]

Für (Bi_w^\ast=1) ergibt sich beispielsweise:

|   (\tau) | geometrischer Logarithmus |     (\phi_w) |
| -------: | ------------------------: | -----------: |
|  (2.5,%) |       (\ln(1/0.95)=0.051) |  ca. (2.6,%) |
|  (7.5,%) |       (\ln(1/0.85)=0.163) |  ca. (8.1,%) |
|   (20,%) |       (\ln(1/0.60)=0.511) | ca. (25.5,%) |
| (32.5,%) |       (\ln(1/0.35)=1.050) | ca. (52.5,%) |

Damit lässt sich der scheinbare Widerspruch auflösen:

> PA kann bei (Bi_w^\ast\sim1) im dünnwandigen Bereich trotzdem nur wenige Prozent Wandwiderstand aufweisen.

Erst die Kombination aus hoher Biot-artiger Kennzahl **und** großem (\tau) macht die Wand dominant.

---

## 5. Morphologie des inneren Widerstandsanteils für Aluminium

Die Farbfläche zeigt den inneren Anteil

[
\phi_{i,\mathrm{Al}}.
]

Obwohl die Farbskala bis (100,%) reicht, liegen die tatsächlichen Werte überwiegend nur ungefähr zwischen (10) und (20,%). Die schwarze Isolinienstruktur ist deshalb aussagekräftiger als die Farbe. 

### Bedeutung der roten Rückenlinie

Entlang horizontaler Schnitte, also bei konstantem (\tau), zeigt sich:

1. Bei kleinen (d_o) steigt (\phi_i) mit (d_o).
2. An der roten Linie erreicht (\phi_i) ein lokales Maximum.
3. Rechts davon sinkt (\phi_i) wieder.

Die schwarzen Isolinien wenden an dieser Linie ihre Richtung. Der Rücken ist somit eine Linie lokaler Maxima von (\phi_i) bezüglich des Durchmessers.

Das ist keine Singularität und keine physikalische Phasengrenze. Es ist eine **Extremallinie eines normierten Widerstandsanteils**.

### Warum entsteht das Maximum?

Links vom Rücken ist die G1-Sensitivität noch klein:

[
S_i<m_o.
]

Der innere Widerstand wächst relativ stärker als der äußere, und (\phi_i) nimmt zu.

Rechts vom Rücken ist

[
S_i>m_o.
]

Durch den thermischen Eintrittseinfluss steigt (Nu_i) mit dem Durchmesser so stark, dass der innere Widerstand relativ zum Außenwiderstand wieder an Bedeutung verliert.

### Blaue Flip-Linien

Die blauen Linien liegen für Aluminium überwiegend im technologisch ausgeschlossenen beziehungsweise randnahen Gebiet. Im praktisch relevanten Aluminiumraum ist die Hauptstruktur deshalb der rote Rücken; zusätzliche Wanddicken-Richtungswechsel spielen kaum eine Rolle.

---

## 6. Morphologie des inneren Widerstandsanteils für PA

Auch bei PA bleibt ein Rücken in der Gegend um (d_o\sim1) bis einige Millimeter sichtbar. Die Konturstruktur ist jedoch deutlich komplexer. 

### Drei visuell erkennbare Unterschiede zu Aluminium

#### 1. Der innere Anteil ist insgesamt geringer

Die Karte liegt fast vollständig im dunkelroten Bereich, meist etwa um (5) bis (12,%).

Das bedeutet nicht, dass der innere Wärmeübergang bei PA besser wäre. Vielmehr erhöht der zusätzliche Wandwiderstand den Nenner

[
R_{\mathrm{tot}}=R_i+R_w+R_o,
]

wodurch

[
\phi_i=\frac{R_i}{R_{\mathrm{tot}}}
]

kleiner wird.

#### 2. Der Rücken wird durch die Wand verschoben

Für Aluminium genügt näherungsweise der Vergleich (R_i) gegen (R_o). Bei PA muss der Durchmessergradient von (R_w) mitberücksichtigt werden.

Die Rückenbedingung ist dann sinngemäß nicht mehr nur

[
\partial\ln R_i
===============

\partial\ln R_o,
]

sondern ein gewichteter Vergleich von (R_i) mit (R_o+R_w).

Deshalb verschiebt und krümmt sich die rote Linie.

#### 3. Zusätzliche blaue Flip-Äste entstehen bei großen Durchmessern

Die blauen Linien erscheinen vor allem bei

[
d_o\gtrsim3\text{–}5,\mathrm{mm}
]

und höheren Wanddickenverhältnissen. Dort ist (Bi_w^\ast) groß und der logarithmische Wandterm ebenfalls erheblich. Der Wandwiderstand kann dann die Richtung der Isolinien verändern.

Diese Äste sind daher plausibel wandinduziert.

### Aber: teilweise außerhalb des belastbaren Modellbereichs

Die ganz rechten Äste liegen teilweise nahe an der in der Graetz-Karte gezeigten Grenze

[
Re_i=2300.
]

Morphologien rechts oder unmittelbar an dieser Grenze dürfen nicht mehr ohne Weiteres mit der rein laminaren G1-Korrelation interpretiert werden.

Daher sollte man die komplexen blauen Äste bei (d_o\sim5)–(10,\mathrm{mm}) nicht als zentrale physikalische Erkenntnis des Papers verkaufen.

---

## Bedeutung für das praktische PA-Zielfenster

Das relevante PA-Fenster liegt etwa bei

[
d_o=0.35\text{–}0.65,\mathrm{mm},
\qquad
t\approx0.03\text{–}0.04,\mathrm{mm},
]

also ungefähr bei

[
\tau\approx5\text{–}11,%.
]

Dieses Gebiet liegt:

* deutlich links vom ausgeprägten Rücken,
* weit entfernt von den blauen Flip-Ästen,
* klar unterhalb der Reynolds-Übergangsgrenze,
* bei kleinen bis mittleren Graetz-Zahlen,
* bei einem Wandanteil von nur wenigen Prozent.

Die spektakulären Nasen und Richtungswechsel in der rechten Hälfte der PA-Karte erklären die globale Modellmorphologie, bestimmen aber **nicht** das vorgeschlagene submillimetrische Prototypfenster.

---

## Was die Grafiken nun belastbar belegen

### Belastbar

1. Die Innenströmung im relevanten Raum bleibt laminar.
2. Der thermische Eintrittseinfluss nimmt kontinuierlich mit (d_i) und (Gz) zu.
3. Der Aluminiumrücken liegt ungefähr dort, wo
   [
   \frac{\partial\ln Nu_i}{\partial\ln d_i}\approx0.5.
   ]
4. Der Rücken ist damit konsistent mit einer Sensitivitätsbalance zwischen G1 und G7.
5. Die Aluminiumwand ist thermisch praktisch bedeutungslos.
6. Bei PA ist der Wandwiderstand klein im dünnwandigen Zielbereich, verändert aber außerhalb dieses Bereichs die Isolinienmorphologie erheblich.

### Nicht belastbar beziehungsweise zu stark formuliert

1. **„Der Rücken liegt bei (Nu_2=Nu_1).“**
   Das zeigen die Karten gerade nicht. Die Linien sind voneinander getrennt.

2. **„Der Rücken ist der Übergang von voll entwickelt zu thermisch einlaufend.“**
   Besser:

   > Der Rücken liegt innerhalb des kontinuierlichen thermischen Entwicklungsbereichs und entsteht durch die dort auftretende Sensitivitätsbalance.

3. **„(Bi=1) bedeutet relevanter oder dominanter Wandwiderstand.“**
   Ohne den Faktor
   [
   \tfrac12\ln(d_o/d_i)
   ]
   ist diese Aussage falsch.

4. **„Die PA-Nasen sind vollständig durch den thermischen Einlauf erklärt.“**
   Nein. Die G1-Sensitivität erzeugt den Grundrücken; die zusätzliche PA-Morphologie wird wesentlich durch (R_w) erzeugt.

---

## Visuelle Schwächen der Diagnoseplots

### Widerstandsanteilsskala

Die Skala (0)–(100,%) ist für (\phi_i) zu weit. Da die dargestellten Werte fast vollständig unter (25,%) liegen, erscheint insbesondere die PA-Karte nahezu einfarbig.

Für Diagnosezwecke wäre eine gemeinsame Skala von beispielsweise

[
0\text{–}25,%
]

für Al und PA wesentlich informativer.

### Rote Rückenlinie auf rotem Hintergrund

In der PA-Karte ist die rote Linie kaum erkennbar. Sie sollte entweder:

* eine weiße Kontur beziehungsweise einen Halo erhalten,
* schwarz oder cyan dargestellt werden,
* oder deutlich dicker und gestrichelt ausgeführt werden.

### Rohrquerschnittssymbole

Die schwarzen Rohrquerschnitte verdecken genau den Bereich, in dem die PA-Flip-Linien und die stärksten Konturkrümmungen auftreten. Für die Diagnoseplots sollten sie entfernt werden.

### Unklare Größen (F) und (D)

Die Legenden

* `Ridge, F = 0`
* `Flip, D = 0`

sind ohne Definition nicht wissenschaftlich lesbar. Caption oder Text müssen explizit angeben:

* welche Ableitung beziehungsweise Differenz (F) beschreibt,
* welche Ableitung oder Orientierungsbedingung (D) beschreibt,
* welche Variable dabei konstant gehalten wird.

### Bezeichnung der Biot-Kennzahl

Da

[
Bi_w^\ast=\frac{k_od_o}{\lambda_w}
]

nicht der klassische Biot-Wert eines instationären Festkörpers ist, sollte er als

> effective wall Biot-type number

oder neutraler als

[
\Pi_w=\frac{k_od_o}{\lambda_w}
]

bezeichnet werden. Die physikalisch entscheidende Größe ist letztlich

[
\phi_w=
\frac{\Pi_w}{2}
\ln\left(\frac{d_o}{d_i}\right).
]

Diese Relation sollte direkt im Text zur PA-Morphologie stehen.
