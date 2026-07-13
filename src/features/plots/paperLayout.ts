// Paper figure geometry replicated from the approved MATLAB reference;
// provenance is recorded in wiki/decisions/ADR-0011 (parameter block l. 61-318).
// All positions are absolute centimeters in MATLAB; the web renders the same
// geometry at any container width by scaling every pixel quantity with one
// zoom factor, so the plot-area aspect ratio (and therefore the roundness of
// the tube cross-section sketches) is invariant.

export const PX_PER_CM = 96 / 2.54;
const PX_PER_PT = 96 / 72;

export type CmRect = readonly [left: number, bottom: number, width: number, height: number];

export type PaperFigureGeometry = {
  /** Total figure size [width, height] in cm. */
  figureCm: readonly [number, number];
  /** Panel axes rectangles (left, bottom, width, height) in cm. */
  axesCm: readonly CmRect[];
  /** Shared colorbar rectangle in cm, if the figure has one. */
  colorbarCm?: CmRect;
  colorbarOrientation: "h" | "v";
  /** MATLAB base font size in pt (ticks); labels use 1.1x, contour labels -2pt. */
  baseFontPt: number;
};

// params.single_panel_figure_size_cm / _axes_cm / _colorbar_cm
export const SINGLE_MAP: PaperFigureGeometry = {
  axesCm: [[2.65, 2.8, 9.7, 8.75]],
  baseFontPt: 19,
  colorbarCm: [13.35, 2.8, 0.35, 8.75],
  colorbarOrientation: "v",
  figureCm: [16.5, 13.2],
};

// params.burst_grid_* (rows = wall tolerance, columns = Al/PA)
export const BURST_GRID: PaperFigureGeometry = {
  axesCm: [
    [2.7, 7.85, 6.65, 5.14],
    [10.35, 7.85, 6.65, 5.14],
    [2.7, 1.56, 6.65, 5.14],
    [10.35, 1.56, 6.65, 5.14],
  ],
  baseFontPt: 15,
  colorbarCm: [2.7, 14.05, 14.3, 0.34],
  colorbarOrientation: "h",
  figureCm: [19.0, 16.4],
};

// params.capillary_grid_figure_size_cm with the share-grid panel positions
// (plotCapillaryRiseGridAlPa reuses params.share_grid_axes_cm) and its own
// higher colorbar strip.
export const CAPILLARY_GRID: PaperFigureGeometry = {
  axesCm: [
    [2.7, 13.81, 6.65, 5.14],
    [10.35, 13.81, 6.65, 5.14],
    [2.7, 7.68, 6.65, 5.14],
    [10.35, 7.68, 6.65, 5.14],
    [2.7, 1.55, 6.65, 5.14],
    [10.35, 1.55, 6.65, 5.14],
  ],
  baseFontPt: 15,
  colorbarCm: [2.7, 20.1, 14.3, 0.34],
  colorbarOrientation: "h",
  figureCm: [19.0, 22.7],
};

// params.share_grid_* (rows = phi_i/phi_w/phi_o, columns = Al/PA)
export const SHARES_GRID: PaperFigureGeometry = {
  axesCm: [
    [2.7, 13.81, 6.65, 5.14],
    [10.35, 13.81, 6.65, 5.14],
    [2.7, 7.68, 6.65, 5.14],
    [10.35, 7.68, 6.65, 5.14],
    [2.7, 1.55, 6.65, 5.14],
    [10.35, 1.55, 6.65, 5.14],
  ],
  baseFontPt: 15,
  colorbarCm: [2.7, 19.9, 14.3, 0.34],
  colorbarOrientation: "h",
  figureCm: [19.0, 22.2],
};

// params.bundle_kA_* (stacked Aluminum/PA portrait with reversed top bar)
export const BUNDLE_KA_PORTRAIT: PaperFigureGeometry = {
  axesCm: [
    [4.2, 12.45, 11.25, 8.2],
    [4.2, 3.3, 11.25, 8.2],
  ],
  baseFontPt: 15,
  colorbarCm: [2.1, 22.1, 14.8, 0.34],
  colorbarOrientation: "h",
  figureCm: [19.0, 24.2],
};

// params.design_boundary_* (stacked Aluminum/PA with reversed top bar and
// a dedicated legend band below the panels: 2.20, 0.25, 14.60, 2.30 cm —
// the legend is rendered as an HTML block outside the Plotly figure).
export const DESIGN_BOUNDARY: PaperFigureGeometry = {
  axesCm: [
    [3.0, 15.1, 13.7, 10.0],
    [3.0, 4.2, 13.7, 10.0],
  ],
  baseFontPt: 15,
  colorbarCm: [3.0, 26.15, 13.7, 0.34],
  colorbarOrientation: "h",
  figureCm: [19.0, 28.4],
};

// params_kA_delta (Fig. 22): dedicated single-panel variant with a reversed
// horizontal top colorbar and superiority brace labels.
export const TECH_KA_DELTA: PaperFigureGeometry = {
  axesCm: [[3.0, 2.8, 13.7, 10.6]],
  baseFontPt: 15,
  colorbarCm: [3.0, 15.25, 13.7, 0.34],
  colorbarOrientation: "h",
  figureCm: [19.0, 17.9],
};

export type PaperZoom = {
  /** Multiply a cm quantity into device pixels. */
  cm(value: number): number;
  /** Multiply a MATLAB pt quantity (fonts, line widths) into device pixels. */
  pt(value: number): number;
  /** Figure pixel size. */
  width: number;
  height: number;
  zoom: number;
};

export function referenceWidthPx(geometry: PaperFigureGeometry): number {
  return geometry.figureCm[0] * PX_PER_CM;
}

export function paperZoom(geometry: PaperFigureGeometry, targetWidthPx?: number): PaperZoom {
  const reference = referenceWidthPx(geometry);
  const zoom = targetWidthPx !== undefined && targetWidthPx > 0 ? targetWidthPx / reference : 1;
  return {
    cm: (value) => value * PX_PER_CM * zoom,
    height: geometry.figureCm[1] * PX_PER_CM * zoom,
    pt: (value) => value * PX_PER_PT * zoom,
    width: geometry.figureCm[0] * PX_PER_CM * zoom,
    zoom,
  };
}

export type PanelDomains = {
  x: readonly [number, number];
  y: readonly [number, number];
};

/**
 * Plotly margins spanning exactly the union of all panel axes, plus the
 * paper-fraction domain of each panel inside that union.
 */
export function paperMargins(geometry: PaperFigureGeometry): {
  margin: { b: number; l: number; r: number; t: number };
  panelDomains: PanelDomains[];
  plotAreaCm: readonly [number, number];
} {
  const left = Math.min(...geometry.axesCm.map((rect) => rect[0]));
  const bottom = Math.min(...geometry.axesCm.map((rect) => rect[1]));
  const right = Math.max(...geometry.axesCm.map((rect) => rect[0] + rect[2]));
  const top = Math.max(...geometry.axesCm.map((rect) => rect[1] + rect[3]));
  const width = right - left;
  const height = top - bottom;
  return {
    margin: {
      b: bottom,
      l: left,
      r: geometry.figureCm[0] - right,
      t: geometry.figureCm[1] - top,
    },
    panelDomains: geometry.axesCm.map((rect) => ({
      x: [(rect[0] - left) / width, (rect[0] + rect[2] - left) / width] as const,
      y: [(rect[1] - bottom) / height, (rect[1] + rect[3] - bottom) / height] as const,
    })),
    plotAreaCm: [width, height] as const,
  };
}

/**
 * Plotly colorbar placement in paper fractions of the plot area described by
 * `paperMargins`. `x`/`y` anchor at the bar's leading edge like MATLAB's cm
 * rectangle; thickness stays in pixels.
 */
export function paperColorbarPlacement(
  geometry: PaperFigureGeometry,
  zoomInfo: PaperZoom,
):
  | {
      len: number;
      thickness: number;
      x: number;
      xanchor: "center" | "left";
      y: number;
      yanchor: "bottom" | "middle";
    }
  | undefined {
  if (!geometry.colorbarCm) return undefined;
  const { margin, plotAreaCm } = paperMargins(geometry);
  const [cbLeft, cbBottom, cbWidth, cbHeight] = geometry.colorbarCm;
  if (geometry.colorbarOrientation === "v") {
    return {
      len: cbHeight / plotAreaCm[1],
      thickness: zoomInfo.cm(cbWidth),
      x: (cbLeft - margin.l) / plotAreaCm[0],
      xanchor: "left",
      y: (cbBottom - margin.b) / plotAreaCm[1] + cbHeight / plotAreaCm[1] / 2,
      yanchor: "middle",
    };
  }
  return {
    len: cbWidth / plotAreaCm[0],
    thickness: zoomInfo.cm(cbHeight),
    x: (cbLeft - margin.l) / plotAreaCm[0] + cbWidth / plotAreaCm[0] / 2,
    xanchor: "center",
    y: (cbBottom - margin.b) / plotAreaCm[1],
    yanchor: "bottom",
  };
}
