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
    hovertemplate?: string;
    showscale?: boolean;
  };

  export type PlotlyLayout = {
    title?: { text: string };
    xaxis?: { title?: { text: string }; type?: "linear" | "log" };
    yaxis?: { title?: { text: string }; type?: "linear" | "log" };
    margin?: { l?: number; r?: number; t?: number; b?: number };
    annotations?: Array<Record<string, unknown>>;
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
