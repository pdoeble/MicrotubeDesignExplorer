%% ============================================================
%  Waermedurchgang_V10_physical.m
%
%  Purpose:
%    Physics-based screening version for the Olbia paper. This script keeps the
%    V8/V9 figure layout but removes the presentation-derived empirical heat-
%    transfer fits from the thermal model.
%
%  Paper line implemented here:
%    - Outer convection: VDI-Waermeatlas 2013 G7, inline cross-flow tube bank.
%    - Inner convection: VDI-Waermeatlas 2013 G1, circular internal tube flow.
%    - Fluid properties: cited and explicit; no fitting to MA Fig. 2.8.
%    - MA Fig. 2.8 remains a forensic provenance check, not a calibration target.
%
%  Primary documentation:
%    - Investigations/heat_transfer_submodels_figures_2_7_2_8/
%      paper_safe_physical_model_path.md
%    - VDI_Waermeatlas.md, sections G1 and G7.
%
%  Assumption ledger:
%    - v_a = 5 m/s and v_i = 0.5 m/s are fixed screening operating points from
%      the previous Waermedurchgang scripts and current paper setup.
%    - Relative tube-bank pitch is kept geometrically similar through the sweep:
%      a = S_T/d_o = 3.28 and b = S_L/d_o = 2.00 from the MA / manuscript
%      benchmark geometry.
%    - n_rows = 36 is retained from the benchmark geometry. At this row count
%      VDI G7 is already in the many-row/asymptotic tube-bank regime, so the
%      script uses f_A directly. The finite-row formula is left in the helper
%      and can be activated for small n.
%    - Air properties are 20 degC, 1 bar values. They are numerically consistent
%      with the simple air set used in the successful Fig. 2.7 G7 reconstruction.
%    - Liquid properties are EGL5050 at 70 degC, linearly interpolated from
%      Wenger/Stoffdaten Online 60/80 degC values, because the MA states that
%      the KKL is filled with water-ethylene glycol 50:50.
%    - Inner length is L = 160 mm for the benchmark-scale paper map. Use
%      L = 100 mm as the reduced-prototype sensitivity case, not silently.
%    - Inner wall boundary condition is constant wall temperature. This is the
%      conservative lower-alpha_i G1 case relative to constant heat flux. The
%      heat-flux case should be exported as a sensitivity if needed.
%
%  Output:
%    - Export dir: Waermedurchgang_V10_physical_exports.
%    - Export filenames remain V8/V9-compatible for easy visual comparison.
% ============================================================

script_dir = fileparts(mfilename('fullpath'));

% (1) Fixed operating point
params.v_a_ms = 5.0;
params.v_i_ms = 0.5;

% (2) Color scaling
params.color_prct = [1 99];

% (3) Geometry validity
params.mask_invalid_di = true;

% (4) Contour settings
params.contours_mode        = "auto";
params.n_contours           = 6;
params.ko_contour_step_Wm2K = 50;
params.burst_contour_step_Al_bar   = 200;
params.burst_contour_step_Poly_bar = 10;
params.share_contour_levels = 1:1:99;          % every 1 %
params.re_i_contour_levels = [10 20 50 100 200 500 1000 2300 4000];
params.re_o_contour_levels = [20 50 100 200 500 1000 2300 5000 10000];
params.re_transition_level = 2300;
params.spacing_contour_levels_mm = [0.1 0.2 0.5 1 2 5 10];
params.dp_i_contour_levels_bar = [0.05 0.1 0.2 0.5 1 2 5];
params.coolant_flow_Lmin_contour_levels = [1 2 5 10 15 20 25 30 40];
params.kA_abs_contour_levels_WK = [5 10 25 50 75 100 150 200 300 500 750 1000 1500 2000 3000];
params.cost_contour_levels = [0.01 0.02 0.05 0.1 0.2 0.5 1 2 5 10 20 50 100];
params.capillary_contour_levels_mm = [0.2 0.5 1 2 5 10 20 50 100];
params.capillary_log_caxis_mm = [0.1 150];
params.capillary_label_spacing = 520;
params.capillary_contour_line_width = 0.70;
params.dp_i_log_caxis_bar = [0.05 5];
params.coolant_flow_Lmin_caxis = [0 30];
params.cost_log_caxis = [0.01 100];
params.ratio_pct_caxis_2d        = 100 .* ([0.8 1.8] - 1);   % [-20 +80] %
params.ratio_pct_tick_step       = 20;
params.ratio_pct_contour_step    = 20;
params.ratio_pct_labeled_step    = 40;
params.ratio_pct_label_levels    = [0 20 40];
params.ratio_pct_label_spacing   = 900;

% (5) Geometry sweep
params.t_mm_min  = 0.001;
params.t_mm_max  = 0.5;
params.da_mm_min = 0.1;
params.da_mm_max = 10.0;

% (6) Grid resolution
params.N_t  = 250;
params.N_da = 250;

% (6x) Coolant-throughput diagnostic at fixed tube-side velocity
params.coolant_flow_ref.do_mm = 1.0;
params.coolant_flow_ref.t_mm  = 0.10;
params.coolant_flow_ref.N     = 1080;
params.coolant_flow_ref.v_i_ms = params.v_i_ms;

% (6y) Bundle-scale conductance diagnostic reference
params.bundle_ref.do_mm = 1.0;
params.bundle_ref.t_mm  = 0.10;
params.bundle_ref.N     = 1080;

% Validated aluminum benchmark geometry used as reference marker in maps.
params.validated_ref.do_mm = 1.0;
params.validated_ref.t_mm = 0.10;
params.validated_ref.tau_pct = 100 .* params.validated_ref.t_mm ./ params.validated_ref.do_mm;
params.validated_ref.marker = 'x';
params.validated_ref.color = [0.00 0.10 0.90];
params.validated_ref.marker_size = 10;
params.validated_ref.line_width = 2.2;
params.validated_ref.show_label = false;

% (7) Y-axis
params.y_mode         = "t_over_da_percent";
params.y_pct_plot_lim = [0 40];
params.y_pct_calc_lim = [0 45];
params.y_pct_lim      = params.y_pct_plot_lim;
params.t_mm_max       = max(params.t_mm_max, ...
    params.da_mm_max .* params.y_pct_calc_lim(2) ./ 100);

% (8) Technology limits
params.tmin_Al_mm   = 0.07;
params.tmin_Poly_mm = 0.025;
params.mark_tech_in_ratio = true;
params.composite_boundary_samples = 600;

% Wall-thickness tolerance used only for the Lamé pressure-integrity screen.
% The thermal maps keep the nominal geometry. For pressure, eccentricity and
% wall non-uniformity are represented by the local minimum wall thickness
% t_loc,min = t_nom - Delta_t.
params.wall_tol_standard_mm = 0.020;
params.wall_tol_medical_mm  = 0.005;
params.wall_tol_Al_mm = params.wall_tol_standard_mm;
params.wall_tol_Poly_standard_mm = 0.020;
params.wall_tol_Poly_medical_mm  = 0.005;  % sensitivity row only
params.wall_tol_Poly_mm = params.wall_tol_Poly_standard_mm;

% (9) Plot ranges
params.x_mm_lim = [0.1 10];
params.ratio_caxis_3d = [0.95 1.05];
params.slice_y_pct    = [10 20 30];
params.slice_line_w   = 2.0;
params.slice_use_cmap = true;
params.make_3d_plot   = false;   % not used by the current LaTeX manuscript

% (10) Paper layout — single panel exports scaled for ~9 pt printed text
%      All map plots use IDENTICAL axes and colorbar positions.
params.single_panel_figure_size_cm  = [16.5 13.20];
params.single_panel_axes_cm         = [2.65  2.80  9.70  8.75];
params.single_panel_colorbar_cm     = [13.35 2.80  0.35  8.75];

% Shorter variant for the triple-stacked resistance-share figures (fits 3 on one A4 page)
params.share_panel_figure_size_cm   = [24.0 15.10];   % ~15% shorter
params.share_panel_axes_cm          = [2.25  2.20 13.05 12.20];
params.share_panel_colorbar_cm      = [16.10 2.20  0.45 12.20];

% Portrait resistance-share grid: rows = phi_i/phi_w/phi_o,
% columns = Aluminum/PA, one shared colorbar.
params.share_grid_figure_size_cm = [19.0 22.2];
params.share_grid_axes_cm = [
     2.70 13.81 6.65 5.14;   % row 1, col 1: phi_i Al
    10.35 13.81 6.65 5.14;   % row 1, col 2: phi_i PA
     2.70  7.68 6.65 5.14;   % row 2, col 1: phi_w Al
    10.35  7.68 6.65 5.14;   % row 2, col 2: phi_w PA
     2.70  1.55 6.65 5.14;   % row 3, col 1: phi_o Al
    10.35  1.55 6.65 5.14;   % row 3, col 2: phi_o PA
];
params.share_grid_colorbar_cm = [2.70 19.90 14.30 0.34];
params.share_grid_font_size = 15;

% Capillary grid needs a separate top strip so that the logarithmic
% colorbar and the first-row panel titles do not overlap.
params.capillary_grid_figure_size_cm = [19.0 22.7];
params.capillary_grid_colorbar_cm = [2.70 20.10 14.30 0.34];

% Portrait 2x2 burst-pressure grid: rows = wall tolerance, columns = Al/PA,
% one shared colorbar. Same panel width as the 3x2 portrait maps.
params.burst_grid_figure_size_cm = [19.0 16.4];
params.burst_grid_axes_cm = [
     2.70  7.85 6.65 5.14;   % row 1, col 1: Al, standard tolerance
    10.35  7.85 6.65 5.14;   % row 1, col 2: PA, standard tolerance
     2.70  1.56 6.65 5.14;   % row 2, col 1: Al, medical tolerance
    10.35  1.56 6.65 5.14;   % row 2, col 2: PA, medical tolerance
];
params.burst_grid_colorbar_cm = [2.70 14.05 14.30 0.34];
params.burst_grid_font_size = 15;

% Landscape triple-share figure: 3 panels side by side, one shared colorbar.
% Panel axes = 8.70 x 9.40 cm → aspect ratio 0.925 (matches single panels 13.05/14.10).
% font_size overridden to 15 inside plotTripleShareMap so that at width=21cm in LaTeX
%   scale = 21/34 = 0.618 → effective font 15×0.618 = 9.3 pt ≈ single-plot 8.8 pt.
% Wide figure (34 cm) gives 2.50 cm left margin (no left clipping) and 3.9 cm right
%   margin for colorbar tick labels + axis label (no right clipping).
% Rendered panel: 8.70×0.618 = 5.37 cm × 9.40×0.618 = 5.81 cm.
% Rendered height: 13×0.618 = 8.03 cm + caption (~2.5 cm) ≈ 10.5 ≤ 10.7 cm ← fits.
params.triple_share_figure_size_cm = [34.0 13.0];
params.triple_share_axes_cm = [
     2.50 2.20 8.70 9.40;   % panel 1 (phi_i)
    11.80 2.20 8.70 9.40;   % panel 2 (phi_w)
    21.10 2.20 8.70 9.40;   % panel 3 (phi_o)
];
params.triple_share_colorbar_cm = [30.40 2.20 0.50 9.40];

% Two-panel design-boundary summary figure.
% Stacked 2x1 layout: wide page-fit panels with a shared top colorbar.
params.design_boundary_figure_size_cm = [19.0 28.4];
params.design_boundary_axes_cm = [
     3.00 15.10 13.70 10.00;  % Aluminum
     3.00  4.20 13.70 10.00;  % PA
];
params.design_boundary_colorbar_cm = [3.00 26.15 13.70 0.34];
params.design_boundary_legend_cm = [2.20 0.25 14.60 2.30];
params.design_boundary_font_size = 15;
params.design_boundary_kA_caxis_WK = [50 500];
params.design_boundary_min_flow_Lmin = 10;
params.design_boundary_max_dp_bar = 0.5;
params.design_boundary_max_cost_index = 5;
params.design_boundary_min_burst_bar = 6;
params.design_boundary_max_capillary_mm = 2;
params.design_boundary_wall_tol_mm = params.wall_tol_standard_mm;
params.design_boundary_capillary_accel_over_g = 10;
params.design_boundary_line_width = 1.45;
params.design_boundary_hatch_length = 0.026;
params.design_boundary_hatch_spacing = 0.055;
params.design_boundary_hatch_angle_deg = 35;
params.design_boundary_color_min_wall = [0.00 0.00 0.00];
params.design_boundary_color_flow = [0.00 0.32 0.74];
params.design_boundary_color_dp = [0.90 0.55 0.00];
params.design_boundary_color_cost = [0.58 0.00 0.83];
params.design_boundary_color_burst = [0.00 0.58 0.20];
params.design_boundary_color_capillary = [0.80 0.00 0.00];

% Two-panel bundle-conductance summary. The figure is composed smaller than
% Fig. 7 but included at full LaTeX width, so text size remains consistent.
params.bundle_kA_figure_size_cm = [19.0 24.2];
params.bundle_kA_axes_cm = [
     4.20 12.45 11.25 8.20;  % Aluminum
     4.20  3.30 11.25 8.20;  % PA
];
params.bundle_kA_colorbar_cm = [2.10 22.10 14.80 0.34];
params.bundle_kA_font_size = params.design_boundary_font_size;
params.bundle_kA_colorbar_ticks_WK = [5 10 20 50 100 200 500 1000 2000];
params.bundle_kA_y_ticks_pct = 0:10:40;

params.font_name       = 'Times New Roman';
params.font_size       = 19;
params.title_font_size = 19;   % titles suppressed in V8
params.panel_title_y_norm = 1.012;
params.axis_line_width = 1.3;
params.grid_axis_line_width = 1.0;
params.colorbar_width  = 0.02;
params.contour_label_spacing     = 900;
params.colormap_name  = 'spectral';
params.vector_fill_levels        = 64;
params.plot3d_mesh_stride        = 4;

% Cross-section sketches (restored from V7)
params.show_cross_section_sketches           = true;
params.cross_section_da_mm                   = [0.25 1.0 6.0];
params.cross_section_y_pct                   = [7.5 20.0 32.5];
params.cross_section_radius_pct              = 1.2;
params.cross_section_reference_da_mm         = 1.0;
params.cross_section_quarter_da_threshold_mm = 6.0;
params.cross_section_reference_axes_cm       = params.single_panel_axes_cm(3:4);
params.cross_section_color                   = [77 77 77] ./ 255;

% Tech-limit line style (V8: colored, thicker)
params.tech_Al_color   = [0.00 0.10 0.60];   % dark blue
params.tech_Poly_color = [0.00 0.50 0.10];   % dark green
params.tech_line_width = 2.6;
params.grid_tech_line_width = 2.0;

% (11) Capillary-rise screening inputs
%
% This block is intentionally explicit because the plot is a manufacturing
% constraint map, not part of the VDI heat-transfer model above.
%
% Gap convention:
%   The map uses the full geometric clear gap s between adjacent tubes.
%   For a slit-like gap / parallel-plate approximation, the static capillary
%   balance gives
%
%       h_cap = C_cap / (G*s)
%
%   with
%
%       C_cap = 2*gamma*cos(theta_eff)/(rho*g).
%
%   Therefore C_cap already contains the factor 2 from the parallel-plate
%   force balance. Do not multiply C_cap by 2 again when using the full gap s.
%
% PA/process proxy:
%   C_cap,PA,eff = 5.4 +/- 0.5 mm^2 from a Plexiglas/PMMA wedge-gap
%   resin-rise fit using unfilled WEVOPOX/WEVODUR at 22 degC. This is an
%   effective process-screening parameter, not a PA material constant or a
%   direct WEVO-on-PA contact-angle measurement.
%
% Al estimate:
%   No WEVO-on-aluminum wedge test is available here. The aluminum column is
%   therefore a literature-based wetting-side estimate using the potting
%   density, liquid-air surface tension, and epoxy/aluminum contact angle.
%   This is not a validation of the exact WEVO/aluminum pair.
params.g_ms2 = 9.80665;
params.capillary.accel_over_g = [1 5 10];
params.capillary.Ccap_pa_eff_mm2 = 5.4;
params.capillary.Ccap_pa_eff_unc_k2_mm2 = 0.5;
params.capillary.rho_potting_kgm3 = 1110.0;
params.capillary.gamma_al_mNm = 45.6;
params.capillary.theta_al_deg = 41.39;
params.capillary.Ccap_al_mm2 = ...
    2 .* (params.capillary.gamma_al_mNm .* 1e-3) .* ...
    cosd(params.capillary.theta_al_deg) ./ ...
    (params.capillary.rho_potting_kgm3 .* params.g_ms2) .* 1e6;

% Capillary sanity checks for the full-gap slit convention.
assert(params.capillary.Ccap_pa_eff_mm2 > 4.5 && ...
       params.capillary.Ccap_pa_eff_mm2 < 6.5, ...
       'Unexpected PA/process proxy capillary parameter.');
h_full_gap_test = params.capillary.Ccap_pa_eff_mm2 ./ params.capillary.Ccap_pa_eff_mm2;
assert(abs(h_full_gap_test - 1) < 1e-12, ...
    'Full-gap capillary convention violated.');
h_pa_s1_g1_mm = params.capillary.Ccap_pa_eff_mm2 ./ 1.0 ./ 1.0;
h_pa_s2_g10_mm = params.capillary.Ccap_pa_eff_mm2 ./ 2.0 ./ 10.0;
h_al_s2_g10_mm = params.capillary.Ccap_al_mm2 ./ 2.0 ./ 10.0;
assert(abs(h_pa_s1_g1_mm - 5.4) < 1e-12, ...
    'Expected PA/process h_cap at s=1 mm, G=1 is 5.4 mm.');
assert(abs(h_pa_s2_g10_mm - 0.27) < 5e-3, ...
    'Expected PA/process h_cap at s=2 mm, G=10 is about 0.27 mm.');
assert(abs(h_al_s2_g10_mm - 0.314) < 5e-3, ...
    'Expected Al h_cap at s=2 mm, G=10 is about 0.314 mm.');

% (12) Bundle tube-supply cost orientation
%
% The cost maps use the paper benchmark footprint, not the reduced MA
% prototype. At d_o=1 mm the benchmark has 30 transverse by 36 longitudinal
% tubes with the same relative pitch ratios used by the VDI G7 model. Keeping
% this footprint and the relative pitch ratios fixed gives the stepwise tube
% count that underlies the older hard-coded cost-performance plot:
%   N_T = floor(30/d_o), N_L = floor(36/d_o) for the inline paper layout.
%
% The scalar reference indices below are a least-squares projection of the
% older digitized cost vectors onto C_tube/C_fin proportional to raw tube
% length. They absorb the material-specific tube-price-per-length and the
% finned-radiator procurement normalization, while avoiding hard-coded
% diameter arrays in the 2D design-space maps.
params.cost.arrangement = "inline";  % "inline" for the current paper model; "staggered" supported in helper.
params.cost.reference_do_mm = 1.0;
params.cost.reference_n_transverse = 30;
params.cost.reference_n_longitudinal = 36;
params.cost.active_length_mm = 160.0;
params.cost.overhang_total_mm = 0.0;
params.cost.scrap_factor = 1.0;
params.cost.reference_index_Al = 2.096225695575453;
params.cost.reference_index_Poly = 0.6269018203303992;

% (13) Export
params.export_figures = ~strcmpi(getenv('WAERME_SKIP_EXPORT'), '1');
params.export_dir     = fullfile(script_dir, 'Waermedurchgang_V10_physical_exports');
if ~isempty(getenv('WAERME_EXPORT_DIR'))
    params.export_dir = getenv('WAERME_EXPORT_DIR');
end
params.clean_export_dir = ~strcmpi(getenv('WAERME_KEEP_EXPORTS'), '1');
params.export_svg     = ~strcmpi(getenv('WAERME_SKIP_SVG'), '1');
params.export_svg_renderer = '-painters';
params.export_png     = false;
params.export_pdf     = true;    % LaTeX includes PDF when compiling with pdfLaTeX
params.export_png_resolution = 300;

% (14) Material properties
mat.Al.lambda_WmK   = 220.0;
mat.Poly.lambda_WmK = 0.25;
mat.Al.Rm_MPa       = 200;
mat.Poly.Rm_MPa     = 10;

% (15) Fluid properties used by the physical heat-transfer model
%
% Air source:
%   Wenger Engineering / Stoffdaten Online, "Stoffdaten Luft bei 1 bar",
%   20 degC row. Values are nearly identical to the MA Fig. 2.7 validation set
%   (lambda=0.0257 W/mK, nu=1.51e-5 m2/s, Pr=0.71).
fluid.air.name           = "air_20C_1bar";
fluid.air.T_C            = 20.0;
fluid.air.rho_kgm3       = 1.189;
fluid.air.cp_JkgK        = 1006.0;
fluid.air.lambda_WmK     = 0.02587;
fluid.air.nu_m2s         = 15.32e-6;
fluid.air.mu_Pas         = 18.21548e-6;
fluid.air.Pr            = 0.70834;

% Liquid source:
%   Wenger Engineering / Stoffdaten Online, water-ethylene glycol 50:50.
%   MA_Main_V2.md states that the KKL is filled with EGL5050. The values below
%   are a linear interpolation between the published 60 and 80 degC rows.
%   Do not substitute the warm-water Fig. 2.8 forensic set here; that set only
%   explains the MA Re=2300 clue and is not the stated KKL coolant.
fluid.liquid.name        = "EGL5050_70C";
fluid.liquid.T_C         = 70.0;
fluid.liquid.rho_kgm3    = 1041.5;
fluid.liquid.cp_JkgK     = 3555.0;
fluid.liquid.lambda_WmK  = 0.423;
fluid.liquid.nu_m2s      = 1.23e-6;
fluid.liquid.mu_Pas      = 1.2825e-3;
fluid.liquid.Pr          = 10.77846;

% (16) Outer convection model: VDI G7 inline tube bank
%
% Geometry source:
%   MA/manuscript benchmark geometry, also used in the successful G7
%   reconstruction of MA Fig. 2.7:
%     a = S_T/d_o = 3.28, b = S_L/d_o = 2.00, n_rows = 36.
% VDI G7 equations implemented in vdiG7InlineTubeBankAlpha().
model_outer.chapter                  = "VDI2013_G7_inline_tube_bank";
model_outer.a_pitch_transverse       = 3.28;
model_outer.b_pitch_longitudinal     = 2.00;
model_outer.n_rows                   = 36;
model_outer.use_finite_row_correction = false;  % n=36: use many-row f_A.
model_outer.property_correction_K     = 1.0;    % gas-side wall-T correction not used.

% (17) Inner convection model: VDI G1 internal circular tube flow
%
% Length source:
%   The paper benchmark table uses L=160 mm. MA Table 3.2 gives L=100 mm for
%   reduced prototypes; use that as an explicit sensitivity, not as a hidden fit.
% Boundary-condition choice:
%   constant_wall_temperature is conservative for alpha_i compared with
%   constant_heat_flux. Switch this field only for a named sensitivity export.
model_inner.chapter             = "VDI2013_G1_internal_tube_flow";
model_inner.length_m            = 0.160;
model_inner.boundary_condition  = "constant_wall_temperature";
model_inner.apply_liquid_Pr_wall_correction = false; % needs measured wall T.
model_inner.Pr_wall             = NaN;
params.bundle_ref.L_m           = model_inner.length_m;

% Physical sanity checks at the nominal geometry:
%   d_o=1.0 mm, t=0.1 mm -> d_i=0.8 mm, v_a=5 m/s, v_i=0.5 m/s.
alpha_o_check = vdiG7InlineTubeBankAlpha(params.v_a_ms, 1.0, model_outer, fluid.air);
alpha_i_check = vdiG1InternalTubeAlpha(params.v_i_ms, 0.8, model_inner, fluid.liquid);
R_o_check     = 1 ./ alpha_o_check;
Rii_check     = 1 ./ alpha_i_check;
assert(alpha_o_check > 300 && alpha_o_check < 370, ...
    'VDI G7 nominal alpha_o outside expected 20 degC air range.');
assert(R_o_check > 2.7e-3 && R_o_check < 3.3e-3, ...
    'VDI G7 nominal R_o outside expected benchmark range.');
assert(Rii_check > 3.5e-4 && Rii_check < 4.8e-4, ...
    'VDI G1 nominal EGL5050 inner resistance outside expected conservative range.');

setPresentationDefaults(params);


%% ============================================================
%  Computation
% ============================================================

t_mm  = logspace(log10(params.t_mm_min),  log10(params.t_mm_max),  params.N_t);
da_mm = logspace(log10(params.da_mm_min), log10(params.da_mm_max), params.N_da);
[DA_mm, T_mm] = meshgrid(da_mm, t_mm);

Y_pct  = 100 .* (T_mm ./ DA_mm);
DI_mm  = DA_mm - 2.*T_mm;

invalid = false(size(DI_mm));
if params.mask_invalid_di
    invalid = (DI_mm <= 0);
end
DI_mm_nan = DI_mm;
DI_mm_nan(invalid) = NaN;

alpha_a = vdiG7InlineTubeBankAlpha(params.v_a_ms, DA_mm, model_outer, fluid.air);
alpha_i = vdiG1InternalTubeAlpha(params.v_i_ms, DI_mm_nan, model_inner, fluid.liquid);
Rii     = 1 ./ alpha_i;

da_m = DA_mm .* 1e-3;
di_m = DI_mm_nan .* 1e-3;
Re_i = params.v_i_ms .* di_m ./ fluid.liquid.nu_m2s;
Re_o_simple = params.v_a_ms .* da_m ./ fluid.air.nu_m2s;
[~, Re_o_vdi] = vdiG7InlineTubeBankAlpha(params.v_a_ms, DA_mm, model_outer, fluid.air);
dp_i_fric_bar_raw = calcTubeFrictionPressureDropBar( ...
    params.v_i_ms, DI_mm_nan, model_inner, fluid.liquid);

% Coolant-throughput diagnostic at fixed tube-side velocity.
% Assumption: geometrically similar tube-bank pitch and fixed package size.
% Therefore N/N_ref = (d_o,ref/d_o)^2. The continuous tube-count model avoids
% artificial bands in the design-space diagnosis.
do_ref_mm = params.coolant_flow_ref.do_mm;
t_ref_mm  = params.coolant_flow_ref.t_mm;
N_ref     = params.coolant_flow_ref.N;
di_ref_mm = do_ref_mm - 2 .* t_ref_mm;

N_tubes_raw = N_ref .* (do_ref_mm ./ DA_mm).^2;
coolant_Vdot_m3s_raw = N_tubes_raw .* params.v_i_ms .* ...
    (pi ./ 4) .* (DI_mm_nan .* 1e-3).^2;
coolant_Vdot_Lmin_raw = coolant_Vdot_m3s_raw .* 60000;
coolant_mdot_kg_s_raw = coolant_Vdot_m3s_raw .* fluid.liquid.rho_kgm3;

di_ref_m = di_ref_mm .* 1e-3;
Vdot_ref_m3s = N_ref .* params.coolant_flow_ref.v_i_ms .* ...
    (pi ./ 4) .* di_ref_m.^2;
Vdot_ref_Lmin = Vdot_ref_m3s .* 60000;
params.coolant_flow_ref.Vdot_Lmin = Vdot_ref_Lmin;

compute_k = @(lam) 1 ./ ( ...
    (da_m ./ (di_m .* alpha_i)) + ...
    (da_m ./ (2 .* lam)) .* log(da_m ./ di_m) + ...
    (1 ./ alpha_a) );

k_Al_raw   = compute_k(mat.Al.lambda_WmK);
k_Poly_raw = compute_k(mat.Poly.lambda_WmK);
k_Al_raw(invalid)   = NaN;
k_Poly_raw(invalid) = NaN;

% Bundle-scale conductance diagnostic at fixed package dimensions.
% Geometrically similar pitch ratios imply N/N_ref = (d_o,ref/d_o)^2.
do_bundle_ref_mm = params.bundle_ref.do_mm;
t_bundle_ref_mm  = params.bundle_ref.t_mm;
N_bundle_ref     = params.bundle_ref.N;
L_bundle_ref_m   = params.bundle_ref.L_m;
di_bundle_ref_mm = do_bundle_ref_mm - 2 .* t_bundle_ref_mm;

N_bundle_raw = N_bundle_ref .* (do_bundle_ref_mm ./ DA_mm).^2;
Ao_bundle_m2_raw = N_bundle_raw .* pi .* (DA_mm .* 1e-3) .* L_bundle_ref_m;
Ao_ref_m2 = N_bundle_ref .* pi .* (do_bundle_ref_mm .* 1e-3) .* L_bundle_ref_m;

kA_Al_raw_WK = k_Al_raw .* Ao_bundle_m2_raw;
kA_Poly_raw_WK = k_Poly_raw .* Ao_bundle_m2_raw;

alpha_a_bundle_ref = vdiG7InlineTubeBankAlpha( ...
    params.v_a_ms, do_bundle_ref_mm, model_outer, fluid.air);
alpha_i_bundle_ref = vdiG1InternalTubeAlpha( ...
    params.v_i_ms, di_bundle_ref_mm, model_inner, fluid.liquid);

da_bundle_ref_m = do_bundle_ref_mm .* 1e-3;
di_bundle_ref_m = di_bundle_ref_mm .* 1e-3;
k_Al_ref_Wm2K = 1 ./ ( ...
    (da_bundle_ref_m ./ (di_bundle_ref_m .* alpha_i_bundle_ref)) + ...
    (da_bundle_ref_m ./ (2 .* mat.Al.lambda_WmK)) .* log(da_bundle_ref_m ./ di_bundle_ref_m) + ...
    (1 ./ alpha_a_bundle_ref) );
kA_Al_ref_WK = k_Al_ref_Wm2K .* Ao_ref_m2;

N_bundle_raw(invalid) = NaN;
Ao_bundle_m2_raw(invalid) = NaN;
params.bundle_ref.di_mm = di_bundle_ref_mm;
params.bundle_ref.Ao_ref_m2 = Ao_ref_m2;
params.bundle_ref.k_Al_ref_Wm2K = k_Al_ref_Wm2K;
params.bundle_ref.kA_Al_ref_WK = kA_Al_ref_WK;

DI_burst_Al_mm = calcEffectiveInnerDiameterForBurst( ...
    DA_mm, T_mm, params.wall_tol_Al_mm);
DI_burst_Poly_mm = calcEffectiveInnerDiameterForBurst( ...
    DA_mm, T_mm, params.wall_tol_Poly_mm);
pB_Al_bar_raw   = calcPburstBar(DA_mm, DI_burst_Al_mm, mat.Al.Rm_MPa);
pB_Poly_bar_raw = calcPburstBar(DA_mm, DI_burst_Poly_mm, mat.Poly.Rm_MPa);

burstTol_mm = [params.wall_tol_standard_mm, params.wall_tol_medical_mm];
pB_Al_tol_bar_raw = NaN([size(DA_mm), numel(burstTol_mm)]);
pB_Poly_tol_bar_raw = NaN([size(DA_mm), numel(burstTol_mm)]);
for ii = 1:numel(burstTol_mm)
    diBurstTol = calcEffectiveInnerDiameterForBurst(DA_mm, T_mm, burstTol_mm(ii));
    pB_Al_tol_bar_raw(:, :, ii) = calcPburstBar(DA_mm, diBurstTol, mat.Al.Rm_MPa);
    pB_Poly_tol_bar_raw(:, :, ii) = calcPburstBar(DA_mm, diBurstTol, mat.Poly.Rm_MPa);
end
Re_i_raw = Re_i;
Re_o_simple_raw = Re_o_simple;
Re_o_vdi_raw = Re_o_vdi;
S_T_mm = model_outer.a_pitch_transverse .* DA_mm;
S_L_mm = model_outer.b_pitch_longitudinal .* DA_mm;
clearSpacingTrans_mm_raw = S_T_mm - DA_mm;
clearSpacingLong_mm_raw = S_L_mm - DA_mm;
clearSpacingClosestInline_mm_raw = min(clearSpacingTrans_mm_raw, clearSpacingLong_mm_raw);
clearSpacingClosestStaggered_mm_raw = min(clearSpacingTrans_mm_raw, ...
    sqrt(S_L_mm.^2 + (0.5 .* S_T_mm).^2) - DA_mm);

Y_calc_mask = (Y_pct < params.y_pct_calc_lim(1)) | (Y_pct > params.y_pct_calc_lim(2));
k_Al_raw(Y_calc_mask)        = NaN;
k_Poly_raw(Y_calc_mask)      = NaN;
kA_Al_raw_WK(Y_calc_mask)    = NaN;
kA_Poly_raw_WK(Y_calc_mask)  = NaN;
Ao_bundle_m2_raw(Y_calc_mask) = NaN;
N_bundle_raw(Y_calc_mask)    = NaN;
pB_Al_bar_raw(Y_calc_mask)   = NaN;
pB_Poly_bar_raw(Y_calc_mask) = NaN;
for ii = 1:numel(burstTol_mm)
    tmpAl = pB_Al_tol_bar_raw(:, :, ii);
    tmpPoly = pB_Poly_tol_bar_raw(:, :, ii);
    tmpAl(Y_calc_mask) = NaN;
    tmpPoly(Y_calc_mask) = NaN;
    pB_Al_tol_bar_raw(:, :, ii) = tmpAl;
    pB_Poly_tol_bar_raw(:, :, ii) = tmpPoly;
end
Re_i_raw(Y_calc_mask)        = NaN;
Re_o_simple_raw(Y_calc_mask) = NaN;
Re_o_vdi_raw(Y_calc_mask)    = NaN;
dp_i_fric_bar_raw(Y_calc_mask) = NaN;
coolant_Vdot_Lmin_raw(Y_calc_mask) = NaN;
coolant_mdot_kg_s_raw(Y_calc_mask) = NaN;
N_tubes_raw(Y_calc_mask) = NaN;
clearSpacingTrans_mm_raw(Y_calc_mask) = NaN;
clearSpacingLong_mm_raw(Y_calc_mask) = NaN;
clearSpacingClosestInline_mm_raw(Y_calc_mask) = NaN;
clearSpacingClosestStaggered_mm_raw(Y_calc_mask) = NaN;

techMaskAl   = (T_mm < params.tmin_Al_mm);
techMaskPoly = (T_mm < params.tmin_Poly_mm);

k_Al_plot   = k_Al_raw;    pB_Al_bar   = pB_Al_bar_raw;
k_Poly_plot = k_Poly_raw;  pB_Poly_bar = pB_Poly_bar_raw;
kA_Al_plot_WK = kA_Al_raw_WK;
kA_Poly_plot_WK = kA_Poly_raw_WK;
pB_Al_tol_bar = pB_Al_tol_bar_raw;
pB_Poly_tol_bar = pB_Poly_tol_bar_raw;
Re_i_plot = Re_i_raw;
Re_o_simple_plot = Re_o_simple_raw;
Re_o_vdi_plot = Re_o_vdi_raw;
dp_i_fric_bar_plot = dp_i_fric_bar_raw;
coolant_Vdot_Lmin_plot = coolant_Vdot_Lmin_raw;
coolant_mdot_kg_s_plot = coolant_mdot_kg_s_raw;
N_tubes_plot = N_tubes_raw;
clearSpacingTrans_mm = clearSpacingTrans_mm_raw;
clearSpacingLong_mm = clearSpacingLong_mm_raw;
clearSpacingClosestInline_mm = clearSpacingClosestInline_mm_raw;
clearSpacingClosestStaggered_mm = clearSpacingClosestStaggered_mm_raw;
k_Al_plot(techMaskAl)     = NaN;   pB_Al_bar(techMaskAl)     = NaN;
k_Poly_plot(techMaskPoly) = NaN;   pB_Poly_bar(techMaskPoly) = NaN;
kA_Al_plot_WK(techMaskAl) = NaN;
kA_Poly_plot_WK(techMaskPoly) = NaN;
% PA-oriented diagnostic maps are clipped at the PA minimum-wall limit.
dp_i_fric_bar_plot(techMaskPoly) = NaN;
coolant_Vdot_Lmin_plot(techMaskPoly) = NaN;
for ii = 1:numel(burstTol_mm)
    tmpAl = pB_Al_tol_bar(:, :, ii);
    tmpPoly = pB_Poly_tol_bar(:, :, ii);
    tmpAl(techMaskAl) = NaN;
    tmpPoly(techMaskPoly) = NaN;
    pB_Al_tol_bar(:, :, ii) = tmpAl;
    pB_Poly_tol_bar(:, :, ii) = tmpPoly;
end
Re_i_plot(techMaskPoly) = NaN;
Re_o_simple_plot(techMaskPoly) = NaN;
Re_o_vdi_plot(techMaskPoly) = NaN;
clearSpacingTrans_mm(techMaskPoly) = NaN;
clearSpacingLong_mm(techMaskPoly) = NaN;
clearSpacingClosestInline_mm(techMaskPoly) = NaN;
clearSpacingClosestStaggered_mm(techMaskPoly) = NaN;

% Capillary-rise maps for potting resin between adjacent tubes.
% The driving gap is the closest inline full clear spacing, because the paper
% model uses the inline tube bank. The equilibrium height scales inversely with
% the effective acceleration opposing the rise.
nCapAccel = numel(params.capillary.accel_over_g);
capillaryRiseAl_mm = NaN([size(DA_mm), nCapAccel]);
capillaryRisePA_mm = NaN([size(DA_mm), nCapAccel]);
capillaryRiseAl_raw_mm = NaN([size(DA_mm), nCapAccel]);
capillaryRisePA_raw_mm = NaN([size(DA_mm), nCapAccel]);
for ii = 1:nCapAccel
    accelFactor = params.capillary.accel_over_g(ii);
    capillaryRiseAl_raw_mm(:, :, ii) = ...
        params.capillary.Ccap_al_mm2 ./ clearSpacingClosestInline_mm_raw ./ accelFactor;
    capillaryRisePA_raw_mm(:, :, ii) = ...
        params.capillary.Ccap_pa_eff_mm2 ./ clearSpacingClosestInline_mm_raw ./ accelFactor;

    capillaryRiseAl_mm(:, :, ii) = capillaryRiseAl_raw_mm(:, :, ii);
    capillaryRisePA_mm(:, :, ii) = capillaryRisePA_raw_mm(:, :, ii);
    capillaryRiseAl_mm(:, :, ii) = applyMask2D(capillaryRiseAl_mm(:, :, ii), techMaskAl);
    capillaryRisePA_mm(:, :, ii) = applyMask2D(capillaryRisePA_mm(:, :, ii), techMaskPoly);
end

% Bundle tube-supply cost orientation. The field is independent of wall
% thickness except for the same technology masks used by the material maps.
[cost_Al_index_raw, ~, ~] = calcTubeSupplyCostIndex(DA_mm, model_outer, params.cost, "Al");
[cost_Poly_index_raw, ~, ~] = calcTubeSupplyCostIndex(DA_mm, model_outer, params.cost, "Poly");
cost_Al_index_raw(Y_calc_mask) = NaN;
cost_Poly_index_raw(Y_calc_mask) = NaN;
cost_Al_index = applyMask2D(cost_Al_index_raw, techMaskAl);
cost_Poly_index = applyMask2D(cost_Poly_index_raw, techMaskPoly);

designBurstTolIdx = find(abs(burstTol_mm - params.design_boundary_wall_tol_mm) < 10.*eps, 1, 'first');
if isempty(designBurstTolIdx)
    error('Design-boundary wall tolerance %.4g mm is not available.', params.design_boundary_wall_tol_mm);
end
designCapillaryAccelIdx = find(abs(params.capillary.accel_over_g - ...
    params.design_boundary_capillary_accel_over_g) < 10.*eps, 1, 'first');
if isempty(designCapillaryAccelIdx)
    error('Design-boundary capillary acceleration %.4g g is not available.', ...
        params.design_boundary_capillary_accel_over_g);
end

screenAl = makeDesignScreenData(params.tmin_Al_mm, k_Al_raw, kA_Al_raw_WK, ...
    pB_Al_tol_bar_raw(:, :, designBurstTolIdx), coolant_Vdot_Lmin_raw, ...
    dp_i_fric_bar_raw, cost_Al_index_raw, ...
    capillaryRiseAl_raw_mm(:, :, designCapillaryAccelIdx));
screenPA = makeDesignScreenData(params.tmin_Poly_mm, k_Poly_raw, kA_Poly_raw_WK, ...
    pB_Poly_tol_bar_raw(:, :, designBurstTolIdx), coolant_Vdot_Lmin_raw, ...
    dp_i_fric_bar_raw, cost_Poly_index_raw, ...
    capillaryRisePA_raw_mm(:, :, designCapillaryAccelIdx));

[~, designMaskAl] = maskDesignBoundaryKAMap( ...
    screenAl.kA_WK, DA_mm, Y_pct, screenAl.tMin_mm, screenAl.burst_bar, ...
    screenAl.coolant_Lmin, screenAl.dp_bar, screenAl.cost_index, ...
    screenAl.capillary_mm, params);
[~, designMaskPA] = maskDesignBoundaryKAMap( ...
    screenPA.kA_WK, DA_mm, Y_pct, screenPA.tMin_mm, screenPA.burst_bar, ...
    screenPA.coolant_Lmin, screenPA.dp_bar, screenPA.cost_index, ...
    screenPA.capillary_mm, params);

[kAlNearest_Wm2K, kAAlNearest_WK, dAlNearest_mm] = ...
    nearestFeasibleAlReference(DA_mm, Y_pct, designMaskPA, screenAl, params);
ratio_tech_adjusted = k_Poly_raw ./ kAlNearest_Wm2K;
ratio_kA_tech_adjusted = kA_Poly_raw_WK ./ kAAlNearest_WK;
ratio_tech_adjusted(~designMaskPA | ~builtin('isfinite', dAlNearest_mm)) = NaN;
ratio_kA_tech_adjusted(~designMaskPA | ~builtin('isfinite', dAlNearest_mm)) = NaN;

[boundaryYPct, boundaryAlXmm] = compositeFeasibleDiameterBoundary( ...
    DA_mm, Y_pct, screenAl, params);
[~, boundaryPAXmm] = compositeFeasibleDiameterBoundary( ...
    DA_mm, Y_pct, screenPA, params);

printDesignBoundaryDiagnostics(DA_mm, designMaskAl, designMaskPA, ...
    boundaryYPct, boundaryAlXmm, boundaryPAXmm);

fprintf(['All-screen comparison: %d PA points with a nearest feasible Al reference; ' ...
    'd_Al,ref = %.3g-%.3g mm.\n'], ...
    nnz(builtin('isfinite', dAlNearest_mm)), ...
    min(dAlNearest_mm(:), [], 'omitnan'), max(dAlNearest_mm(:), [], 'omitnan'));

compute_Rparts = @(lam) deal( ...
    (da_m ./ (di_m .* alpha_i)), ...
    (da_m ./ (2 .* lam)) .* log(da_m ./ di_m), ...
    (1 ./ alpha_a) );

[Ri_Al_raw, Rw_Al_raw, Ro_Al_raw] = compute_Rparts(mat.Al.lambda_WmK);
Ri_Al_raw(invalid)      = NaN;  Rw_Al_raw(invalid)      = NaN;  Ro_Al_raw(invalid)      = NaN;
Ri_Al_raw(Y_calc_mask)  = NaN;  Rw_Al_raw(Y_calc_mask)  = NaN;  Ro_Al_raw(Y_calc_mask)  = NaN;
Ri_Al_plot = Ri_Al_raw;  Rw_Al_plot = Rw_Al_raw;  Ro_Al_plot = Ro_Al_raw;
Ri_Al_plot(techMaskAl) = NaN;
Rw_Al_plot(techMaskAl) = NaN;
Ro_Al_plot(techMaskAl) = NaN;

[Ri_Poly_raw, Rw_Poly_raw, Ro_Poly_raw] = compute_Rparts(mat.Poly.lambda_WmK);
Ri_Poly_raw(invalid)      = NaN;  Rw_Poly_raw(invalid)      = NaN;  Ro_Poly_raw(invalid)      = NaN;
Ri_Poly_raw(Y_calc_mask)  = NaN;  Rw_Poly_raw(Y_calc_mask)  = NaN;  Ro_Poly_raw(Y_calc_mask)  = NaN;
Ri_Poly_plot = Ri_Poly_raw;  Rw_Poly_plot = Rw_Poly_raw;  Ro_Poly_plot = Ro_Poly_raw;
Ri_Poly_plot(techMaskPoly) = NaN;
Rw_Poly_plot(techMaskPoly) = NaN;
Ro_Poly_plot(techMaskPoly) = NaN;

ratio_same_geometry = k_Poly_raw ./ k_Al_raw;
ratio_same_geometry(T_mm < max(params.tmin_Al_mm, params.tmin_Poly_mm)) = NaN;


%% ============================================================
%  Plotting — each panel as an individual figure
% ============================================================

% ---- shared k_o color limits (Al + Poly, same scale) --------------------
[k_lo, k_hi] = robustLogLimits(params, k_Al_plot, k_Poly_plot);
kLogLimits   = [log10(k_lo) log10(k_hi)];
kLevels = makeFixedContourLevels(params.ko_contour_step_Wm2K, k_Al_plot, k_Poly_plot);

% ---- shared bundle-scale k_o*A_o color limits (Al + Poly, same scale) ---
[kA_lo, kA_hi] = robustLogLimits(params, kA_Al_plot_WK, kA_Poly_plot_WK);
kALogLimits = [log10(kA_lo) log10(kA_hi)];
kALevels = params.kA_abs_contour_levels_WK;

% ---- shared burst-pressure color limits ---------------------------------
[p_lo, p_hi] = robustLogLimits(params, pB_Al_bar, pB_Poly_bar);
pLogLimits   = [log10(p_lo) log10(p_hi)];
pLevelsAl    = makeBurstPressureContourLevels(pB_Al_bar,   params.burst_contour_step_Al_bar);
pLevelsPoly  = makeBurstPressureContourLevels(pB_Poly_bar, params.burst_contour_step_Poly_bar);
[pGrid_lo, pGrid_hi] = robustLogLimits(params, pB_Al_tol_bar, pB_Poly_tol_bar);
pGridLogLimits = [log10(pGrid_lo) log10(pGrid_hi)];

% 01a  k_o — Aluminum  (contourZ = same data as fill, per-material levels)
plotSingleLogMap(DA_mm, Y_pct, k_Al_plot, k_Al_plot, ...
    'ko aluminum', kLogLimits, kLevels, "Al", ...
    '{\it k}_{\rm{o}} [W/(m^2 K)]', params, "plain");

% 01b  k_o — Polymer
plotSingleLogMap(DA_mm, Y_pct, k_Poly_plot, k_Poly_plot, ...
    'ko polymer', kLogLimits, kLevels, "Poly", ...
    '{\it k}_{\rm{o}} [W/(m^2 K)]', params, "plain");

% 01c  Bundle-scale k_o*A_o — Aluminum
plotSingleLogMap(DA_mm, Y_pct, kA_Al_plot_WK, kA_Al_plot_WK, ...
    'bundle kA aluminum', kALogLimits, kALevels, "Al", ...
    'Conductance, {\it k}_{\rm{o}}{\it A}_{\rm{o}} [W K^{-1}]', params, "plain");

% 01d  Bundle-scale k_o*A_o — Polymer
plotSingleLogMap(DA_mm, Y_pct, kA_Poly_plot_WK, kA_Poly_plot_WK, ...
    'bundle kA polymer', kALogLimits, kALevels, "Poly", ...
    'Conductance, {\it k}_{\rm{o}}{\it A}_{\rm{o}} [W K^{-1}]', params, "plain");

% 01e  Bundle-scale k_o*A_o — Aluminum/PA shared-colorbar paper figure
plotBundleKAGridAlPa(DA_mm, Y_pct, kA_Al_plot_WK, kA_Poly_plot_WK, ...
    kALogLimits, kALevels, params);

% 02a  Burst pressure — Aluminum
plotSingleLogMap(DA_mm, Y_pct, pB_Al_bar, pB_Al_bar, ...
    'burst aluminum', pLogLimits, pLevelsAl, "Al", ...
    'Tolerance-adjusted burst pressure, {\it p}_{\rm{b,tol}} [bar]', params, "bar");

% 02b  Burst pressure — Polymer
plotSingleLogMap(DA_mm, Y_pct, pB_Poly_bar, pB_Poly_bar, ...
    'burst polymer', pLogLimits, pLevelsPoly, "Poly", ...
    'Tolerance-adjusted burst pressure, {\it p}_{\rm{b,tol}} [bar]', params, "bar");

% 02c  Burst-pressure tolerance grid — columns = Al/PA, rows = production tolerance
if ~strcmpi(getenv('WAERME_SKIP_BURST_GRID'), '1')
    plotBurstToleranceGridAlPa(DA_mm, Y_pct, pB_Al_tol_bar, pB_Poly_tol_bar, ...
        burstTol_mm, pGridLogLimits, params);
end

% 03a  Tube-side Reynolds number — diagnostic design-space map.
%      The field itself is material-independent; technology lines provide the
%      aluminum and PA design-space context.
plotSingleLogMap(DA_mm, Y_pct, Re_i_plot, Re_i_plot, ...
    'tube side reynolds', [log10(10) log10(5000)], params.re_i_contour_levels, "both", ...
    '{\rm{Re}}_{\rm{i}} [-]', params, "reynolds");

% 03b  Tube-side friction pressure drop — diagnostic map.
%      This is a straight-tube friction screen at fixed tube-side velocity.
%      The colored area is clipped by the PA minimum-wall limit.
%      It is not a full heat-exchanger pressure-drop model.
plotSingleLogMap(DA_mm, Y_pct, dp_i_fric_bar_plot, dp_i_fric_bar_plot, ...
    'tube side friction pressure drop', log10(params.dp_i_log_caxis_bar), ...
    params.dp_i_contour_levels_bar, "both", ...
    'Friction pressure drop, \Delta {\it p}_{\rm{i}} [bar]', params, "pressureDrop");

% 03c  Coolant throughput — fixed tube-side velocity and benchmark-scaled tube count.
%      Reports the model-implied total bundle coolant volume flow in L/min.
%      The colored area is clipped by the PA minimum-wall limit.
%      This is not the measured benchmark flow.
plotMapLinearIso(DA_mm, Y_pct, coolant_Vdot_Lmin_plot, ...
    'coolant throughput Lmin', ...
    'Coolant throughput, {\it V}_{\rm{c,tot}} [L min^{-1}]', ...
    params.coolant_flow_Lmin_caxis, ...
    params.coolant_flow_Lmin_contour_levels, ...
    params, "both");

% 03d  Air-side Reynolds number, simple inlet/d_o convention.
%      This is the convention closest to the MA-style inlet Reynolds maps.
plotSingleLogMap(DA_mm, Y_pct, Re_o_simple_plot, Re_o_simple_plot, ...
    'air reynolds simple', [log10(10) log10(5000)], params.re_o_contour_levels, "both", ...
    '{\rm{Re}}_{\rm{a,d}} [-]', params, "reynolds");

% 03e  Air-side Reynolds number, VDI G7 tube-bank convention.
%      VDI G7 uses the reference length l=pi*d_o/2 and the void factor c.
plotSingleLogMap(DA_mm, Y_pct, Re_o_vdi_plot, Re_o_vdi_plot, ...
    'air reynolds vdi g7', [log10(20) log10(10000)], params.re_o_contour_levels, "both", ...
    '{\rm{Re}}_{\rm{c,l}} [-]', params, "reynolds");

% 03f  Tube-to-tube clear spacing for constant longitudinal pitch ratio.
%      With b=S_L/d_o=2.00, the longitudinal clear spacing is s_L=(b-1)d_o.
plotSingleLogMap(DA_mm, Y_pct, clearSpacingLong_mm, clearSpacingLong_mm, ...
    'tube spacing longitudinal', [log10(0.1) log10(10)], params.spacing_contour_levels_mm, "both", ...
    '{\it s}_{\rm{L}} [mm]', params, "mm");

% 03g  Tube-to-tube clear spacing for constant transverse pitch ratio.
%      With a=S_T/d_o=3.28, the transverse clear spacing is s_T=(a-1)d_o.
plotSingleLogMap(DA_mm, Y_pct, clearSpacingTrans_mm, clearSpacingTrans_mm, ...
    'tube spacing transverse', [log10(0.1) log10(30)], [0.2 0.5 1 2 5 10 20], "both", ...
    '{\it s}_{\rm{T}} [mm]', params, "mm");

% 03h  Geometrically closest clear spacing for an inline tube bank.
plotSingleLogMap(DA_mm, Y_pct, clearSpacingClosestInline_mm, clearSpacingClosestInline_mm, ...
    'tube spacing closest inline', [log10(0.1) log10(10)], params.spacing_contour_levels_mm, "both", ...
    '{\it s}_{\rm{min,inline}} [mm]', params, "mm");

% 03i  Geometrically closest clear spacing for a staggered tube bank.
plotSingleLogMap(DA_mm, Y_pct, clearSpacingClosestStaggered_mm, clearSpacingClosestStaggered_mm, ...
    'tube spacing closest staggered', [log10(0.1) log10(20)], [0.2 0.5 1 2 5 10 20], "both", ...
    '{\it s}_{\rm{min,stag}} [mm]', params, "mm");

% 03a-c single resistance-share maps are not used by the current LaTeX paper.
% The paper uses the combined landscape figure generated below instead.
RtotAl = Ri_Al_plot + Rw_Al_plot + Ro_Al_plot;
RtotAl(RtotAl <= 0) = NaN;
RtotPoly = Ri_Poly_plot + Rw_Poly_plot + Ro_Poly_plot;
RtotPoly(RtotPoly <= 0) = NaN;
% plotSingleShareMap(DA_mm, Y_pct, 100.*Ri_Poly_plot./Rtot, ...
%     'share Ri', '\phi_{\rm{i}} = {\it R}_{\rm{i}}/{\it R}_{\rm{tot}} [%]', params);
% plotSingleShareMap(DA_mm, Y_pct, 100.*Rw_Poly_plot./Rtot, ...
%     'share Rw', '\phi_{\rm{w}} = {\it R}_{\rm{w}}/{\it R}_{\rm{tot}} [%]', params);
% plotSingleShareMap(DA_mm, Y_pct, 100.*Ro_Poly_plot./Rtot, ...
%     'share Ro', '\phi_{\rm{o}} = {\it R}_{\rm{o}}/{\it R}_{\rm{tot}} [%]', params);

% 04  Same-geometry change — not used by the current LaTeX paper
% plotMapPercentIso(DA_mm, Y_pct, 100.*(ratio_same_geometry - 1), ...
%     'same geometry change', ...
%     'same-geometry relative change [%]', params);

% 05  All-screen-adjusted local-coefficient change (diagnostic export).
params_feasible_delta = params;
params_feasible_delta.mark_tech_in_ratio = false;
params_feasible_delta.composite_boundary = struct( ...
    'y_pct', boundaryYPct, ...
    'x_al_mm', boundaryAlXmm, ...
    'x_pa_mm', boundaryPAXmm);
plotMapPercentIso(DA_mm, Y_pct, 100.*(ratio_tech_adjusted - 1), ...
    'tech adjusted change', ...
    'Feasible coefficient difference, \Delta{\it k}_{\rm{o}} [%]', params_feasible_delta);

% 05b  All-screen-adjusted bundle-scale conductance change.
%      Each feasible PA point is compared at the same wall-thickness ratio
%      with the nearest feasible aluminum diameter at or to its right.
kA_delta_pct = 100.*(ratio_kA_tech_adjusted - 1);
params_kA_delta = params_feasible_delta;
finiteDelta = kA_delta_pct(builtin('isfinite', kA_delta_pct));
if isempty(finiteDelta)
    error('No all-screen PA-to-Al conductance comparisons are available.');
end
params_kA_delta.ratio_pct_caxis_2d = [-50 200];
params_kA_delta.ratio_pct_tick_step = 50;
params_kA_delta.ratio_pct_contour_levels = [-25 0 25 50 100 150];
params_kA_delta.ratio_pct_label_levels = params_kA_delta.ratio_pct_contour_levels;
params_kA_delta.ratio_pct_label_target_y_pct = [15.5 12.6 16.2 13.7 11.0 15.5];
params_kA_delta.ratio_pct_label_target_x_norm = [0.70 NaN NaN NaN NaN NaN];
params_kA_delta.ratio_pct_callout_levels = [100 150];
params_kA_delta.ratio_pct_callout_positions = [0.14 0.385; 0.13 0.235];
params_kA_delta.ratio_pct_ticks = -50:50:200;
params_kA_delta.ratio_pct_contour_line_width = 1.0;
params_kA_delta.font_size = params.design_boundary_font_size;
params_kA_delta.single_panel_figure_size_cm = [19.0 17.90];
params_kA_delta.single_panel_axes_cm = [3.00 2.80 13.70 10.60];
params_kA_delta.single_panel_colorbar_cm = [3.00 15.25 13.70 0.34];
params_kA_delta.ratio_pct_colorbar_location = "top";
params_kA_delta.ratio_pct_colorbar_reverse = true;
params_kA_delta.ratio_pct_colorbar_label_position = "top";
params_kA_delta.ratio_pct_colorbar_label_y_cm = 17.15;
params_kA_delta.ratio_pct_colorbar_label_font_size = params_kA_delta.font_size;
params_kA_delta.ratio_pct_brace_y_cm = 15.09;
params_kA_delta.ratio_pct_brace_height_cm = 0.23;
params_kA_delta.ratio_pct_brace_label_font_size = params_kA_delta.font_size;
params_kA_delta.ratio_pct_positive_label = "PA superiority";
params_kA_delta.ratio_pct_negative_label = "Al superiority";
params_kA_delta.cross_section_reference_axes_cm = ...
    params_kA_delta.single_panel_axes_cm(3:4);
params_kA_delta.show_validated_ref_in_percent_map = true;
plotMapPercentIso(DA_mm, Y_pct, kA_delta_pct, ...
    'tech adjusted kA change', ...
    '\Delta({\it k}_{\rm{o}}{\it A}_{\rm{o}})_{\rm{feas}}', params_kA_delta);

% 06a-b  Tube-supply cost orientation over the same 2D design space.
%        The maps use the paper benchmark footprint and fixed relative
%        pitch ratios. Cost varies with tube count/length and is plotted
%        against wall ratio only to show the feasible material regions.
plotSingleLogMap(DA_mm, Y_pct, cost_Al_index, cost_Al_index, ...
    'tube supply cost aluminum', log10(params.cost_log_caxis), params.cost_contour_levels, "Al", ...
    '{\it C}_{\rm{tube}}/{\it C}_{\rm{fin}} [-]', params, "cost");

plotSingleLogMap(DA_mm, Y_pct, cost_Poly_index, cost_Poly_index, ...
    'tube supply cost polymer', log10(params.cost_log_caxis), params.cost_contour_levels, "Poly", ...
    '{\it C}_{\rm{tube}}/{\it C}_{\rm{fin}} [-]', params, "cost");

% 06  k_o slices — not used by the current LaTeX paper
k_Al_3d   = k_Al_raw;    k_Al_3d(techMaskAl)     = NaN;
k_Poly_3d = k_Poly_raw;  k_Poly_3d(techMaskPoly) = NaN;
% plotSlices2D_from3D(DA_mm, Y_pct, T_mm, k_Al_3d, k_Poly_3d, params);

% 07  3D diagnostic — not used by the current LaTeX paper
% if params.make_3d_plot
%     ratio_3d = k_Poly_raw ./ k_Al_raw;
%     ratio_3d(T_mm < max(params.tmin_Al_mm, params.tmin_Poly_mm)) = NaN;
%     plot3D_AlRatio_PolyBlack(DA_mm, Y_pct, k_Al_3d, k_Poly_3d, ratio_3d, params);
% end

% 08  Resistance-share map (portrait, shared colorscale)
if ~strcmpi(getenv('WAERME_SKIP_SHARE_GRID'), '1')
    plotShareGridAlPa(DA_mm, Y_pct, ...
        100.*Ri_Al_plot./RtotAl, ...
        100.*Rw_Al_plot./RtotAl, ...
        100.*Ro_Al_plot./RtotAl, ...
        100.*Ri_Poly_plot./RtotPoly, ...
        100.*Rw_Poly_plot./RtotPoly, ...
        100.*Ro_Poly_plot./RtotPoly, params);
end

% 09  Capillary-rise process map.
%     Rows show the effective acceleration opposing the potting rise; columns
%     compare the literature-estimated aluminum wetting case with the measured
%     PA wetting transfer from the Plexiglas wedge scan.
if ~strcmpi(getenv('WAERME_SKIP_CAPILLARY_GRID'), '1')
    plotCapillaryRiseGridAlPa(DA_mm, Y_pct, capillaryRiseAl_mm, capillaryRisePA_mm, params);
end

% 10  Compact boundary summary for aluminum and PA design-space orientation.
if ~strcmpi(getenv('WAERME_SKIP_DESIGN_BOUNDARY'), '1')
    plotDesignBoundaryLinesAlPa(DA_mm, Y_pct, ...
        kA_Al_raw_WK, kA_Poly_raw_WK, ...
        pB_Al_tol_bar_raw(:, :, designBurstTolIdx), pB_Poly_tol_bar_raw(:, :, designBurstTolIdx), ...
        coolant_Vdot_Lmin_raw, dp_i_fric_bar_raw, ...
        cost_Al_index_raw, cost_Poly_index_raw, ...
        capillaryRiseAl_raw_mm(:, :, designCapillaryAccelIdx), ...
        capillaryRisePA_raw_mm(:, :, designCapillaryAccelIdx), ...
        log10(params.design_boundary_kA_caxis_WK), params);
end

exportGeneratedFigures(params);


%% ============================================================
%  Helper: individual single-panel log-color map (V8 new)
% ============================================================
function plotSingleLogMap(X_mm, Y_lin, Z, contourZ, figName, logLimits, contourLevels, techLine, cbLabel, params, labelMode)
if nargin < 11 || isempty(labelMode), labelMode = "plain"; end

fig = createPptFigure(params, figName, params.single_panel_figure_size_cm);
ax  = axes('Parent', fig);
box(ax, 'on');
hold(ax, 'on');
panelTitle = getSinglePanelTitle(figName);

Zc   = double(Z);
Zc(~builtin('isfinite', Zc) | Zc <= 0) = NaN;
Zlog = log10(Zc);
drawVectorFilledMap(ax, X_mm, Y_lin, Zlog, params);

set(ax, 'XScale', 'log', 'YScale', 'linear');
xlabel(ax, 'Outer diameter, {\it d}_{\rm{o}} [mm]', 'Interpreter', 'tex');
ylabel(ax, 'Wall-thickness ratio, \tau = {\it t}/{\it d}_{\rm{o}} [%]', 'Interpreter', 'tex');
% no title in V8

caxis(ax, logLimits);
applyProjectColormap(fig, params);
if any(lower(string(labelMode)) == ["cost", "pressuredrop"])
    colormap(fig, flipud(getProjectColormap(params)));
end
xlim(ax, params.x_mm_lim);
ylim(ax, params.y_pct_lim);

plotTechLimitLines(params, techLine, false, ax);
shouldPlotRef = any(lower(string(techLine)) == ["al", "both"]);
if shouldPlotRef
    plotValidatedCoolerReferencePoint(ax, params);
end
plotCrossSectionSketches(ax, params);

Cv = double(contourZ);
Cv(~builtin('isfinite', Cv) | Cv <= 0) = NaN;
C = [];
hc = gobjects(0);
if ~isempty(contourLevels)
    pv = Cv(builtin('isfinite', Cv));
    if ~isempty(pv)
        lvl = contourLevels(contourLevels > min(pv) & contourLevels < max(pv));
        if numel(lvl) >= 1
            if isscalar(lvl), lvl = [lvl lvl]; end
            [C, hc] = contour(ax, X_mm, Y_lin, Cv, lvl, ...
                'Color', [0.12 0.12 0.12], 'LineWidth', 0.75);
            labelLvl = [];
            labelModeLower = lower(string(labelMode));
            if labelModeLower == "bar"
                labelLvl = selectBarContourLabels(lvl);
            elseif labelModeLower == "pressuredrop"
                labelLvl = unique(double(lvl(:).'));
            elseif labelModeLower == "plain"
                labelLvl = selectSingleMapContourLabels(lvl);
            elseif labelModeLower == "cost"
                labelLvl = selectCostContourLabels(lvl);
            elseif any(labelModeLower == ["reynolds", "mm"])
                labelLvl = unique(double(lvl(:).'));
            end
            cl = addContourLabelsAlongLines(ax, C, hc, labelLvl, ...
                params, params.font_size - 2, params.contour_label_spacing, labelMode);
            formatContourLabels(cl, labelMode);
        end
    end
end
manualSpecs = manualContourLabelSpecs(figName, panelTitle);
if ~isempty(C) && ~isempty(manualSpecs)
    addManualContourLabels(ax, C, hc, manualSpecs, params, ...
        params.font_size - 2, labelMode, "TechLimitLine");
end

if lower(string(labelMode)) == "reynolds"
    plotReTransitionContour(ax, X_mm, Y_lin, Cv, params);
end

grid(ax, 'on');
styleAxes(ax, params);
xlim(ax, params.x_mm_lim);
ylim(ax, params.y_pct_lim);
finishMapLayering(ax);
if strlength(panelTitle) > 0
    addPanelTitle(ax, char(panelTitle), params, 'normal');
end

% Explicit axes + colorbar layout (identical for all map panels)
drawnow;
set(ax, 'Units', 'centimeters', 'Position', params.single_panel_axes_cm);
cb = colorbar(ax);
drawnow;
set(ax, 'Units', 'centimeters', 'Position', params.single_panel_axes_cm);
set(cb, 'Units', 'centimeters', 'Position', params.single_panel_colorbar_cm);

[z_lo, z_hi] = deal(10^logLimits(1), 10^logLimits(2));
styleLogColorbar(cb, z_lo, z_hi, cbLabel, params);
applyPresentationStyle(fig, params);
if strlength(panelTitle) > 0
    addPanelTitle(ax, char(panelTitle), params, 'normal');
end

end


function panelTitle = getSinglePanelTitle(figName)
switch lower(string(figName))
    case "bundle ka aluminum"
        panelTitle = "Aluminum";
    case "bundle ka polymer"
        panelTitle = "PA";
    otherwise
        panelTitle = "";
end
end


%% ============================================================
%  Helper: two-panel bundle-conductance map (Al/PA, shared colorscale)
% ============================================================
function plotBundleKAGridAlPa(X_mm, Y_lin, kA_Al_WK, kA_Poly_WK, ...
    kALogLimits, contourLevels, params)

params.font_size = params.bundle_kA_font_size;
params.axis_line_width = params.grid_axis_line_width;

fig = createPptFigure(params, 'bundle kA alu pa portrait', ...
    params.bundle_kA_figure_size_cm);
applyProjectColormap(fig, params);

axPos = params.bundle_kA_axes_cm;
axH = gobjects(1, 2);
materials = ["Aluminum", "PA"];
techLines = ["Al", "Poly"];
kAData = {kA_Al_WK, kA_Poly_WK};
logLimits = double(kALogLimits(:).');
fillLevels = linspace(logLimits(1), logLimits(2), params.vector_fill_levels);

for jj = 1:2
    ax = axes('Parent', fig);
    axH(jj) = ax;
    box(ax, 'on');
    hold(ax, 'on');

    Zc = double(kAData{jj});
    Zc(~builtin('isfinite', Zc) | Zc <= 0) = NaN;
    Zlog = log10(Zc);
    finiteZ = builtin('isfinite', Zlog);
    Zlog(finiteZ) = min(max(Zlog(finiteZ), logLimits(1)), logLimits(2));
    drawVectorFilledMap(ax, X_mm, Y_lin, Zlog, params, fillLevels);
    caxis(ax, logLimits);

    set(ax, 'XScale', 'log', 'YScale', 'linear');
    set(ax, 'XTick', [0.1 1 10], 'XTickLabel', {'0.1', '1', '10'}, ...
        'YTick', params.bundle_kA_y_ticks_pct);
    if jj == 1
        set(ax, 'XTickLabel', {});
    end
    grid(ax, 'on');
    styleAxes(ax, params);
    xlim(ax, params.x_mm_lim);
    ylim(ax, params.y_pct_lim);
    set(ax, 'Units', 'centimeters', 'Position', axPos(jj, :));

    plotTechLimitLines(params, techLines(jj), false, ax);
    if materials(jj) == "Aluminum"
        plotValidatedCoolerReferencePoint(ax, params);
    end
    paramsSketch = params;
    paramsSketch.cross_section_reference_axes_cm = axPos(jj, 3:4);
    plotCrossSectionSketches(ax, paramsSketch);

    Cv = Zc;
    C = [];
    hc = gobjects(0);
    if ~isempty(contourLevels)
        pv = Cv(builtin('isfinite', Cv));
        if ~isempty(pv)
            lvl = contourLevels(contourLevels > min(pv) & contourLevels < max(pv));
            if numel(lvl) >= 1
                if isscalar(lvl), lvl = [lvl lvl]; end
                [C, hc] = contour(ax, X_mm, Y_lin, Cv, lvl, ...
                    'Color', [0.12 0.12 0.12], 'LineWidth', 0.75);
                labelLvl = selectSingleMapContourLabels(lvl);
                cl = addContourLabelsAlongLines(ax, C, hc, labelLvl, ...
                    params, params.font_size - 2, params.contour_label_spacing, "plain");
                formatContourLabels(cl, "plain");
            end
        end
    end
    manualSpecs = manualContourLabelSpecs("bundle kA alu pa portrait", materials(jj));
    if ~isempty(C) && ~isempty(manualSpecs)
        addManualContourLabels(ax, C, hc, manualSpecs, params, ...
            params.font_size - 2, "plain", "TechLimitLine");
    end

    finishMapLayering(ax);
    addPanelTitle(ax, char(materials(jj)), params, 'normal');
end

drawnow;
set(axH(1), 'Units', 'centimeters', 'Position', axPos(1, :));
cb = colorbar(axH(1), 'northoutside');
drawnow;
set(axH(1), 'Units', 'centimeters', 'Position', axPos(1, :));
set(cb, 'Units', 'centimeters', ...
    'Position', params.bundle_kA_colorbar_cm, ...
    'Orientation', 'horizontal');
[z_lo, z_hi] = deal(10^logLimits(1), 10^logLimits(2));
styleLogColorbar(cb, z_lo, z_hi, ...
    'Conductance, {\it k}_{\rm{o}}{\it A}_{\rm{o}} [W K^{-1}]', params);
setLogColorbarTicksFromLevels(cb, params.bundle_kA_colorbar_ticks_WK, z_lo, z_hi);
reverseColorbarScale(cb);
cb.TickLabels = repmat({''}, size(cb.Ticks));
cb.Label.String = '';

figSizeCm = params.bundle_kA_figure_size_cm;
panelCenterX = axPos(2, 1) + 0.5 .* axPos(2, 3);
panelCenterY = 0.5 .* (axPos(2, 2) + axPos(1, 2) + axPos(1, 4));
labelAx = axes('Parent', fig, 'Units', 'centimeters', ...
    'Position', [0 0 figSizeCm], ...
    'Visible', 'off', 'XLim', [0 figSizeCm(1)], 'YLim', [0 figSizeCm(2)]);
drawBundleKATopColorbarTickLabels(labelAx, params.bundle_kA_colorbar_cm, ...
    params.bundle_kA_colorbar_ticks_WK, logLimits, params);
text(labelAx, panelCenterX, params.bundle_kA_colorbar_cm(2) + 1.70, ...
    'Conductance, {\it k}_{\rm{o}}{\it A}_{\rm{o}} [W K^{-1}]', ...
    'HorizontalAlignment', 'center', 'VerticalAlignment', 'middle', ...
    'FontName', params.font_name, 'FontSize', params.font_size, ...
    'Interpreter', 'tex');
text(labelAx, panelCenterX, axPos(2, 2) - 1.20, ...
    'Outer diameter, {\it d}_{\rm{o}} [mm]', ...
    'HorizontalAlignment', 'center', 'VerticalAlignment', 'middle', ...
    'FontName', params.font_name, 'FontSize', params.font_size, ...
    'Interpreter', 'tex');
text(labelAx, axPos(1, 1) - 1.35, panelCenterY, ...
    'Wall-thickness ratio, \tau = {\it t}/{\it d}_{\rm{o}} [%]', ...
    'HorizontalAlignment', 'center', 'VerticalAlignment', 'middle', ...
    'Rotation', 90, 'FontName', params.font_name, 'FontSize', params.font_size, ...
    'Interpreter', 'tex');

applyPresentationStyle(fig, params);
drawnow;
for jj = 1:2
    set(axH(jj), 'XTick', [0.1 1 10], 'XTickLabel', {'0.1', '1', '10'}, ...
        'YTick', params.bundle_kA_y_ticks_pct);
    if jj == 1
        set(axH(jj), 'XTickLabel', {});
    end
    finishMapLayering(axH(jj));
end
end


function drawBundleKATopColorbarTickLabels(ax, cbPos, tickVals, logLimits, params)
tickVals = unique(double(tickVals(:).'), 'stable');
tickVals = tickVals(builtin('isfinite', tickVals) & tickVals > 0);
labelY = cbPos(2) + cbPos(4) + 0.15;
for ii = 1:numel(tickVals)
    logV = log10(tickVals(ii));
    x = cbPos(1) + cbPos(3) .* ((logLimits(2) - logV) ./ diff(logLimits));
    text(ax, x, labelY, formatPlainNumberLabel(tickVals(ii)), ...
        'HorizontalAlignment', 'center', ...
        'VerticalAlignment', 'bottom', ...
        'FontName', params.font_name, ...
        'FontSize', params.font_size, ...
        'Interpreter', 'tex', ...
        'Clipping', 'off');
end
end


function plotMapLinearIso(X_mm, Y_lin, Z, figName, cbLabel, caxisLimits, contourLevels, params, techLine)
if nargin < 9 || isempty(techLine)
    techLine = "both";
end

fig = createPptFigure(params, figName, params.single_panel_figure_size_cm);
ax  = axes('Parent', fig);
box(ax, 'on');
hold(ax, 'on');

Zc = double(Z);
Zc(~builtin('isfinite', Zc)) = NaN;

drawVectorFilledMap(ax, X_mm, Y_lin, Zc, params);

set(ax, 'XScale', 'log', 'YScale', 'linear');
xlabel(ax, 'Outer diameter, {\it d}_{\rm{o}} [mm]', 'Interpreter', 'tex');
ylabel(ax, 'Wall-thickness ratio, \tau = {\it t}/{\it d}_{\rm{o}} [%]', 'Interpreter', 'tex');

applyProjectColormap(fig, params);
caxis(ax, caxisLimits);
xlim(ax, params.x_mm_lim);
ylim(ax, params.y_pct_lim);

drawnow;
set(ax, 'Units', 'centimeters', 'Position', params.single_panel_axes_cm);
cb = colorbar(ax);
drawnow;
set(ax, 'Units', 'centimeters', 'Position', params.single_panel_axes_cm);
set(cb, 'Units', 'centimeters', 'Position', params.single_panel_colorbar_cm);

cb.Label.Interpreter = 'tex';
cb.Label.String   = cbLabel;
cb.FontName       = params.font_name;
cb.FontSize       = params.font_size;
cb.Label.FontName = params.font_name;
cb.Label.FontSize = params.font_size;
if lower(string(figName)) == "coolant throughput lmin"
    reverseColorbarScale(cb);
end

zv = Zc(builtin('isfinite', Zc));
lvl = contourLevels;
if ~isempty(zv)
    lvl = lvl(lvl > min(zv) & lvl < max(zv));
end

plotTechLimitLines(params, techLine, false, ax);
shouldPlotRef = any(lower(string(techLine)) == ["al", "both"]);
if shouldPlotRef
    plotValidatedCoolerReferencePoint(ax, params);
end
plotCrossSectionSketches(ax, params);

if ~isempty(lvl)
    if isscalar(lvl), lvl = [lvl lvl]; end
    [C, hc] = contour(ax, X_mm, Y_lin, Zc, lvl, ...
        'Color', [0.12 0.12 0.12], 'LineWidth', 0.75);
    addContourLabelsAlongLines(ax, C, hc, lvl, ...
        params, params.font_size - 3, params.contour_label_spacing, "plain");
end

grid(ax, 'on');
styleAxes(ax, params);
finishMapLayering(ax);
applyPresentationStyle(fig, params);
end


%% ============================================================
%  Helper: portrait 2x2 burst-pressure tolerance map (Al left, PA right)
% ============================================================
function plotBurstToleranceGridAlPa(X_mm, Y_lin, pB_Al_tol_bar, pB_Poly_tol_bar, ...
    tol_mm, logLimits, params)

params.font_size = params.burst_grid_font_size;
params.axis_line_width = params.grid_axis_line_width;
params.tech_line_width = params.grid_tech_line_width;

if numel(tol_mm) ~= 2
    error('plotBurstToleranceGridAlPa expects exactly two tolerance cases.');
end

fig = createPptFigure(params, 'burst tolerance alu pa portrait', params.burst_grid_figure_size_cm);
applyProjectColormap(fig, params);

axPos = params.burst_grid_axes_cm;
axH = gobjects(1, 4);
techLine = ["Al", "Poly"];
contourSteps = [params.burst_contour_step_Al_bar, params.burst_contour_step_Poly_bar];
panelLabel = {
    'Aluminum, standard', 'PA, standard', ...
    'Aluminum, medical',  'PA, medical'};

for rowId = 1:2
    for colId = 1:2
        k = (rowId - 1) .* 2 + colId;
        ax = axes('Parent', fig);
        axH(k) = ax;
        box(ax, 'on'); hold(ax, 'on');

        if colId == 1
            Zraw = double(pB_Al_tol_bar(:, :, rowId));
        else
            Zraw = double(pB_Poly_tol_bar(:, :, rowId));
        end
        Zraw(~builtin('isfinite', Zraw) | Zraw <= 0) = NaN;
        Zlog = log10(Zraw);

        drawVectorFilledMap(ax, X_mm, Y_lin, Zlog, params);
        caxis(ax, logLimits);

        lvl = makeBurstPressureContourLevels(Zraw, contourSteps(colId));
        C = [];
        hc = gobjects(0);
        labelLvl = [];
        if ~isempty(lvl)
            if isscalar(lvl), lvl = [lvl lvl]; end
            [C, hc] = contour(ax, X_mm, Y_lin, Zraw, lvl, ...
                'Color', [0.12 0.12 0.12], 'LineWidth', 0.75);
            labelLvl = selectBarContourLabels(lvl);
            if colId == 1
                preferredGridLabels = [200 800 1600];
            else
                preferredGridLabels = [10 30 50];
            end
            selectedGridLabels = intersect(labelLvl, preferredGridLabels);
            if ~isempty(selectedGridLabels)
                labelLvl = selectedGridLabels;
            end
        end

        plotTechLimitLines(params, techLine(colId), false, ax);

        set(ax, 'XScale', 'log', 'YScale', 'linear');
        set(ax, 'XTick', [0.1 1 10]);
        if rowId < 2
            set(ax, 'XTickLabel', {});
        else
            set(ax, 'XTickLabel', {'0.1', '1', '10'});
        end
        if colId == 2
            set(ax, 'YTickLabel', {});
        end
        grid(ax, 'on');
        styleAxes(ax, params);
        xlim(ax, params.x_mm_lim);
        ylim(ax, params.y_pct_lim);
        set(ax, 'Units', 'centimeters', 'Position', axPos(k, :));

        if lower(string(techLine(colId))) == "al"
            plotValidatedCoolerReferencePoint(ax, params);
        end

        paramsSketch = params;
        paramsSketch.cross_section_reference_axes_cm = axPos(k, 3:4);
        plotCrossSectionSketches(ax, paramsSketch);

        if ~isempty(C)
            if isempty(labelLvl)
                labelLvl = lvl;
            end
            addBurstPressureContourLabels(ax, C, hc, labelLvl, ...
                params, params.font_size - 2);
            addManualContourLabels(ax, C, hc, ...
                manualContourLabelSpecs("burst tolerance alu pa portrait", panelLabel{k}), ...
                params, params.font_size - 2, "bar", "TechLimitLine");
        end
        finishMapLayering(ax);

        addPanelTitle(ax, panelLabel{k}, params, 'normal');
    end
end

drawnow;
set(axH(4), 'Units', 'centimeters', 'Position', axPos(4, :));
cb = colorbar(axH(4), 'northoutside');
drawnow;
set(axH(4), 'Units', 'centimeters', 'Position', axPos(4, :));
set(cb, 'Units', 'centimeters', ...
    'Position', params.burst_grid_colorbar_cm, ...
    'Orientation', 'horizontal');
[z_lo, z_hi] = deal(10^logLimits(1), 10^logLimits(2));
styleLogColorbar(cb, z_lo, z_hi, ...
    'Tolerance-adjusted burst pressure, {\it p}_{\rm{b,tol}} [bar]', params);
cb.TickLabelInterpreter = 'tex';
cb.Label.String = '';

labelAx = axes('Parent', fig, 'Units', 'normalized', 'Position', [0 0 1 1], ...
    'Visible', 'off', 'XLim', [0 1], 'YLim', [0 1]);
text(labelAx, 0.52, 0.955, ...
    'Tolerance-adjusted burst pressure, {\it p}_{\rm{b,tol}} [bar]', ...
    'HorizontalAlignment', 'center', 'VerticalAlignment', 'middle', ...
    'FontName', params.font_name, 'FontSize', params.font_size - 1, ...
    'Interpreter', 'tex');
text(labelAx, 0.52, 0.033, 'Outer diameter, {\it d}_{\rm{o}} [mm]', ...
    'HorizontalAlignment', 'center', 'VerticalAlignment', 'middle', ...
    'FontName', params.font_name, 'FontSize', params.font_size, ...
    'Interpreter', 'tex');
text(labelAx, 0.066, 0.50, 'Wall-thickness ratio, \tau = {\it t}/{\it d}_{\rm{o}} [%]', ...
    'HorizontalAlignment', 'center', 'VerticalAlignment', 'middle', ...
    'Rotation', 90, 'FontName', params.font_name, 'FontSize', params.font_size, ...
    'Interpreter', 'tex');
applyPresentationStyle(fig, params);
drawnow;
for k = 1:4
    rowId = ceil(k / 2);
    set(axH(k), 'XTick', [0.1 1 10]);
    if rowId < 2
        set(axH(k), 'XTickLabel', {});
    else
        set(axH(k), 'XTickLabel', {'0.1', '1', '10'});
    end
    if mod(k, 2) == 0
        set(axH(k), 'YTickLabel', {});
    end
    finishMapLayering(axH(k));
end
end


%% ============================================================
%  Helper: individual single-panel resistance share map (V8 new)
% ============================================================
function plotSingleShareMap(X_mm, Y_lin, sharePct, figName, cbLabel, params)

% Use the shorter figure size so three panels fit on one A4 page
fig = createPptFigure(params, figName, params.share_panel_figure_size_cm);
ax  = axes('Parent', fig);
box(ax, 'on');
hold(ax, 'on');

Zc = double(sharePct);
Zc(~builtin('isfinite', Zc)) = NaN;
drawVectorFilledMap(ax, X_mm, Y_lin, Zc, params, linspace(0, 100, params.vector_fill_levels));

set(ax, 'XScale', 'log', 'YScale', 'linear');
xlabel(ax, 'Outer diameter, {\it d}_{\rm{o}} [mm]', 'Interpreter', 'tex');
ylabel(ax, 'Wall-thickness ratio, \tau = {\it t}/{\it d}_{\rm{o}} [%]', 'Interpreter', 'tex');

caxis(ax, [0 100]);
applyProjectColormap(fig, params);
xlim(ax, params.x_mm_lim);
ylim(ax, params.y_pct_lim);

plotTechLimitLines(params, "Poly", false, ax);
% Correct aspect ratio for cross-section circles in share panel size
paramsSketch = params;
paramsSketch.cross_section_reference_axes_cm = params.share_panel_axes_cm(3:4);
plotCrossSectionSketches(ax, paramsSketch);

% Contours every 1 %, with selected labels aligned to the contour paths
lvl = params.share_contour_levels;
lvl = lvl(lvl > min(Zc(:), [], 'omitnan') & lvl < max(Zc(:), [], 'omitnan'));
if ~isempty(lvl)
    if isscalar(lvl), lvl = [lvl lvl]; end
    [C, hc] = contour(ax, X_mm, Y_lin, Zc, lvl, ...
        'Color', [0.12 0.12 0.12], 'LineWidth', 0.8);
    % Label only every 5th level (5, 10, 15, …) to avoid crowding
    lblLvl = lvl(mod(lvl, 5) == 0);
    if isempty(lblLvl), lblLvl = lvl(1:max(1,round(end/4)):end); end
    if isscalar(lblLvl), lblLvl = [lblLvl lblLvl]; end
    addContourLabelsAlongLines(ax, C, hc, lblLvl, ...
        params, params.font_size - 2, params.contour_label_spacing, "plain");
end

grid(ax, 'on');
styleAxes(ax, params);
xlim(ax, params.x_mm_lim);
ylim(ax, params.y_pct_lim);
finishMapLayering(ax);

drawnow;
set(ax, 'Units', 'centimeters', 'Position', params.share_panel_axes_cm);
cb = colorbar(ax);
drawnow;
set(ax, 'Units', 'centimeters', 'Position', params.share_panel_axes_cm);
set(cb, 'Units', 'centimeters', 'Position', params.share_panel_colorbar_cm);

cb.Label.String   = cbLabel;
cb.Ticks          = [0 10 25 50 75 90 100];
cb.TickLabels     = {'0 %','10 %','25 %','50 %','75 %','90 %','100 %'};
cb.FontName       = params.font_name;
cb.FontSize       = params.font_size;
cb.Label.FontName = params.font_name;
cb.Label.FontSize = params.font_size;
applyPresentationStyle(fig, params);

end


%% ============================================================
%  Helper: percent-change map (updated V8: no title, d_o label)
% ============================================================
function plotMapPercentIso(X_mm, Y_lin, Zpct, figName, cb_label, params)

fig = createPptFigure(params, figName, params.single_panel_figure_size_cm);
ax  = axes('Parent', fig);
box(ax, 'on');
hold(ax, 'on');

Zc = double(Zpct);
Zc(~builtin('isfinite', Zc)) = NaN;
Zc(abs(Zc) < 1e-10) = 0;
drawVectorFilledMap(ax, X_mm, Y_lin, Zc, params);

set(ax, 'XScale', 'log', 'YScale', 'linear');
xlabel(ax, 'Outer diameter, {\it d}_{\rm{o}} [mm]', 'Interpreter', 'tex');
ylabel(ax, 'Wall-thickness ratio, \tau = {\it t}/{\it d}_{\rm{o}} [%]', 'Interpreter', 'tex');
% no title in V8

applyProjectColormap(fig, params);
caxis(ax, params.ratio_pct_caxis_2d);
xlim(ax, params.x_mm_lim);
ylim(ax, params.y_pct_lim);

% Colorbar
useTopColorbar = isfield(params, 'ratio_pct_colorbar_location') && ...
    lower(string(params.ratio_pct_colorbar_location)) == "top";
drawnow;
set(ax, 'Units', 'centimeters', 'Position', params.single_panel_axes_cm);
cb = colorbar(ax);
drawnow;
set(ax, 'Units', 'centimeters', 'Position', params.single_panel_axes_cm);
if useTopColorbar
    set(cb, 'Orientation', 'horizontal');
end
set(cb, 'Units', 'centimeters', 'Position', params.single_panel_colorbar_cm);

cb.Label.String   = cb_label;
cb.FontName       = params.font_name;
cb.FontSize       = params.font_size;
cb.Label.FontName = params.font_name;
cb.Label.FontSize = params.font_size;
cb.Label.Interpreter = 'tex';

if isfield(params, 'ratio_pct_ticks') && ~isempty(params.ratio_pct_ticks)
    ticks = params.ratio_pct_ticks;
else
    tickStep = params.ratio_pct_tick_step;
    ticks    = params.ratio_pct_caxis_2d(1):tickStep:params.ratio_pct_caxis_2d(2);
    ticks    = unique(sort([ticks -10 0]));
end
tickTol = 1e-9 .* max(1, abs(params.ratio_pct_caxis_2d(2)));
ticks    = ticks(ticks >= params.ratio_pct_caxis_2d(1) - tickTol & ...
                 ticks <= params.ratio_pct_caxis_2d(2) + tickTol);
ticks(abs(ticks) < 1e-10) = 0;
ticks    = unique(ticks);
cb.Ticks = ticks;
tickLabels = strings(size(ticks));
for ii = 1:numel(ticks)
    if   ticks(ii) > 0, tickLabels(ii) = sprintf('+%.0f %%', ticks(ii));
    elseif ticks(ii) < 0, tickLabels(ii) = sprintf('%.0f %%',  ticks(ii));
    else,                  tickLabels(ii) = "0 %";
    end
end
cb.TickLabels = cellstr(tickLabels);
cb.TickLabelInterpreter = 'tex';
if useTopColorbar && isfield(params, 'ratio_pct_colorbar_reverse') && ...
        params.ratio_pct_colorbar_reverse
    reverseColorbarScale(cb);
end
if useTopColorbar
    cb.Label.String = '';
end

hasCompositeBoundary = isfield(params, 'composite_boundary') && ...
    ~isempty(params.composite_boundary);
if hasCompositeBoundary
    plotCompositeFeasibleBoundaries(ax, params.composite_boundary, params);
end
if ~hasCompositeBoundary && isfield(params,'mark_tech_in_ratio') && params.mark_tech_in_ratio
    plotTechLimitLines(params, "both", false, ax);
end
plotCrossSectionSketches(ax, params);
if isfield(params, 'show_validated_ref_in_percent_map') && ...
        params.show_validated_ref_in_percent_map
    plotValidatedCoolerReferencePoint(ax, params);
end

% Contours
zv = Zc(builtin('isfinite', Zc));
if ~isempty(zv)
    if isfield(params, 'ratio_pct_contour_levels') && ...
            ~isempty(params.ratio_pct_contour_levels)
        allLvl = unique(double(params.ratio_pct_contour_levels(:).'));
        allLvl = allLvl(allLvl > min(zv) & allLvl < max(zv) & ...
            allLvl >= params.ratio_pct_caxis_2d(1) & ...
            allLvl <= params.ratio_pct_caxis_2d(2));
    else
        step = params.ratio_pct_contour_step;
        lo   = ceil(max(min(zv),  params.ratio_pct_caxis_2d(1)) / step) * step;
        hi   = floor(min(max(zv), params.ratio_pct_caxis_2d(2)) / step) * step;
        if hi >= lo
            allLvl = lo:step:hi;
        else
            allLvl = [];
        end
    end
    if ~isempty(allLvl)
        allLvl(abs(allLvl) < 1e-10) = 0;
        allLvl = round(allLvl);
        contourLvl = allLvl;
        if isscalar(contourLvl), contourLvl = [contourLvl contourLvl]; end
        contourLineWidth = 0.6;
        if isfield(params, 'ratio_pct_contour_line_width') && ...
                ~isempty(params.ratio_pct_contour_line_width)
            contourLineWidth = params.ratio_pct_contour_line_width;
        end
        [C2, hc2] = contour(ax, X_mm, Y_lin, Zc, contourLvl, ...
            'Color', [0.12 0.12 0.12], 'LineWidth', contourLineWidth);
        if isfield(params, 'ratio_pct_label_levels') && ~isempty(params.ratio_pct_label_levels)
            lblLvl = intersect(allLvl, params.ratio_pct_label_levels);
        else
            lblLvl = allLvl(mod(abs(allLvl), params.ratio_pct_labeled_step) == 0);
        end
        if isempty(lblLvl), lblLvl = allLvl; end
        if isscalar(lblLvl), lblLvl = [lblLvl lblLvl]; end
        protectedTag = "";
        hasExplicitContourLevels = isfield(params, 'ratio_pct_contour_levels') && ...
            ~isempty(params.ratio_pct_contour_levels);
        requiredLabelLevels = lblLvl;
        calloutLevels = [];
        if hasExplicitContourLevels && ...
                isfield(params, 'ratio_pct_callout_levels') && ...
                ~isempty(params.ratio_pct_callout_levels)
            calloutLevels = intersect(requiredLabelLevels, ...
                params.ratio_pct_callout_levels, 'stable');
            lblLvl = setdiff(requiredLabelLevels, calloutLevels, 'stable');
        end
        if hasExplicitContourLevels
            % Select the tighter existing label-gap policy without protecting
            % the composite envelopes themselves.
            protectedTag = "ExplicitPercentContour";
        elseif hasCompositeBoundary
            protectedTag = "CompositeFeasibleBoundary";
        end
        cl = addContourLabelsAlongLines(ax, C2, hc2, lblLvl, ...
            params, params.font_size - 3, params.ratio_pct_label_spacing, ...
            "percentSigned", protectedTag, ~hasExplicitContourLevels);
        if ~isempty(calloutLevels)
            calloutLabels = addContourCalloutLabels(ax, C2, calloutLevels, ...
                params, params.font_size - 3, "percentSigned");
            cl = [cl; calloutLabels];
        end
        formatContourLabels(cl, "percentSigned");
        if hasExplicitContourLevels
            placedLevels = arrayfun(@(h) h.UserData.ContourLevel, cl);
            missingLevels = setdiff(requiredLabelLevels, placedLevels);
            if ~isempty(missingLevels)
                forcedLabels = forcePlaceContourLabels(ax, C2, missingLevels, ...
                    params, params.font_size - 3, "percentSigned");
                cl = [cl; forcedLabels];
                formatContourLabels(forcedLabels, "percentSigned");
                refreshInterruptedContourLines(ancestor(ax, 'figure'));
                placedLevels = arrayfun(@(h) h.UserData.ContourLevel, cl);
                missingLevels = setdiff(requiredLabelLevels, placedLevels);
            end
            fprintf('Explicit percent-contour labels placed: %s\n', ...
                strjoin(string(placedLevels), ', '));
            if ~isempty(missingLevels)
                warning('Missing explicit percent-contour labels: %s.', ...
                    strjoin(string(missingLevels), ', '));
            end
        end
    end
end
grid(ax, 'on');
styleAxes(ax, params);
xlim(ax, params.x_mm_lim);
ylim(ax, params.y_pct_lim);
finishMapLayering(ax);
applyPresentationStyle(fig, params);
if useTopColorbar
    addTopPercentColorbarGuide(fig, cb_label, params);
end

end


function addTopPercentColorbarGuide(fig, cbLabel, params)
figSize = params.single_panel_figure_size_cm;
cbPos = params.single_panel_colorbar_cm;
guideAx = axes('Parent', fig, 'Units', 'centimeters', ...
    'Position', [0 0 figSize], ...
    'Visible', 'off', 'XLim', [0 figSize(1)], 'YLim', [0 figSize(2)]);
hold(guideAx, 'on');

labelPosition = "top";
if isfield(params, 'ratio_pct_colorbar_label_position')
    labelPosition = lower(string(params.ratio_pct_colorbar_label_position));
end
labelFontSize = params.font_size;
if isfield(params, 'ratio_pct_colorbar_label_font_size')
    labelFontSize = params.ratio_pct_colorbar_label_font_size;
end
if labelPosition == "right"
    labelX = cbPos(1) + cbPos(3) + 0.75;
    if isfield(params, 'ratio_pct_colorbar_label_x_cm')
        labelX = params.ratio_pct_colorbar_label_x_cm;
    end
    text(guideAx, labelX, cbPos(2) + 0.5 .* cbPos(4), cbLabel, ...
        'HorizontalAlignment', 'left', 'VerticalAlignment', 'middle', ...
        'FontName', params.font_name, 'FontSize', labelFontSize, ...
        'Interpreter', 'tex', 'Clipping', 'off');
else
    labelY = cbPos(2) + cbPos(4) + 0.70;
    if isfield(params, 'ratio_pct_colorbar_label_y_cm')
        labelY = params.ratio_pct_colorbar_label_y_cm;
    end
    text(guideAx, cbPos(1) + 0.5 .* cbPos(3), labelY, cbLabel, ...
        'HorizontalAlignment', 'center', 'VerticalAlignment', 'middle', ...
        'FontName', params.font_name, 'FontSize', labelFontSize, ...
        'Interpreter', 'tex', 'Clipping', 'off');
end

if ~(isfield(params, 'ratio_pct_positive_label') && ...
        isfield(params, 'ratio_pct_negative_label'))
    return;
end

cLim = double(params.ratio_pct_caxis_2d(:).');
if numel(cLim) ~= 2 || cLim(1) >= 0 || cLim(2) <= 0
    return;
end

isReversed = isfield(params, 'ratio_pct_colorbar_reverse') && ...
    params.ratio_pct_colorbar_reverse;
valueToX = @(v) cbPos(1) + cbPos(3) .* ((v - cLim(1)) ./ diff(cLim));
if isReversed
    valueToX = @(v) cbPos(1) + cbPos(3) .* ((cLim(2) - v) ./ diff(cLim));
end

xLeft = cbPos(1);
xRight = cbPos(1) + cbPos(3);
xZero = valueToX(0);
braceY = cbPos(2) - 0.70;
if isfield(params, 'ratio_pct_brace_y_cm')
    braceY = params.ratio_pct_brace_y_cm;
end
braceH = 0.22;
if isfield(params, 'ratio_pct_brace_height_cm')
    braceH = params.ratio_pct_brace_height_cm;
end
labelFontSize = params.font_size - 2;
if isfield(params, 'ratio_pct_brace_label_font_size')
    labelFontSize = params.ratio_pct_brace_label_font_size;
end

drawHorizontalUnderbrace(guideAx, xLeft, xZero, braceY, braceH, ...
    params.ratio_pct_positive_label, params, labelFontSize);
drawHorizontalUnderbrace(guideAx, xZero, xRight, braceY, braceH, ...
    params.ratio_pct_negative_label, params, labelFontSize);
try, uistack(guideAx, 'top'); catch, end
end


function drawHorizontalUnderbrace(ax, x0, x1, y0, height, labelText, params, fontSize)
pad = 0.06;
x0 = x0 + pad;
x1 = x1 - pad;
if x1 <= x0
    return;
end
w = x1 - x0;
armY = y0;
tipY = y0 - height;
endY = y0 + 0.42 .* height;
mid = 0.5 .* (x0 + x1);

leftPts = [
    x0,            endY;
    x0 + 0.01*w,  armY;
    x0 + 0.045*w, armY;
    x0 + 0.10*w,  armY;
    x0 + 0.25*w,  armY;
    mid - 0.075*w, armY;
    mid - 0.028*w, armY;
    mid - 0.006*w, armY;
    mid - 0.004*w, tipY;
    mid,           tipY
];
rightPts = [
    mid,           tipY;
    mid + 0.004*w, tipY;
    mid + 0.006*w, armY;
    mid + 0.028*w, armY;
    mid + 0.075*w, armY;
    x1 - 0.25*w,  armY;
    x1 - 0.10*w,  armY;
    x1 - 0.045*w, armY;
    x1 - 0.01*w,  armY;
    x1,            endY
];
[xb1, yb1] = cubicBezierPolyline(leftPts, 18);
[xb2, yb2] = cubicBezierPolyline(rightPts, 18);
xb = [xb1 xb2(2:end)];
yb = [yb1 yb2(2:end)];
plot(ax, xb, yb, '-', ...
    'Color', [0.12 0.12 0.12], ...
    'LineWidth', 0.65, ...
    'Clipping', 'off', ...
    'HandleVisibility', 'off');
text(ax, x0 + 0.5 .* w, y0 - height - 0.34, char(labelText), ...
    'HorizontalAlignment', 'center', 'VerticalAlignment', 'middle', ...
    'FontName', params.font_name, 'FontSize', fontSize, ...
    'Interpreter', 'tex', 'Clipping', 'off');
end


function [x, y] = cubicBezierPolyline(points, nPerSegment)
x = [];
y = [];
if nargin < 2 || isempty(nPerSegment)
    nPerSegment = 20;
end
for ii = 1:3:(size(points, 1) - 3)
    t = linspace(0, 1, nPerSegment);
    if ii > 1
        t = t(2:end);
    end
    p0 = points(ii, :);
    p1 = points(ii + 1, :);
    p2 = points(ii + 2, :);
    p3 = points(ii + 3, :);
    xy = ((1 - t).^3).' .* p0 + ...
        (3 .* (1 - t).^2 .* t).' .* p1 + ...
        (3 .* (1 - t) .* t.^2).' .* p2 + ...
        (t.^3).' .* p3;
    x = [x xy(:, 1).']; %#ok<AGROW>
    y = [y xy(:, 2).']; %#ok<AGROW>
end
end


%% ============================================================
%  Helper: portrait 3x2 resistance-share map (Al left, PA right)
% ============================================================
function plotShareGridAlPa(X_mm, Y_lin, Ri_Al_pct, Rw_Al_pct, Ro_Al_pct, ...
    Ri_Poly_pct, Rw_Poly_pct, Ro_Poly_pct, params)

params.font_size = params.share_grid_font_size;
params.axis_line_width = params.grid_axis_line_width;
params.tech_line_width = params.grid_tech_line_width;

fig = createPptFigure(params, 'shares alu pa portrait', params.share_grid_figure_size_cm);
applyProjectColormap(fig, params);

shareData = {Ri_Al_pct, Ri_Poly_pct, Rw_Al_pct, Rw_Poly_pct, Ro_Al_pct, Ro_Poly_pct};
panelLabel = { ...
    '\phi_{\rm{i,Al}}', '\phi_{\rm{i,PA}}', ...
    '\phi_{\rm{w,Al}}', '\phi_{\rm{w,PA}}', ...
    '\phi_{\rm{o,Al}}', '\phi_{\rm{o,PA}}'};
techLine = ["Al", "Poly", "Al", "Poly", "Al", "Poly"];
axPos = params.share_grid_axes_cm;
axH = gobjects(1, 6);

for k = 1:6
    ax = axes('Parent', fig);
    axH(k) = ax;
    box(ax, 'on'); hold(ax, 'on');

    Zc = double(shareData{k});
    Zc(~builtin('isfinite', Zc)) = NaN;
    drawVectorFilledMap(ax, X_mm, Y_lin, Zc, params, ...
        linspace(0, 100, params.vector_fill_levels));
    caxis(ax, [0 100]);

    rowId = ceil(k / 2);
    labelFontSizeByPanel = repmat(params.font_size - 2, 1, 6);

    if k == 3
        lvl = makeSteppedShareLevels(Zc, 0.025);
    else
        lvl = makeSparseShareContourLevels(Zc, false);
    end
    labelLvl = selectSparseShareLabelLevels(lvl, 4);
    labelParams = params;
    if k == 3
        labelLvl = selectSparseShareLabelLevels(lvl, 4);
        labelParams.ratio_pct_label_levels = labelLvl;
        labelParams.ratio_pct_label_target_y_pct = linspace(14, 34, numel(labelLvl));
        labelParams.ratio_pct_label_target_x_norm = linspace(0.30, 0.70, numel(labelLvl));
    end
    C = []; hc = gobjects(0);
    if ~isempty(lvl)
        if isscalar(lvl), lvl = [lvl lvl]; end
        [C, hc] = contour(ax, X_mm, Y_lin, Zc, lvl, ...
            'Color', [0.12 0.12 0.12], 'LineWidth', 0.65);
    end

    plotTechLimitLines(params, techLine(k), false, ax);

    set(ax, 'XScale', 'log', 'YScale', 'linear');
    set(ax, 'XTick', [0.1 1 10]);
    if rowId < 3
        set(ax, 'XTickLabel', {});
    else
        set(ax, 'XTickLabel', {'0.1', '1', '10'});
    end
    if mod(k, 2) == 0
        set(ax, 'YTickLabel', {});
    end
    grid(ax, 'on');
    styleAxes(ax, params);
    xlim(ax, params.x_mm_lim);
    ylim(ax, params.y_pct_lim);
    set(ax, 'Units', 'centimeters', 'Position', axPos(k, :));

    if lower(string(techLine(k))) == "al"
        plotValidatedCoolerReferencePoint(ax, params);
    end

    paramsSketch = params;
    paramsSketch.cross_section_reference_axes_cm = axPos(k, 3:4);
    plotCrossSectionSketches(ax, paramsSketch);

    if ~isempty(C)
        if isempty(labelLvl)
            labelLvl = lvl;
        end
        if isscalar(labelLvl), labelLvl = [labelLvl labelLvl]; end
        cl = addManualContourLabelsRelaxed(ax, C, hc, ...
            manualContourLabelSpecs("shares alu pa portrait", panelLabel{k}), ...
            labelParams, labelFontSizeByPanel(k), "percent");
        if isempty(cl)
            desiredLevel = labelLvl(ceil(numel(labelLvl) ./ 2));
            availableLevels = uniqueContourLevels(C);
            [~, nearestLevelIdx] = min(abs(availableLevels - desiredLevel));
            fallbackLevel = availableLevels(nearestLevelIdx);
            cl = forcePlaceContourLabels(ax, C, fallbackLevel, ...
                labelParams, labelFontSizeByPanel(k), "percent");
            if ~isempty(cl)
                renderInterruptedContourLines(ax, C, hc, cl);
                fprintf('Share contour fallback label (panel %d): %s\n', ...
                    k, char(string(cl(1).String)));
            end
        end
        formatContourLabels(cl, "percent");
    end
    finishMapLayering(ax);

    addPanelTitle(ax, panelLabel{k}, params, 'normal');
end

drawnow;
set(axH(6), 'Units', 'centimeters', 'Position', axPos(6, :));
cb = colorbar(axH(6), 'northoutside');
drawnow;
set(axH(6), 'Units', 'centimeters', 'Position', axPos(6, :));
set(cb, 'Units', 'centimeters', ...
    'Position', params.share_grid_colorbar_cm, ...
    'Orientation', 'horizontal');
cb.Label.String   = 'Resistance share, \phi_{\rm{j}} [%]';
cb.Label.Interpreter = 'tex';
cb.Ticks          = [0 10 25 50 75 90 100];
cb.TickLabels     = {'0 %','10 %','25 %','50 %','75 %','90 %','100 %'};
cb.TickLabelInterpreter = 'tex';
cb.FontName       = params.font_name;
cb.FontSize       = params.font_size;
cb.Label.FontName = params.font_name;
cb.Label.FontSize = params.font_size;

labelAx = axes('Parent', fig, 'Units', 'normalized', 'Position', [0 0 1 1], ...
    'Visible', 'off', 'XLim', [0 1], 'YLim', [0 1]);
text(labelAx, 0.52, 0.025, 'Outer diameter, {\it d}_{\rm{o}} [mm]', ...
    'HorizontalAlignment', 'center', 'VerticalAlignment', 'middle', ...
    'FontName', params.font_name, 'FontSize', params.font_size, ...
    'Interpreter', 'tex');
text(labelAx, 0.055, 0.50, 'Wall-thickness ratio, \tau = {\it t}/{\it d}_{\rm{o}} [%]', ...
    'HorizontalAlignment', 'center', 'VerticalAlignment', 'middle', ...
    'Rotation', 90, 'FontName', params.font_name, 'FontSize', params.font_size, ...
    'Interpreter', 'tex');
applyPresentationStyle(fig, params);
drawnow;
for k = 1:6
    set(axH(k), 'XTick', [0.1 1 10]);
    if ceil(k / 2) < 3
        set(axH(k), 'XTickLabel', {});
    else
        set(axH(k), 'XTickLabel', {'0.1', '1', '10'});
    end
    if mod(k, 2) == 0
        set(axH(k), 'YTickLabel', {});
    end
    finishMapLayering(axH(k));
end
end


%% ============================================================
%  Helper: portrait 3x2 capillary-rise map (Al left, PA right)
% ============================================================
function plotCapillaryRiseGridAlPa(X_mm, Y_lin, riseAl_mm, risePA_mm, params)

params.font_size = params.share_grid_font_size;
params.axis_line_width = params.grid_axis_line_width;
params.tech_line_width = params.grid_tech_line_width;

if numel(params.capillary.accel_over_g) ~= 3
    error('plotCapillaryRiseGridAlPa expects exactly three acceleration cases.');
end

fig = createPptFigure(params, 'capillary rise alu pa portrait', ...
    params.capillary_grid_figure_size_cm);
colormap(fig, flipud(getProjectColormap(params)));

axPos = params.share_grid_axes_cm;
axH = gobjects(1, 6);
logLimits = log10(params.capillary_log_caxis_mm);
finiteRise = [riseAl_mm(:); risePA_mm(:)];
finiteRise = finiteRise(builtin('isfinite', finiteRise) & finiteRise > 0);
fillLogLimits = [min(log10(finiteRise)), max(log10(finiteRise))];
fillLogLimits(1) = min(fillLogLimits(1), logLimits(1));
fillLogLimits(2) = max(fillLogLimits(2), logLimits(2));
fillLevels = linspace(fillLogLimits(1), fillLogLimits(2), params.vector_fill_levels);
panelLabel = {
    '{\it h}_{\rm{Al,1 g}}',  '{\it h}_{\rm{PA,1 g}}', ...
    '{\it h}_{\rm{Al,5 g}}',  '{\it h}_{\rm{PA,5 g}}', ...
    '{\it h}_{\rm{Al,10 g}}', '{\it h}_{\rm{PA,10 g}}'};
techLine = ["Al", "Poly"];

for rowId = 1:3
    for colId = 1:2
        k = (rowId - 1) .* 2 + colId;
        ax = axes('Parent', fig);
        axH(k) = ax;
        box(ax, 'on'); hold(ax, 'on');

        if colId == 1
            Zraw = double(riseAl_mm(:, :, rowId));
        else
            Zraw = double(risePA_mm(:, :, rowId));
        end
        Zraw(~builtin('isfinite', Zraw) | Zraw <= 0) = NaN;
        Zlog = log10(Zraw);

        drawVectorFilledMap(ax, X_mm, Y_lin, Zlog, params, fillLevels);
        caxis(ax, logLimits);

        C = [];
        hc = gobjects(0);
        labelLvl = [];
        lvl = trimContourLevels(params.capillary_contour_levels_mm, Zraw);
        if ~isempty(lvl)
            if isscalar(lvl), lvl = [lvl lvl]; end
            [C, hc] = contour(ax, X_mm, Y_lin, Zraw, lvl, ...
                'Color', [0.08 0.08 0.08], ...
                'LineWidth', params.capillary_contour_line_width);
            labelLvl = unique(lvl);
        end

        plotTechLimitLines(params, techLine(colId), false, ax);

        set(ax, 'XScale', 'log', 'YScale', 'linear');
        set(ax, 'XTick', [0.1 1 10]);
        if rowId < 3
            set(ax, 'XTickLabel', {});
        else
            set(ax, 'XTickLabel', {'0.1', '1', '10'});
        end
        if colId == 2
            set(ax, 'YTickLabel', {});
        end
        grid(ax, 'on');
        styleAxes(ax, params);
        xlim(ax, params.x_mm_lim);
        ylim(ax, params.y_pct_lim);
        set(ax, 'Units', 'centimeters', 'Position', axPos(k, :));

        paramsSketch = params;
        paramsSketch.cross_section_reference_axes_cm = axPos(k, 3:4);
        plotCrossSectionSketches(ax, paramsSketch);
        if ~isempty(C)
            addCapillaryRiseContourLabels(ax, C, hc, labelLvl, ...
                paramsSketch, params.font_size - 2);
        end
        finishMapLayering(ax);

        addPanelTitle(ax, panelLabel{k}, params, 'normal');
    end
end

drawnow;
set(axH(6), 'Units', 'centimeters', 'Position', axPos(6, :));
cb = colorbar(axH(6), 'northoutside');
drawnow;
set(axH(6), 'Units', 'centimeters', 'Position', axPos(6, :));
set(cb, 'Units', 'centimeters', ...
    'Position', params.capillary_grid_colorbar_cm, ...
    'Orientation', 'horizontal');
styleLogColorbar(cb, params.capillary_log_caxis_mm(1), ...
    params.capillary_log_caxis_mm(2), 'Capillary rise, {\it h} [mm]', params);
reverseColorbarScale(cb);

labelAx = axes('Parent', fig, 'Units', 'normalized', 'Position', [0 0 1 1], ...
    'Visible', 'off', 'XLim', [0 1], 'YLim', [0 1]);
text(labelAx, 0.52, 0.025, 'Outer diameter, {\it d}_{\rm{o}} [mm]', ...
    'HorizontalAlignment', 'center', 'VerticalAlignment', 'middle', ...
    'FontName', params.font_name, 'FontSize', params.font_size, ...
    'Interpreter', 'tex');
text(labelAx, 0.055, 0.50, 'Wall-thickness ratio, \tau = {\it t}/{\it d}_{\rm{o}} [%]', ...
    'HorizontalAlignment', 'center', 'VerticalAlignment', 'middle', ...
    'Rotation', 90, 'FontName', params.font_name, 'FontSize', params.font_size, ...
    'Interpreter', 'tex');
applyPresentationStyle(fig, params);
drawnow;
for k = 1:6
    rowId = ceil(k / 2);
    set(axH(k), 'XTick', [0.1 1 10]);
    if rowId < 3
        set(axH(k), 'XTickLabel', {});
    else
        set(axH(k), 'XTickLabel', {'0.1', '1', '10'});
    end
    if mod(k, 2) == 0
        set(axH(k), 'YTickLabel', {});
    end
    finishMapLayering(axH(k));
end
end


function labels = addBurstPressureContourLabels(ax, C, hc, labelLevels, params, fontSize)
% Pressure contours can be short and curved in the masked feasibility maps.
% Place one path-aligned label per selected level in normalized axes space.
segments = parseContourMatrix(C);
labels = gobjects(0);
if isempty(segments) || isempty(labelLevels)
    return;
end

labelLevels = unique(double(labelLevels(:).'));
occupiedExtents = protectedLabelExtents(ax, params);
minGap = 0.026;
targetX = 0.46;

for ii = 1:numel(labelLevels)
    lvl = labelLevels(ii);
    candidates = segments(abs([segments.level] - lvl) < max(1e-9, 1e-9*abs(lvl)));
    if isempty(candidates)
        continue;
    end

    targetY = 0.18 + 0.64 .* ii ./ max(numel(labelLevels) + 1, 2);
    candPts = makeBurstPressureLabelCandidates(ax, candidates, targetX, targetY);
    if isempty(candPts)
        continue;
    end

    labelText = makeContourLabelText(lvl, "bar");
    placed = false;

    for cc = 1:size(candPts, 1)
        hTxt = createPathAlignedContourLabel(ax, candPts(cc, 1), ...
            candPts(cc, 2), candPts(cc, 4), labelText, lvl, params, fontSize);
        drawnow limitrate;
        ext = paddedTextExtent(hTxt, minGap);
        inside = isTextExtentInsideAxes(ext);
        overlapsTechLine = extentIntersectsTaggedLines(ax, ext, "TechLimitLine");
        if inside && ~anyExtentsOverlap(ext, occupiedExtents) && ~overlapsTechLine
            labels(end+1, 1) = hTxt; %#ok<AGROW>
            occupiedExtents(end+1, :) = ext; %#ok<AGROW>
            placed = true;
            break;
        end
        delete(hTxt);
    end
end

if ~isempty(labels)
    renderInterruptedContourLines(ax, C, hc, labels);
    try, uistack(labels, 'top'); catch, end
end
end


function candPts = makeBurstPressureLabelCandidates(ax, candidates, targetX, targetY)
candPts = zeros(0, 4);
segLen = arrayfun(@(s) contourSegmentLength(ax, s.x, s.y), candidates);
[~, segOrder] = sort(segLen, 'descend');
for ss = 1:numel(segOrder)
    seg = candidates(segOrder(ss));
    [xn, yn] = normalizeAxesCoordinates(ax, seg.x, seg.y);
    valid = builtin('isfinite', xn) & builtin('isfinite', yn) & ...
        xn > 0.08 & xn < 0.92 & yn > 0.08 & yn < 0.92;
    idxValid = find(valid);
    if numel(idxValid) < 2
        valid = builtin('isfinite', xn) & builtin('isfinite', yn) & ...
            xn > 0.04 & xn < 0.96 & yn > 0.04 & yn < 0.96;
        idxValid = find(valid);
    end
    if isempty(idxValid)
        continue;
    end

    keepCount = min(30, numel(idxValid));
    keepIdx = unique(round(linspace(1, numel(idxValid), keepCount)));
    idx = idxValid(keepIdx);
    score = (xn(idx) - targetX).^2 + 0.8 .* (yn(idx) - targetY).^2 + 0.03 .* (ss - 1);
    angleDeg = arrayfun(@(kk) contourLabelAngle(ax, xn, yn, kk), idx);
    candPts = [candPts; xn(idx).', yn(idx).', score(:), angleDeg(:)]; %#ok<AGROW>
end
if isempty(candPts)
    return;
end
[~, order] = sort(candPts(:, 3), 'ascend');
candPts = candPts(order, :);
end


function labels = addCapillaryRiseContourLabels(ax, C, hc, labelLevels, params, fontSize)
% The generic path-aligned placement is robust for the nearly vertical
% capillary contours and also protects the tube-section sketches.
labels = addContourLabelsAlongLines(ax, C, hc, labelLevels, params, ...
    fontSize, params.contour_label_spacing, "mm");
end


function labels = addManualContourLabels(ax, C, hc, specs, params, fontSize, ...
        labelMode, protectedLineTags)
if nargin < 8 || isempty(protectedLineTags)
    protectedLineTags = "TechLimitLine";
end
labels = gobjects(0);
if isempty(specs) || isempty(C)
    return;
end

segments = parseContourMatrix(C);
if isempty(segments)
    reportManualContourLabelSkip(specs, "no contour geometry is available");
    return;
end

protectedLineTags = unique([string(protectedLineTags(:).'), "TechLimitLine"]);
occupiedExtents = protectedLabelExtents(ax, params);
minGap = manualContourLabelGap(labelMode, protectedLineTags);

for ii = 1:numel(specs)
    spec = specs(ii);
    [candidate, reason] = nearestManualContourLabelPoint(ax, segments, spec);
    if strlength(reason) > 0
        reportManualContourLabelSkip(spec, reason);
        continue;
    end

    labelText = makeContourLabelText(candidate.Level, labelMode);
    hTxt = createPathAlignedContourLabel(ax, candidate.XNorm, ...
        candidate.YNorm, candidate.AngleDeg, labelText, ...
        candidate.Level, params, fontSize);
    drawnow limitrate;

    try
        ext = paddedTextExtent(hTxt, minGap);
    catch
        if isvalid(hTxt), delete(hTxt); end
        reportManualContourLabelSkip(spec, "text extent could not be measured");
        continue;
    end

    reason = manualContourLabelExtentProblem(ax, ext, occupiedExtents, protectedLineTags);
    if strlength(reason) > 0
        delete(hTxt);
        reportManualContourLabelSkip(spec, reason);
        continue;
    end

    labels(end+1, 1) = hTxt; %#ok<AGROW>
    occupiedExtents(end+1, :) = ext; %#ok<AGROW>
    reportManualContourLabelPlaced(spec, candidate, labelText);
end

if isempty(labels)
    return;
end

if hasInterruptedContourSource(ax)
    refreshInterruptedContourLines(ax);
else
    allLabels = findall(ax, 'Type', 'text', 'Tag', 'ManualContourLabel');
    renderInterruptedContourLines(ax, C, hc, allLabels);
end
try, uistack(labels, 'top'); catch, end
end


function labels = addManualContourLabelsRelaxed(ax, C, hc, specs, params, fontSize, labelMode)
labels = gobjects(0);
if isempty(specs) || isempty(C)
    return;
end

segments = parseContourMatrix(C);
if isempty(segments)
    return;
end

levels = unique(double([segments.level]));
for ii = 1:numel(specs)
    spec = specs(ii);
    if isempty(levels) || ~builtin('isfinite', spec.TargetX_mm) || ...
            ~builtin('isfinite', spec.TargetY_pct)
        continue;
    end

    [~, levelIdx] = min(abs(levels - spec.Level));
    actualLevel = levels(levelIdx);
    levelTol = max(1e-9, 1e-9 .* abs(actualLevel));
    levelSegments = segments(abs(double([segments.level]) - actualLevel) <= levelTol);
    if isempty(levelSegments)
        continue;
    end

    [targetXNorm, targetYNorm] = normalizeAxesCoordinates(ax, ...
        spec.TargetX_mm, spec.TargetY_pct);
    if ~builtin('isfinite', targetXNorm) || ~builtin('isfinite', targetYNorm)
        targetXNorm = 0.5;
        targetYNorm = 0.5;
    end

    bestScore = inf;
    bestCandidate = [];
    for ss = 1:numel(levelSegments)
        [xn, yn] = normalizeAxesCoordinates(ax, levelSegments(ss).x, levelSegments(ss).y);
        valid = builtin('isfinite', xn) & builtin('isfinite', yn) & ...
            xn >= 0.06 & xn <= 0.94 & yn >= 0.07 & yn <= 0.93;
        if ~any(valid)
            valid = builtin('isfinite', xn) & builtin('isfinite', yn) & ...
                xn >= 0 & xn <= 1 & yn >= 0 & yn <= 1;
        end
        idx = find(valid);
        if isempty(idx)
            continue;
        end
        score = (xn(idx) - targetXNorm).^2 + 0.8 .* (yn(idx) - targetYNorm).^2;
        [segScore, localIdx] = min(score);
        if segScore < bestScore
            bestScore = segScore;
            bestIdx = idx(localIdx);
            bestCandidate = [xn(bestIdx), yn(bestIdx), ...
                contourLabelAngle(ax, xn, yn, bestIdx)];
        end
    end
    if isempty(bestCandidate)
        continue;
    end

    labelText = makeContourLabelText(actualLevel, labelMode);
    hTxt = createPathAlignedContourLabel(ax, bestCandidate(1), bestCandidate(2), ...
        bestCandidate(3), labelText, actualLevel, params, fontSize);
    labels(end+1, 1) = hTxt; %#ok<AGROW>
end

if isempty(labels)
    return;
end
renderInterruptedContourLines(ax, C, hc, labels);
try, uistack(labels, 'top'); catch, end
end


function labels = ensureMinimumContourLabels(ax, C, hc, labelLevels, minCount, ...
        params, fontSize, labelMode, protectedLineTags, contextLabel)
if nargin < 10 || strlength(string(contextLabel)) == 0
    contextLabel = "contour panel";
end
if nargin < 9 || isempty(protectedLineTags)
    protectedLineTags = "TechLimitLine";
end
labels = gobjects(0);
if isempty(C) || minCount <= 0
    return;
end

existingLabels = findall(ax, 'Type', 'text', 'Tag', 'ManualContourLabel');
if numel(existingLabels) >= minCount
    return;
end

segments = parseContourMatrix(C);
if isempty(segments)
    fprintf('Supplemental contour labels skipped: %s has no contour geometry.\n', ...
        char(string(contextLabel)));
    return;
end

availableLevels = uniqueContourLevels(C);
candidateLevels = usableSupplementalContourLevels(labelLevels, availableLevels);
if isempty(candidateLevels)
    candidateLevels = availableLevels;
end
if isempty(candidateLevels)
    fprintf('Supplemental contour labels skipped: %s has no usable contour levels.\n', ...
        char(string(contextLabel)));
    return;
end

existingLevels = contourLabelLevelsOnAxes(ax);
unlabeledLevels = contourLevelsWithoutExistingLabels(candidateLevels, existingLevels);
levelQueue = [unlabeledLevels(:).' candidateLevels(:).' candidateLevels(:).'];
levelQueue = levelQueue(builtin('isfinite', levelQueue));
if isempty(levelQueue)
    levelQueue = candidateLevels(:).';
end

protectedLineTags = unique([string(protectedLineTags(:).'), "TechLimitLine"]);
occupiedExtents = protectedLabelExtents(ax, params);
minGap = 0.75 .* manualContourLabelGap(labelMode, protectedLineTags);
minGap = max(minGap, 0.004);
targetSlots = [
    0.36 0.30
    0.62 0.42
    0.42 0.68
    0.72 0.78
    0.30 0.78
    0.76 0.28
    0.52 0.54
    0.23 0.48
];

queueIdx = 1;
attempts = 0;
maxAttempts = max(80, 8 .* numel(levelQueue));
while numel(existingLabels) + numel(labels) < minCount && attempts < maxAttempts
    lvl = levelQueue(1 + mod(queueIdx - 1, numel(levelQueue)));
    queueIdx = queueIdx + 1;
    attempts = attempts + 1;

    levelTol = max(1e-9, 1e-9 .* abs(lvl));
    candidates = segments(abs(double([segments.level]) - lvl) <= levelTol);
    if isempty(candidates)
        continue;
    end

    slot = targetSlots(1 + mod(attempts - 1, size(targetSlots, 1)), :);
    candPts = makeContourLabelCandidates(ax, candidates, attempts, ...
        max(numel(candidateLevels), minCount), slot(2), slot(1));
    if isempty(candPts)
        continue;
    end

    labelText = makeContourLabelText(lvl, labelMode);
    for cc = 1:size(candPts, 1)
        hTxt = createPathAlignedContourLabel(ax, candPts(cc, 1), ...
            candPts(cc, 2), candPts(cc, 4), labelText, lvl, params, fontSize);
        drawnow limitrate;
        try
            ext = paddedTextExtent(hTxt, minGap);
        catch
            if isvalid(hTxt), delete(hTxt); end
            continue;
        end

        reason = manualContourLabelExtentProblem(ax, ext, occupiedExtents, protectedLineTags);
        if strlength(reason) == 0
            labels(end+1, 1) = hTxt; %#ok<AGROW>
            occupiedExtents(end+1, :) = ext; %#ok<AGROW>
            break;
        end
        delete(hTxt);
    end
end

finalCount = numel(existingLabels) + numel(labels);
if finalCount < minCount
    fprintf('Supplemental contour labels: %s has %d/%d collision-free labels.\n', ...
        char(string(contextLabel)), finalCount, minCount);
else
    fprintf('Supplemental contour labels: %s reached %d labels.\n', ...
        char(string(contextLabel)), finalCount);
end

if isempty(labels)
    return;
end

if hasInterruptedContourSource(ax)
    refreshInterruptedContourLines(ax);
else
    allLabels = findall(ax, 'Type', 'text', 'Tag', 'ManualContourLabel');
    renderInterruptedContourLines(ax, C, hc, allLabels);
end
try, uistack(labels, 'top'); catch, end
end


function levels = usableSupplementalContourLevels(labelLevels, availableLevels)
levels = [];
if isempty(labelLevels)
    return;
end
availableLevels = unique(double(availableLevels(:).'));
for ii = 1:numel(labelLevels)
    requested = double(labelLevels(ii));
    [delta, idx] = min(abs(availableLevels - requested));
    if ~isempty(idx) && delta <= max(1e-9, 1e-9 .* abs(requested))
        levels(end+1) = availableLevels(idx); %#ok<AGROW>
    end
end
levels = unique(levels, 'stable');
end


function levels = contourLabelLevelsOnAxes(ax)
levels = [];
labels = findall(ax, 'Type', 'text', 'Tag', 'ManualContourLabel');
for ii = 1:numel(labels)
    try
        data = get(labels(ii), 'UserData');
        if isstruct(data) && isfield(data, 'ContourLevel')
            levels(end+1) = double(data.ContourLevel); %#ok<AGROW>
        end
    catch
    end
end
levels = unique(levels, 'stable');
end


function levels = contourLevelsWithoutExistingLabels(candidateLevels, existingLevels)
candidateLevels = unique(double(candidateLevels(:).'), 'stable');
existingLevels = double(existingLevels(:).');
keep = true(size(candidateLevels));
for ii = 1:numel(candidateLevels)
    tol = max(1e-9, 1e-9 .* abs(candidateLevels(ii)));
    keep(ii) = ~any(abs(existingLevels - candidateLevels(ii)) <= tol);
end
levels = candidateLevels(keep);
end


function specs = manualContourLabelSpecs(figureName, panelName)
specs = emptyManualContourLabelSpecs();
allSpecs = emptyManualContourLabelSpecs();

allSpecs(end+1) = makeManualContourLabelSpec("bundle kA aluminum", "Aluminum", 50, 3.3, 29);
allSpecs(end+1) = makeManualContourLabelSpec("bundle kA polymer", "PA", 50, 2.2, 30);

allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{i,Al}}', 12, 7.5, 12);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{i,Al}}', 16, 1.8, 18);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{i,Al}}', 22, 2.7, 32);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{i,PA}}', 6, 0.42, 28);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{i,PA}}', 8, 0.65, 24);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{i,PA}}', 10, 0.95, 20);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{i,PA}}', 12, 1.25, 8);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{w,Al}}', 0.05, 0.45, 35);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{w,Al}}', 0.10, 1.5, 24);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{w,Al}}', 0.15, 1.9, 20);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{w,PA}}', 10, 0.45, 9);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{w,PA}}', 30, 1.4, 20);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{w,PA}}', 50, 2.1, 34);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{o,Al}}', 80, 0.8, 28);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{o,Al}}', 84, 1.45, 16);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{o,Al}}', 90, 4.5, 9);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{o,PA}}', 50, 1.8, 28);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{o,PA}}', 70, 0.9, 25);
allSpecs(end+1) = makeManualContourLabelSpec("shares alu pa portrait", '\phi_{\rm{o,PA}}', 80, 2.5, 14);

allSpecs(end+1) = makeManualContourLabelSpec("burst tolerance alu pa portrait", "Aluminum, standard", 1600, 1.7, 31);
allSpecs(end+1) = makeManualContourLabelSpec("burst tolerance alu pa portrait", "Aluminum, standard", 200, 2.5, 6);
allSpecs(end+1) = makeManualContourLabelSpec("burst tolerance alu pa portrait", "PA, standard", 100, 0.50, 33);
allSpecs(end+1) = makeManualContourLabelSpec("burst tolerance alu pa portrait", "Aluminum, medical", 1200, 0.95, 25);
allSpecs(end+1) = makeManualContourLabelSpec("burst tolerance alu pa portrait", "Aluminum, medical", 400, 2.3, 6);
allSpecs(end+1) = makeManualContourLabelSpec("burst tolerance alu pa portrait", "PA, medical", 100, 0.50, 30);
allSpecs(end+1) = makeManualContourLabelSpec("burst tolerance alu pa portrait", "PA, medical", 10, 3.2, 5);

allSpecs(end+1) = makeManualContourLabelSpec("design boundary lines alu pa", "PA", 200, 0.43, 13);
allSpecs(end+1) = makeManualContourLabelSpec("design boundary lines alu pa", "PA", 500, 0.58, 14);

figureName = lower(string(figureName));
panelName = string(panelName);
keep = arrayfun(@(s) lower(string(s.Figure)) == figureName && ...
    string(s.Panel) == panelName, allSpecs);
specs = allSpecs(keep);
end


function specs = emptyManualContourLabelSpecs()
specs = struct('Figure', {}, 'Panel', {}, 'Level', {}, ...
    'TargetX_mm', {}, 'TargetY_pct', {});
end


function spec = makeManualContourLabelSpec(figureName, panelName, level, targetX_mm, targetY_pct)
spec = struct('Figure', char(figureName), ...
    'Panel', char(panelName), ...
    'Level', double(level), ...
    'TargetX_mm', double(targetX_mm), ...
    'TargetY_pct', double(targetY_pct));
end


function [candidate, reason] = nearestManualContourLabelPoint(ax, segments, spec)
candidate = struct('Level', NaN, 'XNorm', NaN, 'YNorm', NaN, ...
    'AngleDeg', 0, 'SnapDistance', NaN);
reason = "";

levels = unique(double([segments.level]));
if isempty(levels)
    reason = "no contour levels are available";
    return;
end
if ~builtin('isfinite', spec.TargetX_mm) || ~builtin('isfinite', spec.TargetY_pct) || ...
        spec.TargetX_mm <= 0
    reason = "target coordinate is invalid";
    return;
end

[targetXNorm, targetYNorm] = normalizeAxesCoordinates(ax, ...
    spec.TargetX_mm, spec.TargetY_pct);
if ~builtin('isfinite', targetXNorm) || ~builtin('isfinite', targetYNorm) || ...
        targetXNorm < 0 || targetXNorm > 1 || targetYNorm < 0 || targetYNorm > 1
    reason = "target coordinate lies outside the axes";
    return;
end

[~, levelIdx] = min(abs(levels - spec.Level));
actualLevel = levels(levelIdx);
levelTol = max(1e-9, 1e-9 .* abs(actualLevel));
levelSegments = segments(abs(double([segments.level]) - actualLevel) <= levelTol);
if isempty(levelSegments)
    reason = sprintf('requested contour %.4g is unavailable', spec.Level);
    return;
end

bestDistance = inf;
bestAngle = 0;
bestXNorm = NaN;
bestYNorm = NaN;
for jj = 1:numel(levelSegments)
    [~, ~, xNorm, yNorm] = densifyContourSegment( ...
        ax, levelSegments(jj).x, levelSegments(jj).y, 0.0015);
    valid = builtin('isfinite', xNorm) & builtin('isfinite', yNorm) & ...
        xNorm >= 0.01 & xNorm <= 0.99 & yNorm >= 0.01 & yNorm <= 0.99;
    validIdx = find(valid);
    if isempty(validIdx)
        continue;
    end
    distance = hypot(xNorm(validIdx) - targetXNorm, yNorm(validIdx) - targetYNorm);
    [localDistance, relIdx] = min(distance);
    if localDistance < bestDistance
        bestIdx = validIdx(relIdx);
        bestDistance = localDistance;
        bestXNorm = xNorm(bestIdx);
        bestYNorm = yNorm(bestIdx);
        bestAngle = contourLabelAngle(ax, xNorm, yNorm, bestIdx);
    end
end

if ~builtin('isfinite', bestDistance)
    reason = sprintf('no visible segment exists for contour %.4g', actualLevel);
    return;
end

maxSnapDistance = 0.18;
if bestDistance > maxSnapDistance
    reason = sprintf('nearest %.4g contour is too far from target (normalized distance %.3f)', ...
        actualLevel, bestDistance);
    return;
end

candidate.Level = actualLevel;
candidate.XNorm = bestXNorm;
candidate.YNorm = bestYNorm;
candidate.AngleDeg = bestAngle;
candidate.SnapDistance = bestDistance;
end


function minGap = manualContourLabelGap(labelMode, protectedLineTags)
if lower(string(labelMode)) == "percent"
    minGap = 0.010;
elseif any(strlength(string(protectedLineTags)) > 0)
    minGap = 0.008;
else
    minGap = 0.024;
end
end


function reason = manualContourLabelExtentProblem(ax, ext, occupiedExtents, protectedLineTags)
reason = "";
if ~isTextExtentInsideAxes(ext)
    reason = "text extent would leave the axes";
elseif anyExtentsOverlap(ext, occupiedExtents)
    reason = "text extent overlaps an existing label, marker, or tube sketch";
elseif extentIntersectsTaggedLines(ax, ext, protectedLineTags)
    reason = "text extent intersects a protected line or hatch";
end
end


function tf = hasInterruptedContourSource(ax)
tf = false;
lines = findall(ax, 'Type', 'line');
for ii = 1:numel(lines)
    if isgraphics(lines(ii)) && isappdata(lines(ii), 'InterruptedContourSource')
        tf = true;
        return;
    end
end
end


function reportManualContourLabelPlaced(spec, candidate, labelText)
fprintf(['Manual contour label placed: %s / %s, C=%s, target d_o=%.3g mm, ', ...
    'tau=%.3g%%, snap=%.3f.\n'], ...
    spec.Figure, spec.Panel, char(string(labelText)), ...
    spec.TargetX_mm, spec.TargetY_pct, candidate.SnapDistance);
if abs(candidate.Level - spec.Level) > max(1e-9, 1e-9 .* abs(spec.Level))
    fprintf('  Used nearest available contour level %.4g instead of requested %.4g.\n', ...
        candidate.Level, spec.Level);
end
end


function reportManualContourLabelSkip(specs, reason)
for ii = 1:numel(specs)
    spec = specs(ii);
    fprintf(['Manual contour label skipped: %s / %s, C=%.4g, ', ...
        'target d_o=%.3g mm, tau=%.3g%% (%s).\n'], ...
        spec.Figure, spec.Panel, spec.Level, spec.TargetX_mm, ...
        spec.TargetY_pct, char(string(reason)));
end
end


%% ============================================================
%  Helper: landscape triple-panel resistance-share map (V8 new)
% ============================================================
function plotTripleShareMap(X_mm, Y_lin, Ri_pct, Rw_pct, Ro_pct, params)

% Scale font so that effective size in LaTeX matches single-panel plots.
% Single panels: 18 pt × (textwidth/24 cm) ≈ 8.8 pt effective.
% Triple at width=21 cm over 34 cm export: scale = 21/34 = 0.618 → need 8.8/0.618 ≈ 14 pt.
params.font_size = 14;

fig = createPptFigure(params, 'shares triple landscape', params.triple_share_figure_size_cm);
applyProjectColormap(fig, params);

shareData  = {Ri_pct,        Rw_pct,        Ro_pct};
panelLabel = {'(a)  \phi_{\rm{i}}', '(b)  \phi_{\rm{w}}', '(c)  \phi_{\rm{o}}'};
axPos      = params.triple_share_axes_cm;   % 3x4: one row per panel

% Store per-panel x-tick labels for re-application after applyPresentationStyle
% (applyPresentationStyle resets FontSize on axes, which causes MATLAB to
% regenerate log-scale tick labels in "10^{-1}" format, overriding our custom labels).
xTickLabelStore = cell(1, 3);

axH = gobjects(1, 3);
for k = 1:3
    ax = axes('Parent', fig);
    axH(k) = ax;
    box(ax, 'on');  hold(ax, 'on');

    Zc = double(shareData{k});
    Zc(~builtin('isfinite', Zc)) = NaN;
    drawVectorFilledMap(ax, X_mm, Y_lin, Zc, params, ...
        linspace(0, 100, params.vector_fill_levels));
    caxis(ax, [0 100]);

    % Contours every 1%, labels every 5%, aligned to the contour paths
    C = [];
    hc = gobjects(0);
    lblLvl = [];
    lvl = params.share_contour_levels;
    lvl = lvl(lvl > min(Zc(:), [], 'omitnan') & lvl < max(Zc(:), [], 'omitnan'));
    if ~isempty(lvl)
        if isscalar(lvl), lvl = [lvl lvl]; end
        [C, hc] = contour(ax, X_mm, Y_lin, Zc, lvl, ...
            'Color', [0.12 0.12 0.12], 'LineWidth', 0.8);
        lblLvl = lvl(mod(lvl, 5) == 0);
        if isempty(lblLvl), lblLvl = lvl(1:max(1, round(numel(lvl)/4)):end); end
        if isscalar(lblLvl), lblLvl = [lblLvl lblLvl]; end
    end

    % Tech-limit line (Poly dotted, dark green) — no legend, caption describes it
    plotTechLimitLines(params, "Poly", false, ax);

    set(ax, 'XScale', 'log', 'YScale', 'linear');
    % X-axis label only on center panel to avoid repetition
    if k == 2
        xlabel(ax, 'Outer diameter, {\it d}_{\rm{o}} [mm]', 'Interpreter', 'tex');
    else
        xlabel(ax, '');
    end
    if k == 1
        ylabel(ax, 'Wall-thickness ratio, \tau = {\it t}/{\it d}_{\rm{o}} [%]', 'Interpreter', 'tex');
    else
        set(ax, 'YTickLabel', {});
        ylabel(ax, '');
    end
    grid(ax, 'on');
    styleAxes(ax, params);
    xlim(ax, params.x_mm_lim);
    ylim(ax, params.y_pct_lim);
    finishMapLayering(ax);

    % Log-scale x-ticks: show all ticks on panel 1, hide '0.1' on panels 2–3
    % to prevent the left-edge label overlapping with the previous panel's '10'.
    set(ax, 'XTick', [0.1 1 10]);
    if k == 1
        xTickLabelStore{k} = {'0.1', '1', '10'};
    else
        xTickLabelStore{k} = {'', '1', '10'};
    end
    set(ax, 'XTickLabel', xTickLabelStore{k});

    drawnow;
    set(ax, 'Units', 'centimeters', 'Position', axPos(k, :));

    % Cross-section tube sketches — use the triple panel axes size as reference
    paramsSketch = params;
    paramsSketch.cross_section_reference_axes_cm = axPos(k, 3:4);
    plotCrossSectionSketches(ax, paramsSketch);
    if ~isempty(C)
        addContourLabelsAlongLines(ax, C, hc, lblLvl, ...
            paramsSketch, params.font_size - 2, ...
            params.contour_label_spacing, "plain");
    end

    % Panel label above the axes (title), not inside — sits in the reserved top margin
    addPanelTitle(ax, panelLabel{k}, params, 'normal');
end

% Single shared colorbar on the right of panel 3
drawnow;
set(axH(3), 'Units', 'centimeters', 'Position', axPos(3, :));
cb = colorbar(axH(3));
drawnow;
set(axH(3), 'Units', 'centimeters', 'Position', axPos(3, :));
set(cb, 'Units', 'centimeters', 'Position', params.triple_share_colorbar_cm);
cb.Label.String   = 'Fractional resistance share [%]';
cb.FontName       = params.font_name;
cb.FontSize       = params.font_size;
cb.Label.FontName = params.font_name;
cb.Label.FontSize = params.font_size;

% applyPresentationStyle can reset FontSize on axes, causing MATLAB to regenerate
% log-scale XTickLabels. Re-apply everything explicitly afterwards.
applyPresentationStyle(fig, params);
drawnow;
for k = 1:3
    set(axH(k), 'XTick', [0.1 1 10], 'XTickLabel', xTickLabelStore{k});
end
cb.Ticks      = [0 10 25 50 75 90 100];
cb.TickLabels = {'0 %','10 %','25 %','50 %','75 %','90 %','100 %'};
cb.TickLabelInterpreter = 'tex';
cb.FontName   = params.font_name;
cb.FontSize   = params.font_size;
cb.Label.FontName = params.font_name;
cb.Label.FontSize = params.font_size;
drawnow;
end


%% ============================================================
%  Helper: two-panel boundary summary (Al left, PA right)
% ============================================================
function plotDesignBoundaryLinesAlPa(X_mm, Y_lin, kA_Al_WK, kA_Poly_WK, ...
    pB_Al_bar, pB_Poly_bar, coolantFlow_Lmin, dp_i_bar, ...
    cost_Al_index, cost_Poly_index, capillaryRiseAl_mm, capillaryRisePA_mm, ...
    kALogLimits, params)

params.font_size = params.design_boundary_font_size;
params.axis_line_width = params.grid_axis_line_width;

fig = createPptFigure(params, 'design boundary lines alu pa', ...
    params.design_boundary_figure_size_cm);
applyProjectColormap(fig, params);

axPos = params.design_boundary_axes_cm;
axH = gobjects(1, 2);
materials = ["Aluminum", "PA"];
tMin = [params.tmin_Al_mm, params.tmin_Poly_mm];
kAData = {kA_Al_WK, kA_Poly_WK};
pBData = {pB_Al_bar, pB_Poly_bar};
costData = {cost_Al_index, cost_Poly_index};
capillaryData = {capillaryRiseAl_mm, capillaryRisePA_mm};

feasibleKAMaps = cell(1, 2);
feasibleMasks = cell(1, 2);
for jj = 1:2
    [feasibleKAMaps{jj}, feasibleMasks{jj}] = maskDesignBoundaryKAMap( ...
        kAData{jj}, X_mm, Y_lin, tMin(jj), ...
        pBData{jj}, coolantFlow_Lmin, dp_i_bar, costData{jj}, ...
        capillaryData{jj}, params);
end
logLimits = double(kALogLimits(:).');
kAlo = 10.^logLimits(1);
kAhi = 10.^logLimits(2);
fillLevels = linspace(logLimits(1), logLimits(2), params.vector_fill_levels);
commonIsoLabelLevels = selectCommonDesignKALabelLevels( ...
    feasibleKAMaps, params.kA_abs_contour_levels_WK, 6);

for jj = 1:2
    ax = axes('Parent', fig);
    axH(jj) = ax;
    box(ax, 'on'); hold(ax, 'on');

    Zlog = log10(feasibleKAMaps{jj});
    finiteZ = builtin('isfinite', Zlog);
    Zlog(finiteZ) = min(max(Zlog(finiteZ), logLimits(1)), logLimits(2));
    drawVectorFilledMap(ax, X_mm, Y_lin, Zlog, params, fillLevels);
    caxis(ax, logLimits);

    set(ax, 'XScale', 'log', 'YScale', 'linear');
    set(ax, 'XTick', [0.1 1 10], 'XTickLabel', {'0.1', '1', '10'});
    if jj == 1
        set(ax, 'XTickLabel', {});
    end
    grid(ax, 'on');
    styleAxes(ax, params);
    xlim(ax, params.x_mm_lim);
    ylim(ax, params.y_pct_lim);
    set(ax, 'Units', 'centimeters', 'Position', axPos(jj, :));

    [isoC, isoHandle] = plotDesignKAIsoLines( ...
        ax, X_mm, Y_lin, feasibleKAMaps{jj}, params);
    plotFeasibleMaskBoundary(ax, X_mm, Y_lin, feasibleMasks{jj});
    plotDesignBoundaryLines(ax, X_mm, Y_lin, tMin(jj), pBData{jj}, ...
        coolantFlow_Lmin, dp_i_bar, costData{jj}, capillaryData{jj}, params);

    if materials(jj) == "Aluminum"
        plotValidatedCoolerReferencePoint(ax, params);
    end
    isoLabelLevels = commonIsoLabelLevels;
    if materials(jj) == "PA"
        isoLabelLevels = sort(unique([isoLabelLevels, 500]));
    end
    isoLabels = addContourLabelsAlongLines(ax, isoC, isoHandle, isoLabelLevels, ...
        params, params.font_size - 2, 520, "plain", "DesignBoundaryLine");
    fprintf('Design-boundary k_o A_o labels (%s): %s W/K\n', ...
        char(materials(jj)), strjoin(string(get(isoLabels, 'String')), ', '));
    if numel(isoLabels) < numel(isoLabelLevels)
        warning('Only %d of %d common k_o A_o labels were placed for %s.', ...
            numel(isoLabels), numel(isoLabelLevels), char(materials(jj)));
    end
    addManualContourLabels(ax, isoC, isoHandle, ...
        manualContourLabelSpecs("design boundary lines alu pa", materials(jj)), ...
        params, params.font_size - 2, "plain", ...
        ["DesignBoundaryLine", "DesignBoundaryHatch", "FeasibleMaskBoundary", "TechLimitLine"]);

    finishMapLayering(ax);
    addPanelTitle(ax, char(materials(jj)), params, 'normal');
end

drawnow;
set(axH(1), 'Units', 'centimeters', 'Position', axPos(1, :));
cb = colorbar(axH(1), 'northoutside');
drawnow;
set(axH(1), 'Units', 'centimeters', 'Position', axPos(1, :));
set(cb, 'Units', 'centimeters', ...
    'Position', params.design_boundary_colorbar_cm, ...
    'Orientation', 'horizontal');
styleLogColorbar(cb, kAlo, kAhi, ...
    'Conductance, {\it k}_{\rm{o}}{\it A}_{\rm{o}} [W K^{-1}]', params);
setLogColorbarTicksFromLevels(cb, params.kA_abs_contour_levels_WK, kAlo, kAhi);
reverseColorbarScale(cb);
cb.Label.String = '';

figSizeCm = params.design_boundary_figure_size_cm;
panelCenterX = axPos(2, 1) + 0.5 .* axPos(2, 3);
panelCenterY = 0.5 .* (axPos(2, 2) + axPos(1, 2) + axPos(1, 4));
labelAx = axes('Parent', fig, 'Units', 'centimeters', ...
    'Position', [0 0 figSizeCm], ...
    'Visible', 'off', 'XLim', [0 figSizeCm(1)], 'YLim', [0 figSizeCm(2)]);
text(labelAx, panelCenterX, 27.95, ...
    'Conductance, {\it k}_{\rm{o}}{\it A}_{\rm{o}} [W K^{-1}]', ...
    'HorizontalAlignment', 'center', 'VerticalAlignment', 'middle', ...
    'FontName', params.font_name, 'FontSize', params.font_size, ...
    'Interpreter', 'tex');
text(labelAx, panelCenterX, 3.20, 'Outer diameter, {\it d}_{\rm{o}} [mm]', ...
    'HorizontalAlignment', 'center', 'VerticalAlignment', 'middle', ...
    'FontName', params.font_name, 'FontSize', params.font_size, ...
    'Interpreter', 'tex');
text(labelAx, 1.25, panelCenterY, 'Wall-thickness ratio, \tau = {\it t}/{\it d}_{\rm{o}} [%]', ...
    'HorizontalAlignment', 'center', 'VerticalAlignment', 'middle', ...
    'Rotation', 90, 'FontName', params.font_name, 'FontSize', params.font_size, ...
    'Interpreter', 'tex');
addDesignBoundaryLegend(fig, params);

applyPresentationStyle(fig, params);
drawnow;
for jj = 1:2
    set(axH(jj), 'XTick', [0.1 1 10], 'XTickLabel', {'0.1', '1', '10'});
    if jj == 1
        set(axH(jj), 'XTickLabel', {});
    end
    finishMapLayering(axH(jj));
end
end


function [kAMap, ok] = maskDesignBoundaryKAMap(kAData, X_mm, Y_lin, tMin_mm, ...
    pB_bar, coolantFlow_Lmin, dp_i_bar, costIndex, capillaryRise_mm, params)
kAMap = double(kAData);
T_mm_local = X_mm .* Y_lin ./ 100;
ok = builtin('isfinite', kAMap) & kAMap > 0 & ...
    T_mm_local >= tMin_mm & ...
    double(pB_bar) >= params.design_boundary_min_burst_bar & ...
    double(coolantFlow_Lmin) >= params.design_boundary_min_flow_Lmin & ...
    double(dp_i_bar) <= params.design_boundary_max_dp_bar & ...
    double(costIndex) < params.design_boundary_max_cost_index & ...
    double(capillaryRise_mm) <= params.design_boundary_max_capillary_mm;
kAMap(~ok) = NaN;
end


function screen = makeDesignScreenData(tMin_mm, k_Wm2K, kA_WK, burst_bar, ...
    coolant_Lmin, dp_bar, cost_index, capillary_mm)
screen = struct( ...
    'tMin_mm', double(tMin_mm), ...
    'k_Wm2K', double(k_Wm2K), ...
    'kA_WK', double(kA_WK), ...
    'burst_bar', double(burst_bar), ...
    'coolant_Lmin', double(coolant_Lmin), ...
    'dp_bar', double(dp_bar), ...
    'cost_index', double(cost_index), ...
    'capillary_mm', double(capillary_mm));
end


function printDesignBoundaryDiagnostics(X_mm, designMaskAl, designMaskPA, ...
    boundaryYPct, boundaryAlXmm, boundaryPAXmm)
[alGridMin, alGridMax] = finiteMinMax(X_mm(designMaskAl));
[paGridMin, paGridMax] = finiteMinMax(X_mm(designMaskPA));
[alBoundaryMin, alBoundaryMax] = finiteMinMax(boundaryAlXmm);
[paBoundaryMin, paBoundaryMax] = finiteMinMax(boundaryPAXmm);
[boundaryYMin, boundaryYMax] = finiteMinMax(boundaryYPct( ...
    builtin('isfinite', boundaryAlXmm) | builtin('isfinite', boundaryPAXmm)));

fprintf(['All-screen feasible grid points: Al %d (d_o = %.3g-%.3g mm), ' ...
    'PA %d (d_o = %.3g-%.3g mm).\n'], ...
    nnz(designMaskAl), alGridMin, alGridMax, ...
    nnz(designMaskPA), paGridMin, paGridMax);
fprintf(['Composite feasible diameter boundaries: Al d_o = %.3g-%.3g mm, ' ...
    'PA d_o = %.3g-%.3g mm over tau = %.3g-%.3g %%. \n'], ...
    alBoundaryMin, alBoundaryMax, paBoundaryMin, paBoundaryMax, ...
    boundaryYMin, boundaryYMax);
end


function [vMin, vMax] = finiteMinMax(values)
values = double(values(:));
values = values(builtin('isfinite', values));
if isempty(values)
    vMin = NaN;
    vMax = NaN;
else
    vMin = min(values);
    vMax = max(values);
end
end


function [kRef, kARef, dRef] = nearestFeasibleAlReference( ...
    X_mm, Y_pct, paFeasibleMask, screenAl, params)
[xVec, tVec] = nativeDesignGridVectors(X_mm, Y_pct);
kRef = NaN(size(X_mm));
kARef = NaN(size(X_mm));
dRef = NaN(size(X_mm));

for col = 1:numel(xVec)
    rows = find(paFeasibleMask(:, col));
    if isempty(rows)
        continue;
    end

    tauFrac = double(Y_pct(rows, col)) ./ 100;
    dCandidates = xVec(col:end);
    Dq = repmat(dCandidates, numel(rows), 1);
    Tq = tauFrac .* Dq;
    [ok, kq, kAq] = evaluateDesignScreenAtQueries( ...
        xVec, tVec, Dq, Tq, screenAl, params);
    [hasReference, firstIdx] = max(ok, [], 2);
    validRows = find(hasReference);
    if isempty(validRows)
        continue;
    end

    queryIdx = sub2ind(size(ok), validRows, firstIdx(validRows));
    targetRows = rows(validRows);
    targetIdx = sub2ind(size(X_mm), targetRows, repmat(col, size(targetRows)));
    kRef(targetIdx) = kq(queryIdx);
    kARef(targetIdx) = kAq(queryIdx);
    dRef(targetIdx) = Dq(queryIdx);
end
end


function [yPct, xMinFeasible] = compositeFeasibleDiameterBoundary( ...
    X_mm, Y_pct, screen, params)
[xVec, tVec] = nativeDesignGridVectors(X_mm, Y_pct);
nSamples = params.composite_boundary_samples;
yPct = linspace(max(params.y_pct_lim(1), 0.05), params.y_pct_lim(2), nSamples).';
dCandidates = logspace(log10(params.x_mm_lim(1)), ...
    log10(params.x_mm_lim(2)), 4 .* nSamples);
Dq = repmat(dCandidates, nSamples, 1);
Tq = (yPct ./ 100) .* Dq;
ok = evaluateDesignScreenAtQueries(xVec, tVec, Dq, Tq, screen, params);
[hasFeasible, firstIdx] = max(ok, [], 2);
xMinFeasible = NaN(size(yPct));
valid = find(hasFeasible);
if ~isempty(valid)
    queryIdx = sub2ind(size(ok), valid, firstIdx(valid));
    xMinFeasible(valid) = Dq(queryIdx);
end
end


function [ok, kq, kAq] = evaluateDesignScreenAtQueries( ...
    xVec, tVec, Dq, Tq, screen, params)
kq = interp2(xVec, tVec, screen.k_Wm2K, Dq, Tq, 'linear', NaN);
kAq = interp2(xVec, tVec, screen.kA_WK, Dq, Tq, 'linear', NaN);
burstQ = interp2(xVec, tVec, screen.burst_bar, Dq, Tq, 'linear', NaN);
coolantQ = interp2(xVec, tVec, screen.coolant_Lmin, Dq, Tq, 'linear', NaN);
dpQ = interp2(xVec, tVec, screen.dp_bar, Dq, Tq, 'linear', NaN);
costQ = interp2(xVec, tVec, screen.cost_index, Dq, Tq, 'linear', NaN);
capillaryQ = interp2(xVec, tVec, screen.capillary_mm, Dq, Tq, 'linear', NaN);
tauPct = 100 .* Tq ./ Dq;

ok = builtin('isfinite', kq) & kq > 0 & ...
    builtin('isfinite', kAq) & kAq > 0 & ...
    Tq >= screen.tMin_mm & ...
    tauPct >= params.y_pct_lim(1) & tauPct <= params.y_pct_lim(2) & ...
    burstQ >= params.design_boundary_min_burst_bar & ...
    coolantQ >= params.design_boundary_min_flow_Lmin & ...
    dpQ <= params.design_boundary_max_dp_bar & ...
    costQ < params.design_boundary_max_cost_index & ...
    capillaryQ <= params.design_boundary_max_capillary_mm;
end


function plotCompositeFeasibleBoundaries(ax, boundary, params)
spec = {
    boundary.x_al_mm, boundary.y_pct, params.tech_Al_color, '--';
    boundary.x_pa_mm, boundary.y_pct, params.tech_Poly_color, ':'
};
for ii = 1:size(spec, 1)
    x = double(spec{ii, 1});
    y = double(spec{ii, 2});
    valid = builtin('isfinite', x) & builtin('isfinite', y);
    if nnz(valid) < 2
        continue;
    end
    plot(ax, x, y, '-', ...
        'Color', [1 1 1], ...
        'LineWidth', params.tech_line_width + 1.0, ...
        'HandleVisibility', 'off', ...
        'Tag', 'CompositeFeasibleBoundaryUnderlay');
    plot(ax, x, y, spec{ii, 4}, ...
        'Color', spec{ii, 3}, ...
        'LineWidth', params.tech_line_width, ...
        'HandleVisibility', 'off', ...
        'Tag', 'CompositeFeasibleBoundary');
end
end


function [C, hc] = plotDesignKAIsoLines(ax, X_mm, Y_lin, kAMap, params)
C = [];
hc = gobjects(0);
Z = double(kAMap);
Z(~builtin('isfinite', Z) | Z <= 0) = NaN;
lvl = trimContourLevels(params.kA_abs_contour_levels_WK, Z);
if isempty(lvl)
    return;
end
if isscalar(lvl), lvl = [lvl lvl]; end
[C, hc] = contour(ax, X_mm, Y_lin, Z, lvl, ...
    'Color', [0.10 0.10 0.10], ...
    'LineWidth', 0.55, ...
    'LineStyle', '-', ...
    'HandleVisibility', 'off', ...
    'Tag', 'DesignKAIsoLine');
end


function labelLevels = selectCommonDesignKALabelLevels(kAMaps, candidateLevels, targetCount)
candidateLevels = unique(double(candidateLevels(:).'));
commonLevels = candidateLevels;
for ii = 1:numel(kAMaps)
    values = double(kAMaps{ii});
    values = values(builtin('isfinite', values) & values > 0);
    if isempty(values)
        labelLevels = [];
        return;
    end
    commonLevels = commonLevels(commonLevels > min(values) & commonLevels < max(values));
end
if isempty(commonLevels)
    labelLevels = [];
    return;
end

targetCount = min(max(1, round(targetCount)), numel(commonLevels));
if numel(commonLevels) >= targetCount + 2
    pool = commonLevels(2:end-1);
else
    pool = commonLevels;
end
targetCount = min(targetCount, numel(pool));
targetLog = linspace(log10(pool(1)), log10(pool(end)), targetCount);
selected = false(size(pool));
labelLevels = zeros(1, 0);
for target = targetLog
    distance = abs(log10(pool) - target);
    distance(selected) = Inf;
    [~, idx] = min(distance);
    if builtin('isfinite', distance(idx))
        selected(idx) = true;
        labelLevels(end+1) = pool(idx); %#ok<AGROW>
    end
end
labelLevels = sort(unique(labelLevels));
end


function plotFeasibleMaskBoundary(ax, X_mm, Y_lin, okMask)
ok = logical(okMask);
if ~any(ok(:)) || all(ok(:))
    return;
end
contour(ax, X_mm, Y_lin, double(ok), [0.5 0.5], ...
    'Color', [0.18 0.18 0.18], ...
    'LineStyle', ':', ...
    'LineWidth', 0.35, ...
    'HandleVisibility', 'off', ...
    'Tag', 'FeasibleMaskBoundary');
end


function plotDesignBoundaryLines(ax, X_mm, Y_lin, tMin_mm, pB_bar, ...
    coolantFlow_Lmin, dp_i_bar, costIndex, capillaryRise_mm, params)
lineWidth = params.design_boundary_line_width;
boundaryOpts = designBoundaryLineOptions(params, lineWidth);
daVec = logspace(log10(params.x_mm_lim(1)), log10(params.x_mm_lim(2)), 500);
yMinWall = 100 .* tMin_mm ./ daVec;
wallExcludedFcn = @(xq, yq) (double(xq) .* double(yq) ./ 100) < tMin_mm;

boundaryline(ax, daVec, yMinWall, ...
    'Color', params.design_boundary_color_min_wall, ...
    boundaryOpts{:}, 'ExcludedSideFcn', wallExcludedFcn, 'HatchSide', 'below');
plotBoundaryLineFromContour(ax, X_mm, Y_lin, coolantFlow_Lmin, ...
    params.design_boundary_min_flow_Lmin, params.design_boundary_color_flow, ...
    boundaryOpts, 'less');
plotBoundaryLineFromContour(ax, X_mm, Y_lin, dp_i_bar, ...
    params.design_boundary_max_dp_bar, params.design_boundary_color_dp, ...
    boundaryOpts, 'greater');
plotBoundaryLineFromContour(ax, X_mm, Y_lin, costIndex, ...
    params.design_boundary_max_cost_index, params.design_boundary_color_cost, ...
    boundaryOpts, 'greater_equal');
plotBoundaryLineFromContour(ax, X_mm, Y_lin, pB_bar, ...
    params.design_boundary_min_burst_bar, params.design_boundary_color_burst, ...
    boundaryOpts, 'less');
plotBoundaryLineFromContour(ax, X_mm, Y_lin, capillaryRise_mm, ...
    params.design_boundary_max_capillary_mm, params.design_boundary_color_capillary, ...
    boundaryOpts, 'greater');
end


function opts = designBoundaryLineOptions(params, lineWidth)
opts = {'LineWidth', lineWidth, ...
    'Hatches', '/', ...
    'HatchLength', params.design_boundary_hatch_length, ...
    'HatchSpacing', params.design_boundary_hatch_spacing, ...
    'HatchAngle', params.design_boundary_hatch_angle_deg};
end


function h = plotBoundaryLineFromContour(ax, X_mm, Y_lin, Z, level, color, boundaryOpts, violationDirection)
h = gobjects(0);
Zv = double(Z);
finiteVals = Zv(builtin('isfinite', Zv));
if ~builtin('isfinite', level) || isempty(finiteVals) || ...
        level < min(finiteVals) || level > max(finiteVals)
    return;
end
[xVec, tVec] = nativeDesignGridVectors(X_mm, Y_lin);
C = contourc(xVec, tVec, Zv, [level level]);
segments = parseContourMatrix(C);
excludedFcn = makeGridThresholdViolationFcn(X_mm, Y_lin, Zv, level, violationDirection);
for ii = 1:numel(segments)
    if numel(segments(ii).x) < 2
        continue;
    end
    xPlot = double(segments(ii).x);
    yPlot = 100 .* double(segments(ii).y) ./ xPlot;
    bad = ~builtin('isfinite', xPlot) | ~builtin('isfinite', yPlot) | xPlot <= 0;
    xPlot(bad) = NaN;
    yPlot(bad) = NaN;
    h(end+1, 1) = boundaryline(ax, xPlot, yPlot, ...
        'Color', color, boundaryOpts{:}, 'ExcludedSideFcn', excludedFcn); %#ok<AGROW>
end
end


function excludedFcn = makeGridThresholdViolationFcn(X_mm, Y_lin, Z, level, violationDirection)
[xVec, tVec] = nativeDesignGridVectors(X_mm, Y_lin);
Zv = double(Z);
direction = lower(string(violationDirection));
excludedFcn = @(xq, yq) evalNativeThresholdViolation( ...
    xVec, tVec, Zv, level, direction, xq, yq);
end


function [xVec, tVec] = nativeDesignGridVectors(X_mm, Y_lin)
xVec = double(X_mm(1, :));
T_mm = double(X_mm) .* double(Y_lin) ./ 100;
tVec = double(T_mm(:, 1));
end


function tf = evalNativeThresholdViolation(xVec, tVec, Z, level, direction, xq, yq)
xq = double(xq);
yq = double(yq);
tq = xq .* yq ./ 100;
vals = interp2(xVec, tVec, Z, xq, tq, 'linear', NaN);
switch direction
    case "less"
        tf = vals < level;
    case "greater"
        tf = vals > level;
    case "greater_equal"
        tf = vals >= level;
    otherwise
        error('Unknown boundary violation direction: %s', char(direction));
end
tf(~builtin('isfinite', vals)) = true;
end


function addDesignBoundaryLegend(fig, params)
legendAx = axes('Parent', fig, ...
    'Units', 'centimeters', ...
    'Position', params.design_boundary_legend_cm, ...
    'Visible', 'off', ...
    'XLim', [0 1], ...
    'YLim', [0 1], ...
    'Tag', 'DesignBoundaryLegend');
hold(legendAx, 'on');
rectangle(legendAx, 'Position', [0.005 0.02 0.99 0.96], ...
    'EdgeColor', [0.10 0.10 0.10], ...
    'FaceColor', 'w', ...
    'LineWidth', 0.70, ...
    'HandleVisibility', 'off');

labels = {'Minimum wall', 'Coolant throughput', 'Pressure drop', ...
    'Tube cost', 'Burst pressure', 'Capillary rise'};
colors = [
    params.design_boundary_color_min_wall;
    params.design_boundary_color_flow;
    params.design_boundary_color_dp;
    params.design_boundary_color_cost;
    params.design_boundary_color_burst;
    params.design_boundary_color_capillary
];
x0 = [0.055 0.055 0.055 0.555 0.555 0.555];
y0 = [0.80 0.50 0.20 0.80 0.50 0.20];
for ii = 1:numel(labels)
    plot(legendAx, [x0(ii) x0(ii)+0.055], [y0(ii) y0(ii)], '-', ...
        'Color', colors(ii, :), ...
        'LineWidth', params.design_boundary_line_width, ...
        'HandleVisibility', 'off');
    text(legendAx, x0(ii)+0.070, y0(ii), labels{ii}, ...
        'HorizontalAlignment', 'left', ...
        'VerticalAlignment', 'middle', ...
        'FontName', params.font_name, ...
        'FontSize', params.font_size, ...
        'Interpreter', 'tex', ...
        'HandleVisibility', 'off');
end
end


function h = boundaryline(varargin)
if ~isempty(varargin) && isgraphics(varargin{1}, 'axes')
    ax = varargin{1};
    varargin(1) = [];
else
    ax = gca;
end

if numel(varargin) < 2
    error('boundaryline requires x and y data.');
end
x = varargin{1};
y = varargin{2};
varargin(1:2) = [];

color = [0 0 0];
lineWidth = 0.5;
hatchSide = 'below';
hatchLength = 0.028;
hatchSpacing = 0.055;
hatchAngleDeg = 35;
hatches = '/';
excludedSideFcn = [];
flipBoundary = false;
lineSpecConsumed = false;
recognizedNames = {'Color','LineWidth','HatchSide','HatchLength','HatchSpacing', ...
    'HatchAngle','HatchTangency','FlipBoundary','Hatches','ExcludedSideFcn', ...
    'HandleVisibility','Tag'};

ii = 1;
while ii <= numel(varargin)
    arg = varargin{ii};
    if ~lineSpecConsumed && (ischar(arg) || isstring(arg)) && ...
            ~any(strcmpi(char(arg), recognizedNames))
        lineSpecConsumed = true;
        ii = ii + 1;
        continue;
    end
    if ii == numel(varargin)
        break;
    end
    name = char(arg);
    value = varargin{ii + 1};
    switch lower(name)
        case 'color'
            color = value;
        case 'linewidth'
            lineWidth = value;
        case 'hatchside'
            hatchSide = char(value);
        case 'hatchlength'
            hatchLength = value;
        case 'hatchspacing'
            hatchSpacing = value;
        case 'hatchangle'
            hatchAngleDeg = value;
        case 'hatches'
            hatches = char(value);
        case 'excludedsidefcn'
            excludedSideFcn = value;
        case 'flipboundary'
            flipBoundary = logical(value);
        case 'hatchtangency'
            % The fallback always draws hatch marks relative to the local tangent.
        otherwise
            % Accept unsupported boundaryline name-value pairs without failing.
    end
    ii = ii + 2;
end

if flipBoundary && isempty(excludedSideFcn)
    hatchSide = flipBoundarySide(hatchSide);
end

h = plot(ax, x, y, '-', ...
    'Color', color, ...
    'LineWidth', lineWidth, ...
    'HandleVisibility', 'off', ...
    'Tag', 'DesignBoundaryLine');
plotBoundaryHatches(ax, x, y, hatchSide, color, lineWidth, hatchLength, ...
    hatchSpacing, hatchAngleDeg, excludedSideFcn, flipBoundary, hatches);
end


function side = flipBoundarySide(side)
switch lower(string(side))
    case "above"
        side = 'below';
    case "below"
        side = 'above';
    case "left"
        side = 'right';
    case "right"
        side = 'left';
end
end


function plotBoundaryHatches(ax, x, y, hatchSide, color, lineWidth, hatchLength, ...
    hatchSpacing, hatchAngleDeg, excludedSideFcn, flipBoundary, hatches)
if any(lower(string(hatches)) == ["", "none", "off"])
    return;
end
x = double(x(:).');
y = double(y(:).');
finite = builtin('isfinite', x) & builtin('isfinite', y) & x > 0;
if nnz(finite) < 2
    return;
end

xScale = lower(string(get(ax, 'XScale')));
xLim = get(ax, 'XLim');
yLim = get(ax, 'YLim');
if xScale == "log"
    xToNorm = @(v) (log10(v) - log10(xLim(1))) ./ (log10(xLim(2)) - log10(xLim(1)));
    normToX = @(v) 10.^(log10(xLim(1)) + v .* (log10(xLim(2)) - log10(xLim(1))));
else
    xToNorm = @(v) (v - xLim(1)) ./ (xLim(2) - xLim(1));
    normToX = @(v) xLim(1) + v .* (xLim(2) - xLim(1));
end
yToNorm = @(v) (v - yLim(1)) ./ (yLim(2) - yLim(1));
normToY = @(v) yLim(1) + v .* (yLim(2) - yLim(1));
hatchAngleDeg = min(max(abs(double(hatchAngleDeg)), 5), 85);

idx = find(finite);
breaks = [0 find(diff(idx) > 1) numel(idx)];
for bb = 1:numel(breaks)-1
    segIdx = idx(breaks(bb)+1:breaks(bb+1));
    if numel(segIdx) < 2
        continue;
    end
    xn = xToNorm(x(segIdx));
    yn = yToNorm(y(segIdx));
    ds = [0 cumsum(hypot(diff(xn), diff(yn)))];
    if ds(end) <= 0
        continue;
    end
    sTargets = hatchSpacing:hatchSpacing:ds(end);
    for ss = sTargets
        x0n = interp1(ds, xn, ss, 'linear', 'extrap');
        y0n = interp1(ds, yn, ss, 'linear', 'extrap');
        seg = find(ds <= ss, 1, 'last');
        seg = min(max(seg, 1), numel(segIdx)-1);
        tangent = normalizeVector2D([xn(seg+1) - xn(seg), yn(seg+1) - yn(seg)]);
        normal = chooseBoundaryHatchNormal(x0n, y0n, tangent, hatchSide, ...
            excludedSideFcn, flipBoundary, hatchLength, normToX, normToY);
        dir = cosd(hatchAngleDeg) .* tangent + sind(hatchAngleDeg) .* normal;
        dir = normalizeVector2D(dir);
        x1n = x0n + hatchLength .* dir(1);
        y1n = y0n + hatchLength .* dir(2);
        plot(ax, [normToX(x0n) normToX(x1n)], [normToY(y0n) normToY(y1n)], '-', ...
            'Color', color, ...
            'LineWidth', lineWidth, ...
            'HandleVisibility', 'off', ...
            'Tag', 'DesignBoundaryHatch');
    end
end
end


function normal = chooseBoundaryHatchNormal(x0n, y0n, tangent, hatchSide, ...
    excludedSideFcn, flipBoundary, hatchLength, normToX, normToY)
normalA = normalizeVector2D([-tangent(2), tangent(1)]);
normalB = -normalA;
normal = [];

if ~isempty(excludedSideFcn)
    probe = max(0.006, 0.45 .* hatchLength);
    badA = isExcludedBoundarySide(excludedSideFcn, x0n, y0n, normalA, probe, normToX, normToY);
    badB = isExcludedBoundarySide(excludedSideFcn, x0n, y0n, normalB, probe, normToX, normToY);
    if badA && ~badB
        normal = normalA;
    elseif badB && ~badA
        normal = normalB;
    end
end

if isempty(normal)
    sideDir = hatchSideUnitVector(hatchSide);
    if dot(normalA, sideDir) >= dot(normalB, sideDir)
        normal = normalA;
    else
        normal = normalB;
    end
end

if flipBoundary
    normal = -normal;
end
end


function tf = isExcludedBoundarySide(excludedSideFcn, x0n, y0n, normal, probe, normToX, normToY)
try
    xq = normToX(x0n + probe .* normal(1));
    yq = normToY(y0n + probe .* normal(2));
    val = excludedSideFcn(xq, yq);
    if islogical(val)
        tf = any(val(:));
    else
        val = double(val);
        tf = any(builtin('isfinite', val(:)) & val(:) ~= 0);
    end
catch
    tf = false;
end
end


function v = hatchSideUnitVector(hatchSide)
switch lower(string(hatchSide))
    case "above"
        v = [0 1];
    case "below"
        v = [0 -1];
    case "left"
        v = [-1 0];
    case "right"
        v = [1 0];
    otherwise
        v = [0 -1];
end
end


function v = normalizeVector2D(v)
v = double(v);
n = hypot(v(1), v(2));
if ~builtin('isfinite', n) || n <= 0
    v = [1 0];
else
    v = v ./ n;
end
end


%% ============================================================
%  Helpers: physical heat-transfer model (VDI G7 / VDI G1)
% ============================================================
function [alpha_o, Re_cl] = vdiG7InlineTubeBankAlpha(v_a_ms, d_o_mm, model_outer, air)
%VDIG7INLINETUBEBANKALPHA Air-side alpha_o for an inline tube bank.
%
% Source and convention:
%   VDI-Waermeatlas 2013, chapter G7, cross-flow around tube rows and through
%   tube bundles. The implementation follows the local reconstruction in
%   Investigations/heat_transfer_submodels_figures_2_7_2_8 and VDI_Waermeatlas.md:
%     l = pi*d_o/2
%     c = 1 - pi/(4*a) for b >= 1
%     Re_c,l = w*l/(c*nu)
%     Nu_l,0 = 0.3 + sqrt(Nu_lam^2 + Nu_turb^2)
%     Nu_bundle = f_A * Nu_l,0 for a many-row inline bundle
%     alpha_o = Nu_bundle*lambda/l
%
% Area/reference convention:
%   alpha_o is already referenced to the outer tube surface, matching the
%   overall resistance equation used in the paper.

d_o_m = double(d_o_mm) .* 1e-3;
alpha_o = NaN(size(d_o_m));
Re_cl = NaN(size(d_o_m));
good = builtin('isfinite', d_o_m) & (d_o_m > 0);
if ~any(good(:))
    return;
end

a = double(model_outer.a_pitch_transverse);
b = double(model_outer.b_pitch_longitudinal);
n_rows = double(model_outer.n_rows);

if b >= 1
    c_void = 1.0 - pi ./ (4.0 .* a);
else
    c_void = 1.0 - pi ./ (4.0 .* a .* b);
end

l_ref = pi .* d_o_m ./ 2.0;
Re_tmp = double(v_a_ms) .* l_ref ./ (c_void .* air.nu_m2s);
Re_cl(good) = Re_tmp(good);

Nu_lam = 0.664 .* sqrt(Re_tmp) .* air.Pr.^(1.0/3.0);
Nu_turb = (0.037 .* Re_tmp.^0.8 .* air.Pr) ./ ...
    (1.0 + 2.443 .* Re_tmp.^(-0.1) .* (air.Pr.^(2.0/3.0) - 1.0));
Nu_l0 = 0.3 + sqrt(Nu_lam.^2 + Nu_turb.^2);

f_A = 1.0 + 0.7 .* c_void.^(-1.5) .* ...
    ((b ./ a - 0.3) ./ ((b ./ a + 0.7).^2));

if isfield(model_outer, 'use_finite_row_correction') && model_outer.use_finite_row_correction
    row_factor = (1.0 + (n_rows - 1.0) .* f_A) ./ n_rows;
else
    row_factor = f_A;
end

K = 1.0;
if isfield(model_outer, 'property_correction_K') && builtin('isfinite', model_outer.property_correction_K)
    K = model_outer.property_correction_K;
end

Nu_bundle = row_factor .* Nu_l0 .* K;
alpha_tmp = Nu_bundle .* air.lambda_WmK ./ l_ref;
alpha_o(good) = alpha_tmp(good);
end


function alpha_i = vdiG1InternalTubeAlpha(v_i_ms, d_i_mm, model_inner, liquid)
%VDIG1INTERNALTUBEALPHA Tube-side alpha_i for circular internal flow.
%
% Source and convention:
%   VDI-Waermeatlas 2013, chapter G1, heat transfer in pipe flow.
%   Reynolds number uses the local mean tube velocity and inner diameter:
%     Re_i = v_i*d_i/nu_i
%   Heat-transfer coefficient:
%     alpha_i = Nu_i*lambda_i/d_i
%
% The function implements:
%   - laminar mean Nu for constant wall temperature or constant heat flux,
%   - turbulent Gnielinski/Konakov expression,
%   - transition interpolation with the dedicated VDI anchors at Re=2300 and
%     Re=10000. This is intentionally stricter than the early diagnostic script.
%
% No wall-temperature Prandtl correction is applied by default because the paper
% map does not have a measured wall-temperature field. If wall data become
% available, set apply_liquid_Pr_wall_correction=true and provide Pr_wall.

d_i_m = double(d_i_mm) .* 1e-3;
alpha_i = NaN(size(d_i_m));
good = builtin('isfinite', d_i_m) & (d_i_m > 0);
if ~any(good(:))
    return;
end

Re = double(v_i_ms) .* d_i_m ./ liquid.nu_m2s;
Pr = double(liquid.Pr);
L = double(model_inner.length_m);
boundary = char(model_inner.boundary_condition);

Nu = NaN(size(d_i_m));
laminar = good & (Re < 2300.0);
transition = good & (Re >= 2300.0) & (Re <= 10000.0);
turbulent = good & (Re > 10000.0);

if any(laminar(:))
    Nu(laminar) = vdiG1LaminarMeanNu(Re(laminar), Pr, d_i_m(laminar), L, boundary);
end
if any(transition(:))
    Nu_l_2300 = vdiG1LaminarTransitionAnchorNu(Pr, d_i_m(transition), L, boundary);
    Nu_t_10000 = vdiG1TurbulentMeanNu(10000.0 .* ones(size(d_i_m(transition))), ...
        Pr, d_i_m(transition), L);
    g = (Re(transition) - 2300.0) ./ (10000.0 - 2300.0);
    Nu(transition) = (1.0 - g) .* Nu_l_2300 + g .* Nu_t_10000;
end
if any(turbulent(:))
    Nu(turbulent) = vdiG1TurbulentMeanNu(Re(turbulent), Pr, d_i_m(turbulent), L);
end

if isfield(model_inner, 'apply_liquid_Pr_wall_correction') && ...
        model_inner.apply_liquid_Pr_wall_correction
    if ~isfield(model_inner, 'Pr_wall') || ~builtin('isfinite', model_inner.Pr_wall)
        error('VDI G1 Pr-wall correction requested, but model_inner.Pr_wall is missing.');
    end
    Nu = Nu .* (Pr ./ double(model_inner.Pr_wall)).^0.11;
end

alpha_tmp = Nu .* liquid.lambda_WmK ./ d_i_m;
alpha_i(good) = alpha_tmp(good);
end


function Nu = vdiG1LaminarMeanNu(Re, Pr, d_i_m, L, boundary)
X = Re .* Pr .* d_i_m ./ L;

if strcmpi(boundary, 'constant_wall_temperature')
    Nu_1 = 3.66;
    Nu_2 = 1.615 .* X.^(1.0/3.0);
    Nu_3 = (2.0 ./ (1.0 + 22.0 .* Pr)).^(1.0/6.0) .* sqrt(X);
    Nu = (Nu_1.^3 + 0.7.^3 + (Nu_2 - 0.7).^3 + Nu_3.^3).^(1.0/3.0);
    return;
end

if strcmpi(boundary, 'constant_heat_flux')
    Nu_1 = 4.364;
    Nu_2 = 1.953 .* X.^(1.0/3.0);
    Nu_3 = 0.924 .* Pr.^(1.0/3.0) .* sqrt(Re .* d_i_m ./ L);
    Nu = (Nu_1.^3 + 0.6.^3 + (Nu_2 - 0.6).^3 + Nu_3.^3).^(1.0/3.0);
    return;
end

error('Unknown VDI G1 boundary condition: %s', boundary);
end


function Nu = vdiG1LaminarTransitionAnchorNu(Pr, d_i_m, L, boundary)
% Dedicated VDI transition anchors for Re=2300.
% These are not numerically identical to simply calling the all-Re laminar
% expression at Re=2300; VDI G1 gives separate constants for the transition
% interpolation.
Re2300 = 2300.0;

if strcmpi(boundary, 'constant_wall_temperature')
    Nu_2 = 1.615 .* (Re2300 .* Pr .* d_i_m ./ L).^(1.0/3.0);
    Nu_3 = (2.0 ./ (1.0 + 22.0 .* Pr)).^(1.0/6.0) .* ...
        sqrt(Re2300 .* Pr .* d_i_m ./ L);
    Nu = (4.9.^3 + (Nu_2 - 0.7).^3 + Nu_3.^3).^(1.0/3.0);
    return;
end

if strcmpi(boundary, 'constant_heat_flux')
    Nu_2 = 1.953 .* (Re2300 .* Pr .* d_i_m ./ L).^(1.0/3.0);
    Nu_3 = 0.924 .* Pr.^(1.0/3.0) .* sqrt(Re2300 .* d_i_m ./ L);
    Nu = (8.3.^3 + (Nu_2 - 0.6).^3 + Nu_3.^3).^(1.0/3.0);
    return;
end

error('Unknown VDI G1 boundary condition: %s', boundary);
end


function Nu = vdiG1TurbulentMeanNu(Re, Pr, d_i_m, L)
xi = (1.8 .* log10(Re) - 1.5).^(-2.0);
Nu = ((xi ./ 8.0) .* (Re - 1000.0) .* Pr) ./ ...
    (1.0 + 12.7 .* sqrt(xi ./ 8.0) .* (Pr.^(2.0/3.0) - 1.0)) .* ...
    (1.0 + (d_i_m ./ L).^(2.0/3.0));
end


%% ============================================================
%  Helper: burst pressure (Lame)
% ============================================================
function DI_eff_mm = calcEffectiveInnerDiameterForBurst(DO_mm, T_nom_mm, tol_mm)
T_loc_min_mm = double(T_nom_mm) - double(tol_mm);
DI_eff_mm = double(DO_mm) - 2 .* T_loc_min_mm;
DI_eff_mm(T_loc_min_mm <= 0) = NaN;
end


function p_bar = calcPburstBar(DO_mm, DI_mm, Rm_MPa)
Rm_Pa = double(Rm_MPa) * 1e6;
DO    = double(DO_mm);
DI    = double(DI_mm);
p_bar = NaN(size(DO));
good  = builtin('isfinite', DO) & builtin('isfinite', DI) & (DO > 0) & (DI > 0) & (DO > DI);
p_Pa  = Rm_Pa .* (DO.^2 - DI.^2) ./ (DO.^2 + DI.^2);
p_bar(good) = p_Pa(good) ./ 1e5;
end


function dp_bar = calcTubeFrictionPressureDropBar(v_i_ms, d_i_mm, model_inner, liquid)
%CALCTUBEFRICTIONPRESSUREDROPBAR Straight-tube coolant-side friction pressure drop.
%
% This is a diagnostic pressure-drop screen for the fixed tube-side velocity
% used in the paper. It includes only straight-tube Darcy-Weisbach friction.
% It does not include headers, inlet/outlet losses, bends, distributors,
% maldistribution, or any full heat-exchanger pressure-drop contribution.

d_i_m = double(d_i_mm) .* 1e-3;
v_i_ms = double(v_i_ms);

dp_bar = NaN(size(d_i_m));

good = builtin('isfinite', d_i_m) & d_i_m > 0 & ...
       builtin('isfinite', v_i_ms) & v_i_ms > 0;

if ~any(good(:))
    return;
end

rho = double(liquid.rho_kgm3);
nu  = double(liquid.nu_m2s);
L   = double(model_inner.length_m);

Re = v_i_ms .* d_i_m ./ nu;
fD = calcDarcyFrictionFactorSmoothTube(Re);

dp_Pa = fD .* (L ./ d_i_m) .* 0.5 .* rho .* v_i_ms.^2;
dp_bar(good) = dp_Pa(good) ./ 1e5;

dp_bar(~good) = NaN;
dp_bar(~builtin('isfinite', dp_bar) | dp_bar <= 0) = NaN;
end


function fD = calcDarcyFrictionFactorSmoothTube(Re)
%CALCDARCYFRICTIONFACTORSMOOTHTUBE Darcy friction factor for smooth circular tubes.
%
% Laminar: f_D = 64/Re.
% Turbulent: smooth-tube Konakov/Gnielinski-style expression.
% Transition: linear interpolation between Re = 2300 and Re = 10000.

Re = double(Re);
fD = NaN(size(Re));

laminar = builtin('isfinite', Re) & Re > 0 & Re < 2300;
transition = builtin('isfinite', Re) & Re >= 2300 & Re <= 10000;
turbulent = builtin('isfinite', Re) & Re > 10000;

fD(laminar) = 64 ./ Re(laminar);

f_turb = @(R) (1.8 .* log10(R) - 1.5).^(-2);

if any(transition(:))
    f2300 = 64 ./ 2300;
    f10000 = f_turb(10000);
    g = (Re(transition) - 2300) ./ (10000 - 2300);
    fD(transition) = (1 - g) .* f2300 + g .* f10000;
end

if any(turbulent(:))
    fD(turbulent) = f_turb(Re(turbulent));
end

fD(~builtin('isfinite', fD) | fD <= 0) = NaN;
end


function [costIndex, nTubes, rawTubeLength_mm] = calcTubeSupplyCostIndex(DO_mm, model_outer, costParams, materialName)
DO = double(DO_mm);
nTubes = calcTubeCountInFootprint(DO, model_outer, costParams);

effectiveLength_mm = ...
    (double(costParams.active_length_mm) + double(costParams.overhang_total_mm)) .* ...
    double(costParams.scrap_factor);
if ~builtin('isfinite', effectiveLength_mm) || effectiveLength_mm <= 0
    error('Cost model effective tube length must be positive.');
end

materialName = lower(string(materialName));
if any(materialName == ["al", "alu", "aluminum", "aluminium"])
    refIndex = double(costParams.reference_index_Al);
elseif any(materialName == ["pa", "poly", "polymer", "polyamide"])
    refIndex = double(costParams.reference_index_Poly);
else
    error('Unknown cost material: %s', materialName);
end

nRef = calcTubeCountInFootprint(double(costParams.reference_do_mm), model_outer, costParams);
if ~builtin('isfinite', nRef) || nRef <= 0
    error('Cost model reference tube count must be positive.');
end

rawTubeLength_mm = nTubes .* effectiveLength_mm;
referenceRawLength_mm = nRef .* effectiveLength_mm;
costPerRawLengthIndex = refIndex ./ referenceRawLength_mm;
costIndex = rawTubeLength_mm .* costPerRawLengthIndex;
costIndex(~builtin('isfinite', DO) | DO <= 0) = NaN;
end


function nTubes = calcTubeCountInFootprint(DO_mm, model_outer, costParams)
DO = double(DO_mm);
a = double(model_outer.a_pitch_transverse);
b = double(model_outer.b_pitch_longitudinal);
dRef = double(costParams.reference_do_mm);

if any([a b dRef] <= 0) || any(~builtin('isfinite', [a b dRef]))
    error('Cost model pitch ratios and reference diameter must be positive.');
end

footprintTransverse_mm = double(costParams.reference_n_transverse) .* a .* dRef;
footprintLongitudinal_mm = double(costParams.reference_n_longitudinal) .* b .* dRef;

S_T_mm = a .* DO;
S_L_mm = b .* DO;
nTransverse = floor(footprintTransverse_mm ./ S_T_mm);
nLongitudinal = floor(footprintLongitudinal_mm ./ S_L_mm);
nTransverse = max(nTransverse, 0);
nLongitudinal = max(nLongitudinal, 0);

arrangement = lower(string(costParams.arrangement));
if any(arrangement == ["inline", "unversetzt"])
    nTubes = nTransverse .* nLongitudinal;
elseif any(arrangement == ["staggered", "versetzt"])
    nRowsFull = ceil(nLongitudinal ./ 2);
    nRowsShifted = floor(nLongitudinal ./ 2);
    nTransverseShifted = floor((footprintTransverse_mm - 0.5 .* S_T_mm) ./ S_T_mm);
    nTransverseShifted = max(nTransverseShifted, 0);
    nTubes = nRowsFull .* nTransverse + nRowsShifted .* nTransverseShifted;
else
    error('Unknown tube arrangement: %s', arrangement);
end

bad = ~builtin('isfinite', DO) | DO <= 0 | ...
    ~builtin('isfinite', nTransverse) | ~builtin('isfinite', nLongitudinal);
nTubes(bad) = NaN;
end


function Z = applyMask2D(Z, mask)
Z(mask) = NaN;
end


%% ============================================================
%  Helpers carried over from V7 (unchanged unless noted)
% ============================================================
function setPresentationDefaults(params)
set(groot, ...
    'defaultFigureColor',   'w', ...
    'defaultAxesFontName',  params.font_name, ...
    'defaultAxesFontSize',  params.font_size, ...
    'defaultTextFontName',  params.font_name, ...
    'defaultTextFontSize',  params.font_size, ...
    'defaultTextInterpreter', 'tex', ...
    'defaultLegendFontName', params.font_name, ...
    'defaultLegendFontSize', params.font_size, ...
    'defaultLegendInterpreter', 'tex', ...
    'defaultAxesTickLabelInterpreter', 'tex');
try
    set(groot, ...
        'defaultColorbarFontName', params.font_name, ...
        'defaultColorbarFontSize', params.font_size);
catch, end
end


function fig = createPptFigure(params, figName, figureSizeCm)
if nargin < 3 || isempty(figureSizeCm)
    figureSizeCm = params.single_panel_figure_size_cm;
end
fig = figure('Name', figName, 'Color', 'w', ...
    'Units', 'centimeters', ...
    'Position', [1 1 figureSizeCm(1) figureSizeCm(2)], ...
    'PaperUnits', 'centimeters', ...
    'PaperSize',  figureSizeCm, ...
    'PaperPosition', [0 0 figureSizeCm(1) figureSizeCm(2)]);
set(fig, 'Renderer', 'opengl');
end


function applyPresentationStyle(fig, params)
fontObjs = findall(fig, '-property', 'FontName');
for ii = 1:numel(fontObjs)
    try, set(fontObjs(ii), 'FontName', params.font_name); catch, end
end
sizeObjs = findall(fig, '-property', 'FontSize');
for ii = 1:numel(sizeObjs)
    try
        if strcmp(get(sizeObjs(ii), 'Tag'), 'ManualContourLabel')
            continue;
        end
        if get(sizeObjs(ii), 'FontSize') < params.font_size
            set(sizeObjs(ii), 'FontSize', params.font_size);
        end
    catch, end
end
ax = findall(fig, 'Type', 'axes');
for ii = 1:numel(ax)
    set(ax(ii), 'FontName', params.font_name, ...
        'FontSize', params.font_size, ...
        'LineWidth', params.axis_line_width, ...
        'Layer', 'bottom');
end
drawnow;
refreshInterruptedContourLines(fig);
end


function styleAxes(ax, params)
set(ax, 'FontName', params.font_name, 'FontSize', params.font_size, ...
    'LineWidth', params.axis_line_width, ...
    'Layer', 'bottom');
end


function ht = addPanelTitle(ax, labelText, params, fontWeight)
if nargin < 4 || strlength(string(fontWeight)) == 0
    fontWeight = 'normal';
end
ht = title(ax, labelText, ...
    'FontName', params.font_name, ...
    'FontSize', params.font_size, ...
    'FontWeight', fontWeight, ...
    'Interpreter', 'tex');

try
    set(ht, 'Units', 'normalized');
    pos = get(ht, 'Position');
    pos(2) = params.panel_title_y_norm;
    pos(3) = 0;
    set(ht, 'Position', pos, 'VerticalAlignment', 'bottom');
catch
end
end


function finishMapLayering(ax)
set(ax, 'Layer', 'bottom');
try
    uistack(findall(ax, 'Tag', 'TechLimitLineUnderlay'), 'top');
    uistack(findall(ax, 'Tag', 'TechLimitLine'), 'top');
catch
end
try
    uistack(findall(ax, 'Tag', 'CrossSectionSketch'), 'top');
catch
end
try
    uistack(findall(ax, 'Tag', 'ValidatedReferencePoint'), 'top');
catch
end
try
    uistack(findall(ax, 'Tag', 'ManualContourLabel'), 'top');
catch
end
end


function plotValidatedCoolerReferencePoint(ax, params)
if ~isfield(params, 'validated_ref')
    return;
end

xRef = params.validated_ref.do_mm;
yRef = params.validated_ref.tau_pct;

xl = xlim(ax);
yl = ylim(ax);

if xRef < xl(1) || xRef > xl(2) || yRef < yl(1) || yRef > yl(2)
    return;
end

plot(ax, xRef, yRef, ...
    params.validated_ref.marker, ...
    'Color', params.validated_ref.color, ...
    'MarkerSize', params.validated_ref.marker_size, ...
    'LineWidth', params.validated_ref.line_width, ...
    'HandleVisibility', 'off', ...
    'Tag', 'ValidatedReferencePoint');

if isfield(params.validated_ref, 'show_label') && params.validated_ref.show_label
    text(ax, xRef .* 1.05, yRef, 'validated Al ref.', ...
        'Color', params.validated_ref.color, ...
        'FontName', params.font_name, ...
        'FontSize', max(params.font_size - 4, 8), ...
        'Interpreter', 'tex', ...
        'HorizontalAlignment', 'left', ...
        'VerticalAlignment', 'middle', ...
        'HandleVisibility', 'off', ...
        'Tag', 'ValidatedReferencePoint');
end
end


function styleTitleObject(h, params)
set(h, 'FontName', params.font_name, 'FontSize', params.title_font_size, 'FontWeight', 'bold');
end


function [z_lo, z_hi] = robustLogLimits(params, varargin)
zv = [];
for ii = 1:numel(varargin)
    Zi = double(varargin{ii});
    Zi = Zi(builtin('isfinite', Zi) & Zi > 0);
    zv = [zv; Zi(:)]; %#ok<AGROW>
end
if isempty(zv), error('robustLogLimits: no positive finite values.'); end
z_lo = max(prctile(zv, params.color_prct(1)), min(zv));
z_hi = min(prctile(zv, params.color_prct(2)), max(zv));
if z_hi <= z_lo, z_lo = min(zv); z_hi = max(zv); end
end


function styleLogColorbar(cb, z_lo, z_hi, cb_label, params)
[tickPos, tickLbl] = makeLogColorbarTicks(z_lo, z_hi);
cb.Ticks      = tickPos;
cb.TickLabels = tickLbl;
cb.Label.String   = cb_label;
cb.FontName       = params.font_name;
cb.FontSize       = params.font_size;
cb.Label.FontName = params.font_name;
cb.Label.FontSize = params.font_size;
cb.Label.Interpreter = 'tex';
try, cb.TickLabelRotation = 0; catch, end
end


function reverseColorbarScale(cb)
try
    cb.Direction = 'reverse';
catch
    try
        if lower(string(cb.Orientation)) == "horizontal"
            set(cb, 'XDir', 'reverse');
        else
            set(cb, 'YDir', 'reverse');
        end
    catch
        warning('Waermedurchgang:ColorbarReverseUnsupported', ...
            'Could not reverse the colorbar scale.');
    end
end
end


function setLogColorbarTicksFromLevels(cb, levels, z_lo, z_hi)
tickVals = unique(double(levels(:).'));
tickVals = tickVals(builtin('isfinite', tickVals) & tickVals > 0);
tol = 1e-10 .* max(1, max(abs([z_lo z_hi])));
tickVals = tickVals(tickVals >= z_lo - tol & tickVals <= z_hi + tol);
if isempty(tickVals)
    return;
end
cb.Ticks = log10(tickVals);
cb.TickLabels = arrayfun(@formatPlainNumberLabel, tickVals, 'UniformOutput', false);
try, cb.TickLabelRotation = 0; catch, end
end


function [tickPos, tickLbl] = makeLogColorbarTicks(z_lo, z_hi)
eMin     = floor(log10(z_lo));
eMax     = ceil(log10(z_hi));
tickVals = 10.^(eMin:eMax);
tickVals = sort([tickVals, 2*tickVals, 5*tickVals]);
tol = 1e-10 .* max(1, max(abs([z_lo z_hi])));
tickVals = unique(tickVals(tickVals >= z_lo - tol & tickVals <= z_hi + tol));
tickPos  = log10(tickVals);
tickLbl  = arrayfun(@formatPlainNumberLabel, tickVals, 'UniformOutput', false);
end


function label = formatPlainNumberLabel(value)
value = double(value);
if ~builtin('isfinite', value)
    label = '';
    return;
end
if abs(value) >= 1
    label = sprintf('%.0f', value);
else
    label = sprintf('%.4f', value);
    label = regexprep(label, '0+$', '');
    label = regexprep(label, '\.$', '');
end
end


function cmap = getProjectColormap(params)
try
    cmap = slanCM(params.colormap_name);
catch
    cmap = turbo(256);
    warning('Waermedurchgang:ColormapFallback', 'slanCM unavailable, using turbo.');
end
end


function applyProjectColormap(target, params)
colormap(target, getProjectColormap(params));
end


function levels = makeKContourLevels_V8(varargin)
% ~6 logarithmically-spaced contour levels across all input data.
zAll = [];
for ii = 1:nargin
    Z = double(varargin{ii});
    zAll = [zAll; Z(builtin('isfinite', Z) & Z > 0)]; %#ok<AGROW>
end
if isempty(zAll), levels = []; return; end
raw = 10.^linspace(log10(min(zAll)), log10(max(zAll)), 7);
% Round to 2 significant figures
levels = arrayfun(@(x) round(x, 2, 'significant'), raw);
levels = unique(levels);
end


function levels = makeKContourLevels(Z)
Z = double(Z);
zv = Z(builtin('isfinite', Z) & Z > 0);
if isempty(zv), levels = []; return; end
lo = ceil(min(zv)/10)*10;  hi = floor(max(zv)/10)*10;
if hi < lo, levels = []; return; end
levels = lo:10:hi;
levels = levels(levels > min(zv) & levels < max(zv));
end


function levels = makeFixedContourLevels(step, varargin)
zAll = [];
for ii = 1:nargin-1
    Z = double(varargin{ii});
    zAll = [zAll; Z(builtin('isfinite', Z) & Z > 0)]; %#ok<AGROW>
end
if isempty(zAll), levels = []; return; end
lo = ceil(min(zAll) ./ step) .* step;
hi = floor(max(zAll) ./ step) .* step;
if hi < lo, levels = []; return; end
levels = lo:step:hi;
levels = levels(levels > min(zAll) & levels < max(zAll));
end


function levels = makeBurstPressureContourLevels(Z, step_bar)
if nargin < 2 || isempty(step_bar), step_bar = 100; end
Z  = double(Z);
zv = Z(builtin('isfinite', Z) & Z > 0);
if isempty(zv), levels = []; return; end
levels = step_bar:step_bar:(floor(max(zv)/step_bar)*step_bar);
levels = levels(levels > min(zv) & levels < max(zv));
end


function labelLevels = selectBarContourLabels(levels)
levels = unique(double(levels(:).'));
if isempty(levels), labelLevels = []; return; end
if max(levels) <= 120
    preferred = [5 10 20 30 50 75 100];
else
    preferred = [200 400 800 1200 1600 2000];
end
labelLevels = intersect(levels, preferred);
if isempty(labelLevels)
    idx = unique(round(linspace(1, numel(levels), min(7, numel(levels)))));
    labelLevels = levels(idx);
end
end


function labelLevels = selectSingleMapContourLabels(levels)
levels = unique(double(levels(:).'));
if isempty(levels), labelLevels = []; return; end
preferred = 100:100:max(levels);
labelLevels = intersect(levels, preferred);
if isempty(labelLevels)
    idx = unique(round(linspace(1, numel(levels), min(6, numel(levels)))));
    labelLevels = levels(idx);
end
end


function labelLevels = selectCostContourLabels(levels)
levels = unique(double(levels(:).'));
if isempty(levels), labelLevels = []; return; end
idx = unique(round(linspace(1, numel(levels), min(7, numel(levels)))));
labelLevels = levels(idx);
end


function levels = trimContourLevels(levels, Z)
Z = double(Z);
zv = Z(builtin('isfinite', Z));
if isempty(zv), levels = []; return; end
levels = levels(levels > min(zv) & levels < max(zv));
end


function plotReTransitionContour(ax, X_mm, Y_lin, ReMap, params)
if ~isfield(params, 're_transition_level') || isempty(params.re_transition_level)
    return;
end
lvl = double(params.re_transition_level);
Z = double(ReMap);
zv = Z(builtin('isfinite', Z));
if isempty(zv) || lvl <= min(zv) || lvl >= max(zv)
    return;
end
contour(ax, X_mm, Y_lin, Z, [lvl lvl], ...
    'LineStyle', '--', ...
    'Color', [0 0 0], ...
    'LineWidth', 1.35, ...
    'HandleVisibility', 'off', ...
    'Tag', 'ReTransitionLine');
end


function levels = makeSteppedShareLevels(Z, step)
Z = double(Z);
zv = Z(builtin('isfinite', Z));
if isempty(zv), levels = []; return; end
lo = ceil(max(min(zv), 0) ./ step) .* step;
hi = floor(min(max(zv), 100) ./ step) .* step;
if hi < lo, levels = []; return; end
levels = lo:step:hi;
levels = levels(levels > min(zv) & levels < max(zv));
levels = unique(round(levels ./ step) .* step, 'stable');
end


function levels = makeSparseShareContourLevels(Z, useSmallPercentStep)
Z = double(Z);
zv = Z(builtin('isfinite', Z));
if isempty(zv), levels = []; return; end
zMin = max(min(zv), 0);
zMax = min(max(zv), 100);
if zMax <= zMin, levels = []; return; end

if useSmallPercentStep
    stepCandidates = [0.005 0.01 0.02 0.05 0.1 0.2 0.5];
else
    stepCandidates = [1 2 5 10 20 25];
end

targetCount = 11;
bestLevels = [];
bestScore = inf;
for ii = 1:numel(stepCandidates)
    cand = makeSteppedShareLevels(Z, stepCandidates(ii));
    n = numel(cand);
    if n == 0
        continue;
    end
    inTargetRange = (n >= 8 && n <= 15);
    rangePenalty = 0;
    if ~inTargetRange
        rangePenalty = 100 + min(abs(n - 8), abs(n - 15));
    end
    score = rangePenalty + abs(n - targetCount);
    if score < bestScore
        bestScore = score;
        bestLevels = cand;
    end
end
levels = bestLevels;
end


function labelLevels = selectSparseShareLabelLevels(levels, targetCount)
levels = unique(double(levels(:).'), 'stable');
if isempty(levels)
    labelLevels = [];
    return;
end
targetCount = min(max(3, targetCount), 5);
nLabels = min(targetCount, numel(levels));
idx = unique(round(linspace(1, numel(levels), nLabels)));
labelLevels = levels(idx);
end


function labels = addContourLabelsAlongLines(ax, C, hc, labelLevels, params, ...
        fontSize, labelSpacing, labelMode, protectedLineTag, protectTaggedLines)
% Place transparent labels along the local contour tangent. The contour
% geometry is redrawn with real gaps under the final text extents.
if nargin < 8 || isempty(labelMode), labelMode = "plain"; end
if nargin < 9, protectedLineTag = ""; end
if nargin < 10, protectTaggedLines = true; end
if nargin < 4 || isempty(labelLevels)
    labelLevels = uniqueContourLevels(C);
else
    labelLevels = unique(double(labelLevels(:).'));
end
labelSpacing = max(1, double(labelSpacing)); %#ok<NASGU>

segments = parseContourMatrix(C);
labels = gobjects(0);
if isempty(segments) || isempty(labelLevels)
    return;
end

try, set(hc, 'ShowText', 'off'); catch, end
occupiedExtents = protectedLabelExtents(ax, params);
if lower(string(labelMode)) == "percent"
    minGap = 0.010;
elseif strlength(string(protectedLineTag)) > 0
    minGap = 0.008;
else
    minGap = 0.024;
end
for ii = 1:numel(labelLevels)
    lvl = labelLevels(ii);
    candidates = segments(abs([segments.level] - lvl) < max(1e-9, 1e-9*abs(lvl)));
    if isempty(candidates), continue; end

    targetY = requestedContourLabelTargetY(ax, params, lvl);
    targetX = requestedContourLabelTargetX(params, lvl);
    candPts = makeContourLabelCandidates(ax, candidates, ii, ...
        numel(labelLevels), targetY, targetX);
    if isempty(candPts), continue; end

    labelText = makeContourLabelText(lvl, labelMode);
    placed = false;
    for cc = 1:size(candPts, 1)
        hTxt = createPathAlignedContourLabel(ax, candPts(cc, 1), ...
            candPts(cc, 2), candPts(cc, 4), labelText, lvl, params, fontSize);
        drawnow limitrate;
        if ~isvalid(hTxt)
            continue;
        end
        try
            ext = paddedTextExtent(hTxt, minGap);
        catch
            if isvalid(hTxt), delete(hTxt); end
            continue;
        end
        overlapsProtectedLine = false;
        if protectTaggedLines
            protectedTags = unique([string(protectedLineTag), "TechLimitLine"]);
            overlapsProtectedLine = extentIntersectsTaggedLines(ax, ext, protectedTags);
        end
        if isTextExtentInsideAxes(ext) && ...
                ~anyExtentsOverlap(ext, occupiedExtents) && ~overlapsProtectedLine
            labels(end+1, 1) = hTxt; %#ok<AGROW>
            occupiedExtents(end+1, :) = ext; %#ok<AGROW>
            placed = true;
            break;
        end
        delete(hTxt);
    end
    if ~placed
        continue;
    end
end

if ~isempty(labels)
    renderInterruptedContourLines(ax, C, hc, labels);
    try, uistack(labels, 'top'); catch, end
end
end


function labels = addContourCalloutLabels(ax, C, labelLevels, params, fontSize, labelMode)
segments = parseContourMatrix(C);
labels = gobjects(0);
configuredLevels = double(params.ratio_pct_callout_levels(:).');
configuredPositions = double(params.ratio_pct_callout_positions);
if size(configuredPositions, 1) ~= numel(configuredLevels) || ...
        size(configuredPositions, 2) ~= 2
    error('Percent-contour callout positions must be N-by-2 for N levels.');
end

for ii = 1:numel(labelLevels)
    lvl = labelLevels(ii);
    configIdx = find(abs(configuredLevels - lvl) < ...
        max(1e-9, 1e-9*abs(lvl)), 1, 'first');
    candidates = segments(abs([segments.level] - lvl) < ...
        max(1e-9, 1e-9*abs(lvl)));
    if isempty(configIdx) || isempty(candidates), continue; end

    labelPos = configuredPositions(configIdx, :);
    leaderStart = labelPos + [0.045 0];
    contourXn = [];
    contourYn = [];
    for jj = 1:numel(candidates)
        [xn, yn] = normalizeAxesCoordinates(ax, candidates(jj).x, candidates(jj).y);
        valid = builtin('isfinite', xn) & builtin('isfinite', yn);
        contourXn = [contourXn xn(valid)]; %#ok<AGROW>
        contourYn = [contourYn yn(valid)]; %#ok<AGROW>
    end
    if isempty(contourXn), continue; end
    [~, anchorIdx] = min((contourXn - leaderStart(1)).^2 + ...
        (contourYn - leaderStart(2)).^2);
    anchor = [contourXn(anchorIdx) contourYn(anchorIdx)];
    [leaderX, leaderY] = denormalizeAxesCoordinates(ax, ...
        [leaderStart(1) anchor(1)], [leaderStart(2) anchor(2)]);
    line(ax, leaderX, leaderY, ...
        'Color', [0.12 0.12 0.12], ...
        'LineWidth', 0.8, ...
        'HandleVisibility', 'off', ...
        'Clipping', 'on', ...
        'Tag', 'ContourCalloutLeader');

    labelText = makeContourLabelText(lvl, labelMode);
    hTxt = createPathAlignedContourLabel(ax, labelPos(1), labelPos(2), ...
        0, labelText, lvl, params, fontSize);
    set(hTxt, 'BackgroundColor', 'w', 'Margin', 0.02);
    labels(end+1, 1) = hTxt; %#ok<AGROW>
end
end


function labels = forcePlaceContourLabels(ax, C, labelLevels, params, fontSize, labelMode)
% Deterministic fallback for short required contours. Prefer a collision-free
% candidate; if none exists, use the candidate with the least text overlap.
segments = parseContourMatrix(C);
labels = gobjects(0);
occupiedExtents = protectedLabelExtents(ax, params);
for ii = 1:numel(labelLevels)
    lvl = labelLevels(ii);
    candidates = segments(abs([segments.level] - lvl) < max(1e-9, 1e-9*abs(lvl)));
    if isempty(candidates), continue; end
    targetY = requestedContourLabelTargetY(ax, params, lvl);
    candPts = makeContourLabelCandidates(ax, candidates, ii, ...
        numel(labelLevels), targetY);
    if isempty(candPts), continue; end

    labelText = makeContourLabelText(lvl, labelMode);
    bestScore = inf;
    bestCandidate = [];
    for cc = 1:size(candPts, 1)
        hTxt = createPathAlignedContourLabel(ax, candPts(cc, 1), ...
            candPts(cc, 2), candPts(cc, 4), labelText, lvl, params, fontSize);
        drawnow limitrate;
        if ~isvalid(hTxt), continue; end
        try
            ext = paddedTextExtent(hTxt, 0.004);
        catch
            delete(hTxt);
            continue;
        end
        if isTextExtentInsideAxes(ext)
            score = 1e6 .* textExtentOverlapArea(ext, occupiedExtents) + ...
                candPts(cc, 3);
            if score < bestScore
                bestScore = score;
                bestCandidate = candPts(cc, :);
            end
        end
        delete(hTxt);
    end
    if isempty(bestCandidate), continue; end

    hTxt = createPathAlignedContourLabel(ax, bestCandidate(1), ...
        bestCandidate(2), bestCandidate(4), labelText, lvl, params, fontSize);
    labels(end+1, 1) = hTxt; %#ok<AGROW>
    try
        occupiedExtents(end+1, :) = paddedTextExtent(hTxt, 0.004); %#ok<AGROW>
    catch
    end
end
end


function area = textExtentOverlapArea(ext, occupiedExtents)
if isempty(occupiedExtents)
    area = 0;
    return;
end
left = max(ext(1), occupiedExtents(:, 1));
right = min(ext(1) + ext(3), occupiedExtents(:, 1) + occupiedExtents(:, 3));
bottom = max(ext(2), occupiedExtents(:, 2));
top = min(ext(2) + ext(4), occupiedExtents(:, 2) + occupiedExtents(:, 4));
area = sum(max(0, right - left) .* max(0, top - bottom));
end


function hTxt = createPathAlignedContourLabel(ax, xn, yn, angleDeg, ...
        labelText, contourLevel, params, fontSize)
labelInterpreter = 'tex';
if contains(string(labelText), '\%')
    labelInterpreter = 'latex';
end
hTxt = text(ax, xn, yn, labelText, ...
    'Units', 'normalized', ...
    'Interpreter', labelInterpreter, ...
    'FontName', params.font_name, ...
    'FontSize', fontSize, ...
    'Color', [0.12 0.12 0.12], ...
    'HorizontalAlignment', 'center', ...
    'VerticalAlignment', 'middle', ...
    'Rotation', normalizeReadableAngle(angleDeg), ...
    'BackgroundColor', 'none', ...
    'Margin', 0.01, ...
    'EdgeColor', 'none', ...
    'LineWidth', 0.1, ...
    'Clipping', 'on', ...
    'HandleVisibility', 'on', ...
    'Tag', 'ManualContourLabel', ...
    'UserData', struct('ContourLevel', contourLevel));
end


function renderInterruptedContourLines(ax, C, hc, labels)
% Reconstruct the contour paths and remove every portion that lies below a
% label. This is independent of the filled-map color and remains vectorial.
if isempty(C) || isempty(hc) || ~isgraphics(hc)
    return;
end

style = contourRenderStyle(hc);
drawInterruptedContourGeometry(ax, C, style, labels);
set(hc, 'Visible', 'off');
end


function hLine = drawInterruptedContourGeometry(ax, C, style, labels)
gapMasks = struct('OriginPx', {}, 'CosAngle', {}, 'SinAngle', {}, ...
    'XLimitsPx', {}, 'YLimitsPx', {});
for ii = 1:numel(labels)
    if ~isvalid(labels(ii)), continue; end
    try
        gapMasks(end+1) = rotatedTextGapMask(ax, labels(ii), 0.006, 0.92); %#ok<AGROW>
    catch
    end
end
if isempty(gapMasks)
    hLine = gobjects(0);
    return;
end
axPixels = getpixelposition(ax, true);
widthPx = max(axPixels(3), 1);
heightPx = max(axPixels(4), 1);

segments = parseContourMatrix(C);
xAll = [];
yAll = [];
for ii = 1:numel(segments)
    [xDense, yDense, xn, yn] = densifyContourSegment( ...
        ax, segments(ii).x, segments(ii).y, 0.0025);
    if isempty(xDense)
        continue;
    end
    inGap = false(size(xn));
    xPx = xn .* widthPx;
    yPx = yn .* heightPx;
    for jj = 1:numel(gapMasks)
        mask = gapMasks(jj);
        dx = xPx - mask.OriginPx(1);
        dy = yPx - mask.OriginPx(2);
        xLocal = dx .* mask.CosAngle + dy .* mask.SinAngle;
        yLocal = -dx .* mask.SinAngle + dy .* mask.CosAngle;
        inGap = inGap | (xLocal >= mask.XLimitsPx(1) & ...
            xLocal <= mask.XLimitsPx(2) & ...
            yLocal >= mask.YLimitsPx(1) & ...
            yLocal <= mask.YLimitsPx(2));
    end
    xDense(inGap) = NaN;
    yDense(inGap) = NaN;
    xAll = [xAll xDense NaN]; %#ok<AGROW>
    yAll = [yAll yDense NaN]; %#ok<AGROW>
end

if isempty(xAll)
    hLine = gobjects(0);
    return;
end
hLine = line(ax, xAll, yAll, ...
    'Color', style.Color, ...
    'LineWidth', style.LineWidth, ...
    'LineStyle', style.LineStyle, ...
    'HandleVisibility', 'off', ...
    'Clipping', 'on', ...
    'Tag', style.Tag);
setappdata(hLine, 'InterruptedContourSource', ...
    struct('ContourMatrix', C, 'Style', style));
end


function mask = rotatedTextGapMask(ax, hTxt, pad, heightScale)
% Measure the unrotated text and rotate its exclusion mask in display space.
axPixels = getpixelposition(ax, true);
widthPx = max(axPixels(3), 1);
heightPx = max(axPixels(4), 1);

originalRotation = get(hTxt, 'Rotation');
restoreRotation = onCleanup(@() set(hTxt, 'Rotation', originalRotation));
set(hTxt, 'Rotation', 0);
drawnow limitrate;
ext = get(hTxt, 'Extent');
position = get(hTxt, 'Position');
clear restoreRotation;

originPx = [position(1) .* widthPx, position(2) .* heightPx];
xLimitsPx = ([ext(1), ext(1) + ext(3)] - position(1)) .* widthPx;
yLimitsPx = ([ext(2), ext(2) + ext(4)] - position(2)) .* heightPx;
xLimitsPx = xLimitsPx + [-pad .* widthPx, pad .* widthPx];
yLimitsPx = yLimitsPx + [-pad .* heightPx, pad .* heightPx];

yCenterPx = mean(yLimitsPx);
yLimitsPx = yCenterPx + (yLimitsPx - yCenterPx) .* heightScale;
angleDeg = normalizeReadableAngle(originalRotation);
mask = struct( ...
    'OriginPx', originPx, ...
    'CosAngle', cosd(angleDeg), ...
    'SinAngle', sind(angleDeg), ...
    'XLimitsPx', xLimitsPx, ...
    'YLimitsPx', yLimitsPx);
end


function refreshInterruptedContourLines(fig)
lines = findall(fig, 'Type', 'line');
for ii = 1:numel(lines)
    if ~isgraphics(lines(ii)) || ~isappdata(lines(ii), 'InterruptedContourSource')
        continue;
    end
    source = getappdata(lines(ii), 'InterruptedContourSource');
    ax = ancestor(lines(ii), 'axes');
    labels = findall(ax, 'Type', 'text', 'Tag', 'ManualContourLabel');
    delete(lines(ii));
    drawInterruptedContourGeometry(ax, source.ContourMatrix, source.Style, labels);
    finishMapLayering(ax);
end
end


function style = contourRenderStyle(hc)
style = struct('Color', [0.12 0.12 0.12], ...
    'LineWidth', 0.75, 'LineStyle', '-', 'Tag', 'InterruptedContourLine');
try, style.Color = get(hc, 'Color'); catch, end
try, style.LineWidth = get(hc, 'LineWidth'); catch, end
try, style.LineStyle = get(hc, 'LineStyle'); catch, end
try
    sourceTag = get(hc, 'Tag');
    if ~isempty(sourceTag), style.Tag = sourceTag; end
catch
end
end


function [xDense, yDense, xnDense, ynDense] = densifyContourSegment(ax, x, y, maxStep)
[xn, yn] = normalizeAxesCoordinates(ax, x, y);
finite = builtin('isfinite', xn) & builtin('isfinite', yn);
xn = xn(finite);
yn = yn(finite);
if numel(xn) < 2
    xDense = []; yDense = []; xnDense = []; ynDense = [];
    return;
end

s = [0 cumsum(hypot(diff(xn), diff(yn)))];
[s, keep] = unique(s, 'stable');
xn = xn(keep);
yn = yn(keep);
if numel(s) < 2 || s(end) <= 0
    xDense = []; yDense = []; xnDense = []; ynDense = [];
    return;
end
nDense = max(2, ceil(s(end) ./ maxStep) + 1);
sDense = linspace(0, s(end), nDense);
xnDense = interp1(s, xn, sDense, 'linear');
ynDense = interp1(s, yn, sDense, 'linear');
[xDense, yDense] = denormalizeAxesCoordinates(ax, xnDense, ynDense);
end


function angleDeg = normalizeReadableAngle(angleDeg)
angleDeg = mod(double(angleDeg) + 90, 180) - 90;
if abs(angleDeg + 90) < 1e-10
    angleDeg = 90;
end
end


function tf = extentIntersectsTaggedLines(ax, ext, protectedLineTag)
tf = false;
protectedLineTags = string(protectedLineTag);
protectedLineTags = protectedLineTags(strlength(protectedLineTags) > 0);
if isempty(protectedLineTags)
    return;
end
lineObjects = gobjects(0);
for tt = 1:numel(protectedLineTags)
    lineObjects = [lineObjects; findall(ax, 'Type', 'line', ...
        'Tag', char(protectedLineTags(tt)))]; %#ok<AGROW>
end
if isempty(lineObjects)
    return;
end

left = ext(1);
right = ext(1) + ext(3);
bottom = ext(2);
top = ext(2) + ext(4);
for ii = 1:numel(lineObjects)
    x = get(lineObjects(ii), 'XData');
    y = get(lineObjects(ii), 'YData');
    [xn, yn] = normalizeAxesCoordinates(ax, x, y);
    finite = builtin('isfinite', xn) & builtin('isfinite', yn);
    for jj = 1:numel(xn)-1
        if ~finite(jj) || ~finite(jj+1)
            continue;
        end
        segLength = hypot(xn(jj+1) - xn(jj), yn(jj+1) - yn(jj));
        nProbe = max(2, ceil(segLength ./ 0.004) + 1);
        alpha = linspace(0, 1, nProbe);
        xProbe = xn(jj) + alpha .* (xn(jj+1) - xn(jj));
        yProbe = yn(jj) + alpha .* (yn(jj+1) - yn(jj));
        if any(xProbe >= left & xProbe <= right & yProbe >= bottom & yProbe <= top)
            tf = true;
            return;
        end
    end
end
end


function tf = isTextExtentInsideAxes(ext)
left = ext(1);
right = ext(1) + ext(3);
bottom = ext(2);
top = ext(2) + ext(4);
tf = left >= 0.01 && right <= 0.99 && bottom >= 0.01 && top <= 0.99;
end


function extents = protectedLabelExtents(ax, params)
% Keep contour labels off the reference marker and tube sketches.
extents = zeros(0, 4);
existingLabels = findall(ax, 'Type', 'text', 'Tag', 'ManualContourLabel');
for ii = 1:numel(existingLabels)
    if ~isvalid(existingLabels(ii)) || ~strcmpi(get(existingLabels(ii), 'Units'), 'normalized')
        continue;
    end
    try
        extents(end+1, :) = paddedTextExtent(existingLabels(ii), 0.018); %#ok<AGROW>
    catch
    end
end

sketchObjects = findall(ax, 'Tag', 'CrossSectionSketch');
for ii = 1:numel(sketchObjects)
    try
        xData = get(sketchObjects(ii), 'XData');
        yData = get(sketchObjects(ii), 'YData');
        [xn, yn] = normalizeAxesCoordinates(ax, xData, yData);
        valid = builtin('isfinite', xn) & builtin('isfinite', yn);
        if any(valid)
            pad = 0.014;
            extents(end+1, :) = [min(xn(valid)) - pad, min(yn(valid)) - pad, ...
                range(xn(valid)) + 2.*pad, range(yn(valid)) + 2.*pad]; %#ok<AGROW>
        end
    catch
    end
end

hasDesignBoundaries = ~isempty(findall(ax, 'Type', 'line', 'Tag', 'DesignBoundaryLine'));
hasReferencePoint = ~isempty(findall(ax, 'Tag', 'ValidatedReferencePoint'));
if isfield(params, 'validated_ref') && (~hasDesignBoundaries || hasReferencePoint)
    extents = addProtectedPointExtent(extents, ax, ...
        params.validated_ref.do_mm, params.validated_ref.tau_pct, 0.16, 0.12);
end

end


function extents = addProtectedPointExtent(extents, ax, xData, yData, boxW, boxH)
[xn, yn] = normalizeAxesCoordinates(ax, xData, yData);
if ~builtin('isfinite', xn) || ~builtin('isfinite', yn)
    return;
end
if xn < -boxW || xn > 1 + boxW || yn < -boxH || yn > 1 + boxH
    return;
end
extents(end+1, :) = [xn - boxW./2, yn - boxH./2, boxW, boxH]; %#ok<AGROW>
end


function targetY = requestedContourLabelTargetY(ax, params, level)
targetY = [];
if ~isfield(params, 'ratio_pct_label_levels') || ...
        ~isfield(params, 'ratio_pct_label_target_y_pct')
    return;
end
levels = double(params.ratio_pct_label_levels(:).');
targets = double(params.ratio_pct_label_target_y_pct(:).');
if numel(levels) ~= numel(targets)
    return;
end
idx = find(abs(levels - level) < max(1e-9, 1e-9*abs(level)), 1, 'first');
if isempty(idx), return; end
yLim = ylim(ax);
targetY = (targets(idx) - yLim(1)) ./ diff(yLim);
end


function targetX = requestedContourLabelTargetX(params, level)
targetX = [];
if ~isfield(params, 'ratio_pct_label_levels') || ...
        ~isfield(params, 'ratio_pct_label_target_x_norm')
    return;
end
levels = double(params.ratio_pct_label_levels(:).');
targets = double(params.ratio_pct_label_target_x_norm(:).');
if numel(levels) ~= numel(targets)
    return;
end
idx = find(abs(levels - level) < max(1e-9, 1e-9*abs(level)), 1, 'first');
if isempty(idx) || ~builtin('isfinite', targets(idx)), return; end
targetX = targets(idx);
end


function candPts = makeContourLabelCandidates(ax, candidates, levelIndex, nLevels, targetYOverride, targetXOverride)
candPts = zeros(0, 4);
hasTargetOverride = nargin >= 5 && ~isempty(targetYOverride);
if nargin >= 6 && ~isempty(targetXOverride)
    targetX = targetXOverride;
else
    targetX = 0.52;
end
if hasTargetOverride
    targetY = targetYOverride;
else
    targetY = 0.18 + 0.64 * levelIndex / max(nLevels + 1, 2);
end
if nLevels >= 6 && ~hasTargetOverride
    allY = [];
    for ii = 1:numel(candidates)
        [~, yn] = normalizeAxesCoordinates(ax, candidates(ii).x, candidates(ii).y);
        allY = [allY yn(builtin('isfinite', yn))]; %#ok<AGROW>
    end
    if ~isempty(allY)
        yLo = min(allY);
        yHi = max(allY);
        stagger = [0.28 0.68 0.43 0.82 0.20 0.56];
        fraction = stagger(1 + mod(levelIndex - 1, numel(stagger)));
        targetY = yLo + fraction .* (yHi - yLo);
    end
end
segLen = arrayfun(@(s) contourSegmentLength(ax, s.x, s.y), candidates);
[~, segOrder] = sort(segLen, 'descend');
for ss = 1:numel(segOrder)
    seg = candidates(segOrder(ss));
    [xn, yn] = normalizeAxesCoordinates(ax, seg.x, seg.y);
    valid = builtin('isfinite', xn) & builtin('isfinite', yn) & ...
        xn > 0.07 & xn < 0.93 & yn > 0.07 & yn < 0.93;
    idxValid = find(valid);
    if numel(idxValid) < 3
        valid = builtin('isfinite', xn) & builtin('isfinite', yn) & ...
            xn > 0.03 & xn < 0.97 & yn > 0.03 & yn < 0.97;
        idxValid = find(valid);
    end
    if isempty(idxValid), continue; end

    keepCount = min(60, numel(idxValid));
    keepIdx = unique(round(linspace(1, numel(idxValid), keepCount)));
    idx = idxValid(keepIdx);
    score = (xn(idx) - targetX).^2 + 0.7 .* (yn(idx) - targetY).^2 + 0.03 .* (ss - 1);
    angleDeg = arrayfun(@(kk) contourLabelAngle(ax, xn, yn, kk), idx);
    candPts = [candPts; xn(idx).', yn(idx).', score(:), angleDeg(:)]; %#ok<AGROW>
end
if isempty(candPts), return; end
[~, order] = sort(candPts(:, 3), 'ascend');
candPts = candPts(order, :);
end


function angleDeg = contourLabelAngle(ax, xn, yn, idx)
finite = builtin('isfinite', xn) & builtin('isfinite', yn);
i1 = max(1, idx - 3);
i2 = min(numel(xn), idx + 3);
while i1 < idx && ~finite(i1), i1 = i1 + 1; end
while i2 > idx && ~finite(i2), i2 = i2 - 1; end
if i1 == i2 || ~finite(i1) || ~finite(i2)
    angleDeg = 0;
    return;
end

try
    axPixels = getpixelposition(ax, true);
    widthPx = max(axPixels(3), 1);
    heightPx = max(axPixels(4), 1);
catch
    widthPx = 1;
    heightPx = 1;
end
dx = (xn(i2) - xn(i1)) .* widthPx;
dy = (yn(i2) - yn(i1)) .* heightPx;
if abs(dx) + abs(dy) < eps
    angleDeg = 0;
else
    angleDeg = normalizeReadableAngle(atan2d(dy, dx));
end
end


function ext = paddedTextExtent(hTxt, pad)
ext = get(hTxt, 'Extent');
ext(1) = ext(1) - pad;
ext(2) = ext(2) - pad;
ext(3) = ext(3) + 2 .* pad;
ext(4) = ext(4) + 2 .* pad;
end


function tf = anyExtentsOverlap(ext, occupiedExtents)
if isempty(occupiedExtents)
    tf = false;
    return;
end
leftA = ext(1); rightA = ext(1) + ext(3);
bottomA = ext(2); topA = ext(2) + ext(4);
leftB = occupiedExtents(:, 1);
rightB = occupiedExtents(:, 1) + occupiedExtents(:, 3);
bottomB = occupiedExtents(:, 2);
topB = occupiedExtents(:, 2) + occupiedExtents(:, 4);
tf = any(leftA < rightB & rightA > leftB & bottomA < topB & topA > bottomB);
end


function levels = uniqueContourLevels(C)
levels = [];
idx = 1;
while idx < size(C, 2)
    levels(end+1) = C(1, idx); %#ok<AGROW>
    idx = idx + C(2, idx) + 1;
end
levels = unique(levels);
end


function segments = parseContourMatrix(C)
segments = struct('level', {}, 'x', {}, 'y', {});
idx = 1;
while idx < size(C, 2)
    lvl = C(1, idx);
    nPts = C(2, idx);
    if nPts > 1 && idx + nPts <= size(C, 2)
        x = C(1, idx+1:idx+nPts);
        y = C(2, idx+1:idx+nPts);
        segments(end+1).level = lvl; %#ok<AGROW>
        segments(end).x = x;
        segments(end).y = y;
    end
    idx = idx + nPts + 1;
end
end


function len = contourSegmentLength(ax, x, y)
[xn, yn] = normalizeAxesCoordinates(ax, x, y);
len = sum(hypot(diff(xn), diff(yn)), 'omitnan');
end


function [xn, yn] = normalizeAxesCoordinates(ax, x, y)
x = double(x); y = double(y);
xLim = get(ax, 'XLim');
yLim = get(ax, 'YLim');
if strcmpi(get(ax, 'XScale'), 'log')
    xn = (log10(x) - log10(xLim(1))) ./ diff(log10(xLim));
else
    xn = (x - xLim(1)) ./ diff(xLim);
end
yn = (y - yLim(1)) ./ diff(yLim);
end


function [x, y] = denormalizeAxesCoordinates(ax, xn, yn)
xLim = get(ax, 'XLim');
yLim = get(ax, 'YLim');
if strcmpi(get(ax, 'XScale'), 'log')
    x = 10.^(log10(xLim(1)) + xn .* diff(log10(xLim)));
else
    x = xLim(1) + xn .* diff(xLim);
end
y = yLim(1) + yn .* diff(yLim);
end


function txt = makeContourLabelText(v, mode)
mode = lower(string(mode));
if mode == "percentsigned"
    if v > 0
        txt = sprintf('+%.0f %%', v);
    elseif v < 0
        txt = sprintf('%.0f %%', v);
    else
        txt = '0 %';
    end
elseif mode == "percent"
    if abs(v - round(v)) < 1e-6
        txt = sprintf('%.0f %%', v);
    else
        txt = sprintf('%.3g %%', v);
    end
elseif any(mode == ["bar", "pressuredrop", "mm", "reynolds"])
    if abs(v - round(v)) < 1e-6
        txt = sprintf('%.0f', v);
    else
        txt = sprintf('%.3g', v);
    end
elseif mode == "cost"
    txt = sprintf('%.3g', v);
else
    if abs(v - round(v)) < 1e-6
        txt = sprintf('%.0f', v);
    else
        txt = sprintf('%.3g', v);
    end
end
end


function formatContourLabels(labels, mode)
if isempty(labels), return; end
mode = lower(string(mode));
for jj = 1:numel(labels)
    raw = string(labels(jj).String);
    numTxt = regexprep(raw, '[^0-9eE+\-\.]', '');
    v = str2double(numTxt);
    if isnan(v), continue; end

    labels(jj).String = makeContourLabelText(v, mode);
end
set(labels, ...
    'Interpreter', 'tex', ...
    'BackgroundColor', 'none', ...
    'Margin', 0.01, ...
    'EdgeColor', 'none', ...
    'LineWidth', 0.1);
try, uistack(labels, 'top'); catch, end
end


function drawVectorFilledMap(ax, X_mm, Y_lin, Z, params, fillLevels)
if nargin < 6 || isempty(fillLevels)
    zv = Z(builtin('isfinite', Z));
    if isempty(zv), return; end
    z_lo = min(zv);  z_hi = max(zv);
    if z_hi <= z_lo, z_hi = z_lo + eps(z_lo); end
    fillLevels = linspace(z_lo, z_hi, params.vector_fill_levels);
end
contourf(ax, X_mm, Y_lin, Z, fillLevels, 'LineStyle', 'none');
end


%% ============================================================
%  Helper: tech-limit lines — dark blue (Al) / dark green (Poly)
% ============================================================
function h = plotTechLimitLines(params, whichLines, showLegend, ax)
if nargin < 3, showLegend = true; end
if nargin < 4 || isempty(ax), ax = gca; end

whichLines = lower(string(whichLines));
showAl   = any(whichLines == ["al",   "both"]);
showPoly = any(whichLines == ["poly", "both"]);

da_vec = logspace(log10(params.x_mm_lim(1)), log10(params.x_mm_lim(2)), 500);
h = gobjects(0, 1);
names = {};

if showAl
    yAl = 100 .* params.tmin_Al_mm ./ da_vec;
    yAl(yAl < params.y_pct_lim(1) | yAl > params.y_pct_lim(2)) = NaN;
    if any(builtin('isfinite', yAl))
        % Continuous white underlay avoids wider white dash/dot blocks in vector export.
        plot(ax, da_vec, yAl, '-', 'Color', [1 1 1], ...
            'LineWidth', params.tech_line_width + 1.0, ...
            'HandleVisibility', 'off', ...
            'Tag', 'TechLimitLineUnderlay');
        h(end+1, 1) = plot(ax, da_vec, yAl, '--', ...
            'Color', params.tech_Al_color, ...
            'LineWidth', params.tech_line_width, ...
            'Tag', 'TechLimitLine');
        names{end+1} = sprintf('Al: {\\it t}_{\\rm{min}} = %.3g mm', params.tmin_Al_mm);
    end
end

if showPoly
    yPoly = 100 .* params.tmin_Poly_mm ./ da_vec;
    yPoly(yPoly < params.y_pct_lim(1) | yPoly > params.y_pct_lim(2)) = NaN;
    if any(builtin('isfinite', yPoly))
        plot(ax, da_vec, yPoly, '-', 'Color', [1 1 1], ...
            'LineWidth', params.tech_line_width + 1.0, ...
            'HandleVisibility', 'off', ...
            'Tag', 'TechLimitLineUnderlay');
        h(end+1, 1) = plot(ax, da_vec, yPoly, ':', ...
            'Color', params.tech_Poly_color, ...
            'LineWidth', params.tech_line_width, ...
            'Tag', 'TechLimitLine');
        names{end+1} = sprintf('Polymer: {\\it t}_{\\rm{min}} = %.3g mm', params.tmin_Poly_mm);
    end
end

if showLegend && ~isempty(h)
    lgd = legend(ax, h, names, 'Location', 'southwest');
    set(lgd, 'FontName', params.font_name, 'FontSize', params.font_size, ...
        'Interpreter', 'tex');
end
end


%% ============================================================
%  Helper: cross-section sketches (disabled in V8 via params)
% ============================================================
function plotCrossSectionSketches(ax, params)
if ~isfield(params,'show_cross_section_sketches') || ~params.show_cross_section_sketches
    return
end
daVals = params.cross_section_da_mm(:).';
yVals  = params.cross_section_y_pct(:).';
thetaFull    = linspace(0, 2*pi, 120);
thetaQuarter = linspace(pi/2, pi, 60);
yRange   = diff(params.y_pct_lim);
xLogRange = diff(log10(params.x_mm_lim));
axesRef  = params.cross_section_reference_axes_cm;
tubeColor = params.cross_section_color;
for yy = yVals
    innerScale = max(0, 1 - 2.*yy./100);
    for da = daVals
        logCenter = log10(da);
        sizeScale = da ./ params.cross_section_reference_da_mm;
        rY   = params.cross_section_radius_pct .* sizeScale;
        rLog = rY .* (xLogRange ./ yRange) .* (axesRef(2) ./ axesRef(1));
        if da >= params.cross_section_quarter_da_threshold_mm
            plotTubeQuarterSection(ax, logCenter, yy, rLog, rY, innerScale, thetaQuarter, tubeColor);
        else
            plotTubeFullSection(ax, logCenter, yy, rLog, rY, innerScale, thetaFull, tubeColor);
        end
    end
end
end

function plotTubeFullSection(ax, logCenter, yCenter, rLog, rY, innerScale, theta, tubeColor)
xO = 10.^(logCenter + rLog.*cos(theta));  yO = yCenter + rY.*sin(theta);
patch(ax, xO, yO, tubeColor, 'EdgeColor',tubeColor,'LineWidth',0.7, ...
    'Clipping','on','HandleVisibility','off','Tag','CrossSectionSketch');
xI = 10.^(logCenter + rLog.*innerScale.*cos(theta));  yI = yCenter + rY.*innerScale.*sin(theta);
patch(ax, xI, yI, [1 1 1], 'EdgeColor',tubeColor,'LineWidth',0.5, ...
    'Clipping','on','HandleVisibility','off','Tag','CrossSectionSketch');
end

function plotTubeQuarterSection(ax, logCenter, yCenter, rLog, rY, innerScale, theta, tubeColor)
xC = 10.^logCenter;
xOA = 10.^(logCenter + rLog.*cos(theta));  yOA = yCenter + rY.*sin(theta);
patch(ax,[xC,xOA,xC],[yCenter,yOA,yCenter],tubeColor,'EdgeColor',tubeColor, ...
    'LineWidth',0.7,'Clipping','on','HandleVisibility','off','Tag','CrossSectionSketch');
xIA = 10.^(logCenter + rLog.*innerScale.*cos(theta));  yIA = yCenter + rY.*innerScale.*sin(theta);
patch(ax,[xC,xIA,xC],[yCenter,yIA,yCenter],[1 1 1],'EdgeColor',tubeColor, ...
    'LineWidth',0.5,'Clipping','on','HandleVisibility','off','Tag','CrossSectionSketch');
end


%% ============================================================
%  Helper: export all open figures as SVG
% ============================================================
function exportGeneratedFigures(params)
if ~isfield(params,'export_figures') || ~params.export_figures, return; end
exportDir = params.export_dir;
if ~exist(exportDir,'dir'), mkdir(exportDir); end
if isfield(params,'clean_export_dir') && params.clean_export_dir
    deleteIfPresent(fullfile(exportDir, '*.svg'));
    deleteIfPresent(fullfile(exportDir, '*.pdf'));
    deleteIfPresent(fullfile(exportDir, '*.png'));
end
figs = findall(0,'Type','figure');
if isempty(figs), warning('No figures to export.'); return; end
[~, idx] = sort([figs.Number]);
figs = figs(idx);
nameMap = containers.Map( ...
    {'ko aluminum', 'ko polymer', ...
     'bundle kA aluminum', 'bundle kA polymer', 'bundle kA alu pa portrait', ...
     'burst aluminum', 'burst polymer', ...
     'burst tolerance alu pa portrait', ...
     'tube side reynolds', 'tube spacing longitudinal', ...
     'tube side friction pressure drop', ...
     'coolant throughput Lmin', ...
     'air reynolds simple', 'air reynolds vdi g7', ...
     'tube spacing transverse', 'tube spacing closest inline', ...
     'tube spacing closest staggered', ...
     'tech adjusted change', 'tech adjusted kA change', ...
     'shares alu pa portrait', ...
     'capillary rise alu pa portrait', ...
     'design boundary lines alu pa', ...
     'tube supply cost aluminum', 'tube supply cost polymer'}, ...
    {'01_ko_aluminum', '02_ko_polymer', ...
     '20_bundle_kA_aluminum', '21_bundle_kA_polymer', '20_bundle_kA_alu_pa_portrait', ...
     '03_burst_aluminum', '04_burst_polymer', ...
     '15_burst_tolerance_alu_pa_portrait', ...
     '05_re_tube_side', '06_tube_spacing_longitudinal', ...
     '18_tube_side_friction_pressure_drop', ...
     '19_coolant_throughput_lmin', ...
     '07_re_air_simple', '08_re_air_vdi_g7', ...
     '10_tube_spacing_transverse', '11_tube_spacing_closest_inline', ...
     '13_tube_spacing_closest_staggered', ...
     '09_tech_adjusted_change', '22_tech_adjusted_kA_change', ...
     '12_shares_alu_pa_portrait', ...
     '14_capillary_rise_alu_pa_portrait', ...
     '20_design_boundary_lines_alu_pa', ...
     '16_tube_supply_cost_aluminum', '17_tube_supply_cost_polymer'} );
for ii = 1:numel(figs)
    if ~isgraphics(figs(ii), 'figure')
        warning('Skipping invalid figure handle at export index %d.', ii);
        continue;
    end
    figName  = char(figs(ii).Name);
    if isKey(nameMap, figName)
        fileStem = nameMap(figName);
    else
        fileStem = regexprep(figName, '[^A-Za-z0-9]+', '_');
        fileStem = regexprep(fileStem, '(^_+|_+$)', '');
        if isempty(fileStem), fileStem = sprintf('Figure_%02d', ii); end
        fileStem = sprintf('%02d_%s', ii, fileStem);
    end
    basePath = fullfile(exportDir, fileStem);
    if isfield(params,'export_png') && params.export_png
        exportgraphics(figs(ii), [basePath '.png'], 'Resolution', params.export_png_resolution);
    end
    if isfield(params,'export_pdf') && params.export_pdf
        if exist('eps2pdf','file') ~= 2
            error('eps2pdf not found on MATLAB path.');
        end
        set(figs(ii), 'Renderer', 'painters');
        exportFigurePdfWithLabels(figs(ii), [basePath '.pdf']);
    end
    if isfield(params,'export_svg') && params.export_svg && isgraphics(figs(ii), 'figure')
        if exist('export_fig','file') ~= 2
            error('export_fig not found on MATLAB path.');
        end
        set(figs(ii), 'Renderer', 'painters');
        export_fig(figs(ii), basePath, '-svg', params.export_svg_renderer);
    end
    if isgraphics(figs(ii), 'figure')
        close(figs(ii));
        drawnow;
    end
end
fprintf('Exported %d figures to %s.\n', numel(figs), exportDir);
end


function exportFigurePdfWithLabels(fig, pdfPath)
% Native EPS printing preserves path-aligned text objects that export_fig
% omits with the painters PDF path. eps2pdf embeds fonts and uses the EPS
% BoundingBox, which is the programmed full figure size.
epsPath = [tempname(fileparts(pdfPath)) '.eps'];
cleanup = onCleanup(@() deleteIfPresent(epsPath));
print(fig, epsPath, '-depsc2', '-painters', '-loose');
eps2pdf(epsPath, pdfPath, true, false, false, 101);
clear cleanup;
end


function deleteIfPresent(pattern)
files = dir(pattern);
for ii = 1:numel(files)
    target = fullfile(files(ii).folder, files(ii).name);
    if exist(target, 'file')
        delete(target);
    end
end
end


%% ============================================================
%  Helper: 2D slice plot (unchanged from V7, d_o label updated)
% ============================================================
function plotSlices2D_from3D(DA_mm, Y_pct, T_mm, kAl_map, kPoly_map, params)
fig = createPptFigure(params, 'ko slices');
ax  = axes('Parent', fig);
box(ax,'on'); hold(ax,'on');
set(ax,'XScale','log');
xlabel(ax, 'Outer diameter, {\it d}_{\rm{o}} [mm]', 'Interpreter', 'tex');
ylabel(ax, '{\it k}_{\rm{o}} [W/(m^2 K)]', 'Interpreter', 'tex');
grid(ax,'on');
finishMapLayering(ax);

if params.slice_use_cmap
    cmap = getProjectColormap(params); colormap(ax, cmap);
    idx  = round(linspace(1, size(cmap,1), numel(params.slice_y_pct)));
    cols = cmap(idx,:);
else
    cols = lines(numel(params.slice_y_pct));
end

da_vec = DA_mm(1,:);
xOK    = (da_vec >= params.x_mm_lim(1)) & (da_vec <= params.x_mm_lim(2));
leg    = strings(0);

for i = 1:numel(params.slice_y_pct)
    y0  = params.slice_y_pct(i);
    col = cols(i,:);
    t_line  = (y0/100) .* da_vec;
    kA_line = interp2(DA_mm, T_mm, kAl_map,   da_vec, t_line, 'linear', NaN);
    kP_line = interp2(DA_mm, T_mm, kPoly_map, da_vec, t_line, 'linear', NaN);
    kA_line(~xOK) = NaN;  kP_line(~xOK) = NaN;
    plot(ax, da_vec, kA_line, '-',  'LineWidth', params.slice_line_w, 'Color', col);
    plot(ax, da_vec, kP_line, '--', 'LineWidth', params.slice_line_w, 'Color', col);
    leg(end+1) = sprintf('Al,   \\tau = %g%%', y0);
    leg(end+1) = sprintf('Poly, \\tau = %g%%', y0);
end

xlim(ax, params.x_mm_lim);
lgd = legend(ax, leg, 'Location','best');
set(lgd, 'FontName', params.font_name, 'FontSize', params.font_size);
styleAxes(ax, params);
applyPresentationStyle(fig, params);
end


%% ============================================================
%  Helper: 3D diagnostic (unchanged from V7)
% ============================================================
function plot3D_AlRatio_PolyBlack(X_mm, Y_pct, k_Al, k_Poly, ratio_k, params)
fig = createPptFigure(params, '3D diagnostic');
ax  = axes('Parent', fig);
box(ax,'on'); hold(ax,'on');
kA = double(k_Al);   kP = double(k_Poly);  rk = double(ratio_k);
kA(~builtin('isfinite',kA) | kA<=0 | ~builtin('isfinite',rk) | rk<=0) = NaN;
kP(~builtin('isfinite',kP) | kP<=0) = NaN;
stride = max(1, round(params.plot3d_mesh_stride));
rI = 1:stride:size(X_mm,1);  cI = 1:stride:size(X_mm,2);
sPoly = mesh(ax, X_mm(rI,cI), Y_pct(rI,cI), kP(rI,cI), 'FaceColor','none','EdgeColor',[0.35 0.35 0.35],'LineWidth',0.45);
sAl   = mesh(ax, X_mm(rI,cI), Y_pct(rI,cI), kA(rI,cI), rk(rI,cI), 'FaceColor','none','EdgeColor','flat','LineWidth',0.55);
set(ax,'XScale','log','YScale','linear');
xlabel(ax,'Outer diameter, {\it d}_{\rm{o}} [mm]', 'Interpreter', 'tex');
ylabel(ax,'Wall-thickness ratio, \tau = {\it t}/{\it d}_{\rm{o}} [%]', 'Interpreter', 'tex');
zlabel(ax,'{\it k}_{\rm{o}} [W/(m^2 K)]', 'Interpreter', 'tex');
grid(ax,'on'); view(ax,45,25);
finishMapLayering(ax);
cb = colorbar(ax);
cb.Label.String   = '{\it k}_{\rm{o,Poly}}/{\it k}_{\rm{o,Al}} [-]';
cb.FontName       = params.font_name;
cb.FontSize       = params.font_size;
cb.Label.FontName = params.font_name;
cb.Label.FontSize = params.font_size;
cb.Label.Interpreter = 'tex';
caxis(ax, params.ratio_caxis_3d);
applyProjectColormap(fig, params);
lgd = legend(ax,[sAl sPoly],{'Aluminum (colored by ratio)','Polymer'},'Location','northeast');
set(lgd,'FontName',params.font_name,'FontSize',params.font_size);
xlim(ax,params.x_mm_lim); ylim(ax,params.y_pct_lim);
styleAxes(ax,params); applyPresentationStyle(fig,params);
end
