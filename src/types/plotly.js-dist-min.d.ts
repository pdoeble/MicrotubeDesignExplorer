declare module "plotly.js-dist-min" {
  export type PlotlyData = {
    type: "heatmap" | "scatter";
    x?: unknown;
    y?: unknown;
    z?: unknown;
    mode?: string;
    name?: string;
    colorscale?: string;
    colorbar?: { title?: { text: string } };
    customdata?: unknown;
    hovertemplate?: string;
    line?: { color?: string; dash?: string; width?: number };
    marker?: { color?: string; size?: number; symbol?: string };
    showlegend?: boolean;
    showscale?: boolean;
    zauto?: boolean;
    zmax?: number;
    zmid?: number;
    zmin?: number;
  };

  export type PlotlyLayout = {
    title?: { text: string };
    xaxis?: { title?: { text: string }; type?: "linear" | "log" };
    yaxis?: { title?: { text: string }; type?: "linear" | "log" };
    margin?: { l?: number; r?: number; t?: number; b?: number };
    annotations?: Array<Record<string, unknown>>;
    legend?: { orientation?: "h" | "v"; x?: number; y?: number };
  };

  export type PlotlyConfig = {
    responsive?: boolean;
    displaylogo?: boolean;
    toImageButtonOptions?: {
      format?: "png" | "svg";
      filename?: string;
      scale?: number;
    };
  };

  const Plotly: {
    downloadImage: (
      element: HTMLElement,
      options: { filename: string; format: "png" | "svg"; scale?: number },
    ) => Promise<string>;
    newPlot: (
      element: HTMLElement,
      data: PlotlyData[],
      layout: PlotlyLayout,
      config?: PlotlyConfig,
    ) => Promise<unknown>;
    purge: (element: HTMLElement) => void;
  };

  export default Plotly;
}
