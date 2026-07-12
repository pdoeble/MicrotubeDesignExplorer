declare module "plotly.js-dist-min" {
  export type PlotlyData = {
    type: "contour" | "heatmap" | "scatter";
    x?: unknown;
    y?: unknown;
    z?: unknown;
    mode?: string;
    name?: string;
    colorscale?: string | Array<[number, string]>;
    colorbar?: {
      title?: { text: string };
      tickvals?: number[];
      ticktext?: string[];
      orientation?: "h" | "v";
      x?: number;
      y?: number;
      len?: number;
      thickness?: number;
    };
    contours?: {
      coloring?: "none";
      end?: number;
      showlabels?: boolean;
      size?: number;
      start?: number;
    };
    customdata?: unknown;
    hoverinfo?: "skip";
    hovertemplate?: string;
    fill?: "toself";
    fillcolor?: string;
    labelfont?: { color?: string; family?: string; size?: number };
    line?: { color?: string; dash?: string; width?: number };
    marker?: {
      color?: string;
      line?: { color?: string; width?: number };
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

  export type PlotlyLayout = {
    title?: { text: string };
    xaxis?: {
      domain?: [number, number];
      range?: [number, number];
      tickmode?: "array" | "linear";
      ticktext?: string[];
      tickvals?: number[];
      title?: { text: string };
      type?: "linear" | "log";
    };
    yaxis?: {
      domain?: [number, number];
      dtick?: number;
      range?: [number, number];
      tick0?: number;
      tickmode?: "array" | "linear";
      title?: { text: string };
      type?: "linear" | "log";
    };
    margin?: { l?: number; r?: number; t?: number; b?: number };
    annotations?: Array<Record<string, unknown>>;
    legend?: { orientation?: "h" | "v"; x?: number; y?: number };
    font?: { color?: string; family?: string; size?: number };
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

  const Plotly: {
    downloadImage: (
      element: HTMLElement,
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
      element: HTMLElement,
      options: { format: "png" | "svg"; height?: number; scale?: number; width?: number },
    ) => Promise<string>;
  };

  export default Plotly;
}
