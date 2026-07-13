declare module "plotly.js-dist-min" {
  export type PlotlyFont = { color?: string; family?: string; size?: number };

  export type PlotlyColorbar = {
    title?: { font?: PlotlyFont; side?: "right" | "top"; text: string };
    tickfont?: PlotlyFont;
    ticklabelposition?: string;
    ticklen?: number;
    ticks?: "inside" | "outside" | "";
    tickvals?: number[];
    ticktext?: string[];
    orientation?: "h" | "v";
    outlinecolor?: string;
    outlinewidth?: number;
    showticklabels?: boolean;
    x?: number;
    xanchor?: "center" | "left" | "right";
    y?: number;
    yanchor?: "bottom" | "middle" | "top";
    len?: number;
    lenmode?: "fraction" | "pixels";
    thickness?: number;
    thicknessmode?: "fraction" | "pixels";
  };

  export type PlotlyData = {
    type: "contour" | "heatmap" | "scatter";
    x?: unknown;
    y?: unknown;
    z?: unknown;
    mode?: string;
    name?: string;
    colorscale?: string | Array<[number, string]>;
    colorbar?: PlotlyColorbar;
    contours?: {
      coloring?: "none";
      end?: number;
      labelfont?: PlotlyFont;
      labelformat?: string;
      showlabels?: boolean;
      size?: number;
      start?: number;
    };
    customdata?: unknown;
    hoverinfo?: "skip";
    hovertemplate?: string;
    fill?: "toself";
    fillcolor?: string;
    labelfont?: PlotlyFont;
    line?: { color?: string; dash?: string; width?: number };
    marker?: {
      cmax?: number;
      cmin?: number;
      color?: string | number[];
      colorbar?: PlotlyColorbar;
      colorscale?: string | Array<[number, string]>;
      line?: { color?: string; width?: number };
      opacity?: number;
      showscale?: boolean;
      size?: number;
      symbol?: string;
    };
    showlegend?: boolean;
    showscale?: boolean;
    zauto?: boolean;
    zmax?: number;
    zmid?: number;
    zmin?: number;
    zsmooth?: false | "best" | "fast";
    xaxis?: string;
    yaxis?: string;
  };

  export type PlotlyAxis = {
    anchor?: string;
    domain?: number[];
    dtick?: number | string;
    gridcolor?: string;
    griddash?: string;
    gridwidth?: number;
    linecolor?: string;
    linewidth?: number;
    minor?: {
      dtick?: number | string;
      gridcolor?: string;
      griddash?: string;
      gridwidth?: number;
      showgrid?: boolean;
      tickcolor?: string;
      ticklen?: number;
      ticks?: "inside" | "outside" | "";
      tickwidth?: number;
    };
    mirror?: boolean | "ticks" | "all" | "allticks";
    range?: [number, number];
    showgrid?: boolean;
    showline?: boolean;
    showticklabels?: boolean;
    tick0?: number;
    tickcolor?: string;
    tickfont?: PlotlyFont;
    ticklen?: number;
    tickmode?: "array" | "linear";
    ticks?: "inside" | "outside" | "";
    ticktext?: string[];
    tickvals?: number[];
    tickwidth?: number;
    title?: { font?: PlotlyFont; standoff?: number; text: string };
    type?: "linear" | "log";
    zeroline?: boolean;
  };

  export type PlotlyLayout = {
    title?: { text: string };
    xaxis?: PlotlyAxis;
    yaxis?: PlotlyAxis;
    margin?: { l?: number; r?: number; t?: number; b?: number };
    annotations?: Array<Record<string, unknown>>;
    shapes?: Array<Record<string, unknown>>;
    legend?: { orientation?: "h" | "v"; x?: number; y?: number };
    font?: PlotlyFont;
    height?: number;
    paper_bgcolor?: string;
    plot_bgcolor?: string;
    showlegend?: boolean;
    width?: number;
    [axis: `xaxis${number}`]: unknown;
    [axis: `yaxis${number}`]: unknown;
  };

  export type PlotlyConfig = {
    responsive?: boolean;
    displaylogo?: boolean;
    toImageButtonOptions?: {
      format?: "png" | "svg";
      filename?: string;
      height?: number;
      scale?: number;
      width?: number;
    };
  };

  export type PlotlyFigure = {
    config?: PlotlyConfig;
    data: PlotlyData[];
    layout: PlotlyLayout;
  };

  const Plotly: {
    downloadImage: (
      target: HTMLElement | PlotlyFigure,
      options: {
        filename: string;
        format: "png" | "svg";
        height?: number;
        scale?: number;
        width?: number;
      },
    ) => Promise<string>;
    newPlot: (
      element: HTMLElement,
      data: PlotlyData[],
      layout: PlotlyLayout,
      config?: PlotlyConfig,
    ) => Promise<unknown>;
    purge: (element: HTMLElement) => void;
    toImage: (
      target: HTMLElement | PlotlyFigure,
      options: { format: "png" | "svg"; height?: number; scale?: number; width?: number },
    ) => Promise<string>;
  };

  export default Plotly;
}
