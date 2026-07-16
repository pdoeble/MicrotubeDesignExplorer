# Project Spectral Colormap – Python-Export

Dieses Paket enthält exakt die 256 RGB-Stützstellen, die der Microtube Design
Explorer für seine wissenschaftlichen Abbildungen verwendet. Die normale
Reihenfolge läuft von Dunkelrot (`#9e0142`) bei kleinen Werten zu Violett
(`#5e4fa2`) bei großen Werten. Für umgekehrte Abbildungen ist eine zweite
Variante enthalten.

## Schnellstart mit Matplotlib

1. Diese ZIP-Datei entpacken.
2. Matplotlib und NumPy installieren:

   ```bash
   python -m pip install matplotlib numpy
   ```

3. `project_spectral.py` neben das eigene Skript legen und importieren:

   ```python
   import matplotlib.pyplot as plt
   from project_spectral import PROJECT_SPECTRAL

   image = plt.imshow(data, cmap=PROJECT_SPECTRAL, vmin=minimum, vmax=maximum)
   plt.colorbar(image)
   plt.show()
   ```

Für die umgekehrte Richtung:

```python
from project_spectral import PROJECT_SPECTRAL_REVERSED

plt.imshow(data, cmap=PROJECT_SPECTRAL_REVERSED)
```

Das vollständige Beispiel startet mit:

```bash
python example_matplotlib.py
```

## Plotly

```python
import plotly.graph_objects as go
from project_spectral import plotly_colorscale

figure = go.Figure(
    go.Heatmap(z=data, colorscale=plotly_colorscale())
)
figure.show()
```

Die umgekehrte Skala erhält man mit `plotly_colorscale(reverse=True)`.

## CSV ohne das Python-Modul laden

```python
import pandas as pd
from matplotlib.colors import ListedColormap

table = pd.read_csv("project_spectral.csv")
rgb = table[["red", "green", "blue"]].to_numpy(dtype=float) / 255.0
cmap = ListedColormap(rgb, name="project_spectral")
```

## Wichtig für identische Abbildungen

Die Colormap bestimmt nur die Farben. Für dieselbe Zuordnung von Messwerten zu
Farben müssen außerdem dieselben Grenzen (`vmin`, `vmax`) beziehungsweise
dieselbe Matplotlib-`norm` verwendet werden. Bei logarithmischen Skalen zum
Beispiel:

```python
from matplotlib.colors import LogNorm

plt.imshow(data, cmap=PROJECT_SPECTRAL, norm=LogNorm(vmin=0.05, vmax=5.0))
```

Matplotlibs eingebaute Map `Spectral` ergab bei der Validierung dieselben 256
RGB8-Werte. Für reproduzierbare Projektabbildungen sollte trotzdem die hier
eingefrorene Tabelle verwendet werden.

## Dateien

- `project_spectral.py`: direkt nutzbare Matplotlib-Maps und Plotly-Helfer
- `project_spectral.csv`: Index, normierte Position, RGB8 und Hex
- `project_spectral.json`: maschinenlesbare Tabelle und Provenienz
- `example_matplotlib.py`: lauffähiges Normal-/Reversed-Beispiel
- `ATTRIBUTION.md`: Herkunft und Weitergabehinweise

Die Tabelle wurde am 12.07.2026 aus MATLAB R2024b exportiert und am 13.07.2026
in der Anwendung integriert und abgenommen. Der RGB8-Hash lautet
`d6c042b2f53a3d4ae60dc6ae6584e01b4b379cbaf303390cab06868d8ba6730b`.
