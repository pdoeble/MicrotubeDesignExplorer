"""Small runnable example for the exported project colormap."""

import matplotlib.pyplot as plt
import numpy as np
from project_spectral import PROJECT_SPECTRAL, PROJECT_SPECTRAL_REVERSED

x = np.linspace(-3.0, 3.0, 301)
y = np.linspace(-2.0, 2.0, 201)
xx, yy = np.meshgrid(x, y)
values = np.sin(xx**2 + yy**2) * np.exp(-0.12 * (xx**2 + yy**2))

figure, axes = plt.subplots(1, 2, figsize=(10, 3.8), constrained_layout=True)
for axis, colormap, title in (
    (axes[0], PROJECT_SPECTRAL, "project_spectral"),
    (axes[1], PROJECT_SPECTRAL_REVERSED, "project_spectral_reversed"),
):
    image = axis.imshow(
        values,
        cmap=colormap,
        origin="lower",
        extent=(x.min(), x.max(), y.min(), y.max()),
        aspect="auto",
        vmin=-1.0,
        vmax=1.0,
    )
    axis.set(title=title, xlabel="x", ylabel="y")
    figure.colorbar(image, ax=axis)

plt.show()
