export type PlotlyColorScale = Array<[number, string]>;

// Ordered colors recovered from the colorbar/fill sequence in the approved
// MATLAB export source_materials/.../01_ko_aluminum.svg. The SVG was produced
// by getProjectColormap(params) with slanCM('spectral') and 64 vector fill
// levels. Non-palette SVG colors (axes, annotations and markers) are excluded.
const MATLAB_SPECTRAL_RGB = [
  [250, 154, 88],
  [251, 162, 91],
  [252, 170, 95],
  [253, 176, 99],
  [253, 182, 104],
  [253, 190, 110],
  [253, 196, 115],
  [253, 202, 120],
  [253, 208, 125],
  [253, 214, 130],
  [253, 222, 137],
  [254, 226, 143],
  [254, 230, 149],
  [254, 233, 155],
  [254, 237, 161],
  [254, 242, 169],
  [254, 245, 175],
  [254, 249, 181],
  [254, 253, 187],
  [253, 254, 188],
  [250, 253, 184],
  [246, 251, 177],
  [243, 250, 173],
  [240, 249, 168],
  [237, 248, 164],
  [234, 246, 159],
  [230, 245, 153],
  [225, 243, 152],
  [218, 240, 154],
  [211, 237, 155],
  [204, 234, 157],
  [197, 231, 158],
  [188, 228, 160],
  [181, 225, 161],
  [174, 222, 163],
  [166, 219, 164],
  [158, 216, 164],
  [147, 212, 164],
  [139, 208, 164],
  [131, 205, 164],
  [123, 202, 164],
  [115, 199, 164],
  [107, 196, 164],
  [97, 189, 166],
  [91, 182, 169],
  [85, 175, 172],
  [79, 168, 175],
  [73, 162, 178],
  [65, 153, 181],
  [59, 146, 184],
  [53, 139, 187],
  [52, 132, 187],
  [57, 125, 184],
  [64, 117, 179],
  [69, 110, 176],
  [75, 103, 173],
  [80, 96, 170],
  [85, 90, 167],
  [90, 83, 164],
  [93, 79, 161],
] as const;

function buildScale(colors: readonly (readonly [number, number, number])[]): PlotlyColorScale {
  return colors.map(([red, green, blue], index) => [
    index / (colors.length - 1),
    `rgb(${red},${green},${blue})`,
  ]);
}

export const projectSpectral = buildScale(MATLAB_SPECTRAL_RGB);
export const projectSpectralReversed = buildScale([...MATLAB_SPECTRAL_RGB].reverse());
