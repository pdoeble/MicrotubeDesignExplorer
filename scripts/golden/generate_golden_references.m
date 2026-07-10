%% generate_golden_references.m
%
% Generates the immutable golden reference datasets under /reference from the
% unmodified authoritative MATLAB script (ADR-0002).
%
% What it does:
%   1. Runs references/Waermedurchgang_V10_physical.m verbatim (run()) with
%      all export/plot-grid side effects disabled via the script's own
%      environment switches, then harvests the raw workspace fields.
%   2. Extracts the physics local functions VERBATIM by text slicing into
%      scripts/golden/_scratch/extracted/ and calls them directly to produce
%      function-level references across laminar/transition/turbulent branches
%      and input regions the fixed-parameter script does not visit.
%   3. Writes float64 little-endian binaries (column-major, self-described by
%      sibling *.meta.json) plus scalars/provenance JSON.
%
% Run from the repository root:
%   matlab -batch "run('scripts/golden/generate_golden_references.m')"
%
% Never writes into /references. Output: /reference (git-tracked, immutable).

%#ok<*SAGROW,*AGROW,*NASGU>

g_this_dir = fileparts(mfilename('fullpath'));
g_repo_root = fileparts(fileparts(g_this_dir));
g_ref_script = fullfile(g_repo_root, 'references', 'Waermedurchgang_V10_physical.m');
g_out_root = fullfile(g_repo_root, 'reference');
g_scratch = fullfile(g_this_dir, '_scratch');
g_extract_dir = fullfile(g_scratch, 'extracted');

if ~exist(g_scratch, 'dir'), mkdir(g_scratch); end
if ~exist(fullfile(g_scratch, 'exports'), 'dir'), mkdir(fullfile(g_scratch, 'exports')); end
if ~exist(g_out_root, 'dir'), mkdir(g_out_root); end

% Disable exports and plot-only grids through the script's own switches.
setenv('WAERME_SKIP_EXPORT', '1');
setenv('WAERME_KEEP_EXPORTS', '1');
setenv('WAERME_EXPORT_DIR', fullfile(g_scratch, 'exports'));
setenv('WAERME_SKIP_BURST_GRID', '1');
setenv('WAERME_SKIP_SHARE_GRID', '1');
setenv('WAERME_SKIP_CAPILLARY_GRID', '1');
setenv('WAERME_SKIP_DESIGN_BOUNDARY', '1');

fprintf('== Running authoritative reference script ==\n');
run(g_ref_script);
close all force;
fprintf('== Reference script finished, harvesting ==\n');

%% ---- default case: axes and masks -------------------------------------
g_case_dir = fullfile(g_out_root, 'default_case');
if ~exist(g_case_dir, 'dir'), mkdir(g_case_dir); end

g_write_f64(g_case_dir, 't_mm', t_mm);
g_write_f64(g_case_dir, 'da_mm', da_mm);
g_write_f64(g_case_dir, 'DA_mm', DA_mm);
g_write_f64(g_case_dir, 'Y_pct', Y_pct);
g_write_f64(g_case_dir, 'burstTol_mm', burstTol_mm);

g_write_u8(g_case_dir, 'mask_invalid_di', invalid);
g_write_u8(g_case_dir, 'mask_y_calc', Y_calc_mask);
g_write_u8(g_case_dir, 'mask_tech_al', techMaskAl);
g_write_u8(g_case_dir, 'mask_tech_poly', techMaskPoly);
g_write_u8(g_case_dir, 'mask_design_feasible_al', designMaskAl);
g_write_u8(g_case_dir, 'mask_design_feasible_pa', designMaskPA);

%% ---- default case: fields (post Y_calc_mask state, as used by screens) --
g_write_f64(g_case_dir, 'alpha_a', alpha_a);
g_write_f64(g_case_dir, 'alpha_i', alpha_i);
g_write_f64(g_case_dir, 'Re_i_raw', Re_i_raw);
g_write_f64(g_case_dir, 'Re_o_simple_raw', Re_o_simple_raw);
g_write_f64(g_case_dir, 'Re_o_vdi_raw', Re_o_vdi_raw);
g_write_f64(g_case_dir, 'dp_i_fric_bar_raw', dp_i_fric_bar_raw);
g_write_f64(g_case_dir, 'N_tubes_raw', N_tubes_raw);
g_write_f64(g_case_dir, 'coolant_Vdot_Lmin_raw', coolant_Vdot_Lmin_raw);
g_write_f64(g_case_dir, 'coolant_mdot_kg_s_raw', coolant_mdot_kg_s_raw);
g_write_f64(g_case_dir, 'k_Al_raw', k_Al_raw);
g_write_f64(g_case_dir, 'k_Poly_raw', k_Poly_raw);
g_write_f64(g_case_dir, 'kA_Al_raw_WK', kA_Al_raw_WK);
g_write_f64(g_case_dir, 'kA_Poly_raw_WK', kA_Poly_raw_WK);
g_write_f64(g_case_dir, 'Ri_Al_raw', Ri_Al_raw);
g_write_f64(g_case_dir, 'Rw_Al_raw', Rw_Al_raw);
g_write_f64(g_case_dir, 'Ro_Al_raw', Ro_Al_raw);
g_write_f64(g_case_dir, 'Ri_Poly_raw', Ri_Poly_raw);
g_write_f64(g_case_dir, 'Rw_Poly_raw', Rw_Poly_raw);
g_write_f64(g_case_dir, 'Ro_Poly_raw', Ro_Poly_raw);
g_write_f64(g_case_dir, 'pB_Al_bar_raw', pB_Al_bar_raw);
g_write_f64(g_case_dir, 'pB_Poly_bar_raw', pB_Poly_bar_raw);
g_write_f64(g_case_dir, 'pB_Al_tol_std_bar', pB_Al_tol_bar_raw(:, :, 1));
g_write_f64(g_case_dir, 'pB_Al_tol_med_bar', pB_Al_tol_bar_raw(:, :, 2));
g_write_f64(g_case_dir, 'pB_Poly_tol_std_bar', pB_Poly_tol_bar_raw(:, :, 1));
g_write_f64(g_case_dir, 'pB_Poly_tol_med_bar', pB_Poly_tol_bar_raw(:, :, 2));
g_write_f64(g_case_dir, 'clearSpacingTrans_mm_raw', clearSpacingTrans_mm_raw);
g_write_f64(g_case_dir, 'clearSpacingLong_mm_raw', clearSpacingLong_mm_raw);
g_write_f64(g_case_dir, 'clearSpacingClosestInline_mm_raw', clearSpacingClosestInline_mm_raw);
g_write_f64(g_case_dir, 'clearSpacingClosestStaggered_mm_raw', clearSpacingClosestStaggered_mm_raw);
g_write_f64(g_case_dir, 'capillaryRiseAl_raw_g1_mm', capillaryRiseAl_raw_mm(:, :, 1));
g_write_f64(g_case_dir, 'capillaryRiseAl_raw_g5_mm', capillaryRiseAl_raw_mm(:, :, 2));
g_write_f64(g_case_dir, 'capillaryRiseAl_raw_g10_mm', capillaryRiseAl_raw_mm(:, :, 3));
g_write_f64(g_case_dir, 'capillaryRisePA_raw_g1_mm', capillaryRisePA_raw_mm(:, :, 1));
g_write_f64(g_case_dir, 'capillaryRisePA_raw_g5_mm', capillaryRisePA_raw_mm(:, :, 2));
g_write_f64(g_case_dir, 'capillaryRisePA_raw_g10_mm', capillaryRisePA_raw_mm(:, :, 3));
g_write_f64(g_case_dir, 'cost_Al_index_raw', cost_Al_index_raw);
g_write_f64(g_case_dir, 'cost_Poly_index_raw', cost_Poly_index_raw);
g_write_f64(g_case_dir, 'ratio_same_geometry', ratio_same_geometry);
g_write_f64(g_case_dir, 'ratio_tech_adjusted', ratio_tech_adjusted);
g_write_f64(g_case_dir, 'ratio_kA_tech_adjusted', ratio_kA_tech_adjusted);
g_write_f64(g_case_dir, 'dAlNearest_mm', dAlNearest_mm);
g_write_f64(g_case_dir, 'boundaryYPct', boundaryYPct);
g_write_f64(g_case_dir, 'boundaryAlXmm', boundaryAlXmm);
g_write_f64(g_case_dir, 'boundaryPAXmm', boundaryPAXmm);

%% ---- default case: scalars ----------------------------------------------
g_scalars = struct();
g_scalars.note = 'Fields harvested after Y_calc_mask application, before technology masks (matching screen inputs).';
g_scalars.params = params;
g_scalars.fluid = fluid;
g_scalars.mat = mat;
g_scalars.model_outer = model_outer;
g_scalars.model_inner = model_inner;
g_scalars.checks = struct( ...
    'alpha_o_check', alpha_o_check, ...
    'alpha_i_check', alpha_i_check, ...
    'R_o_check', R_o_check, ...
    'Rii_check', Rii_check);
g_scalars.bundle_ref = params.bundle_ref;
g_scalars.coolant_flow_ref = params.coolant_flow_ref;
g_scalars.diagnostics = struct( ...
    'n_feasible_al', nnz(designMaskAl), ...
    'n_feasible_pa', nnz(designMaskPA), ...
    'n_pa_with_al_reference', nnz(builtin('isfinite', dAlNearest_mm)));
g_write_json(fullfile(g_case_dir, 'scalars.json'), g_scalars);

%% ---- extract physics local functions verbatim ---------------------------
fprintf('== Extracting physics functions verbatim ==\n');
g_src_lines = readlines(g_ref_script);
g_start_idx = find(startsWith(strtrim(g_src_lines), ...
    'function [alpha_o, Re_cl] = vdiG7InlineTubeBankAlpha'), 1, 'first');
g_end_idx = find(startsWith(strtrim(g_src_lines), ...
    'function Z = applyMask2D'), 1, 'first');
assert(~isempty(g_start_idx) && ~isempty(g_end_idx) && g_end_idx > g_start_idx, ...
    'Physics function block not found in reference script.');
g_block = g_src_lines(g_start_idx:(g_end_idx - 1));

if exist(g_extract_dir, 'dir'), rmdir(g_extract_dir, 's'); end
mkdir(g_extract_dir);
g_fn_starts = find(startsWith(strtrim(g_block), 'function '));
g_fn_starts(end + 1) = numel(g_block) + 1;
g_extracted_names = strings(0, 1);
for g_ii = 1:(numel(g_fn_starts) - 1)
    g_chunk = g_block(g_fn_starts(g_ii):(g_fn_starts(g_ii + 1) - 1));
    g_tok = regexp(g_chunk(1), ...
        'function\s+(?:\[[^\]]*\]\s*=\s*|\w+\s*=\s*)?(\w+)', 'tokens', 'once');
    assert(~isempty(g_tok), 'Could not parse function name: %s', g_chunk(1));
    g_fn_name = g_tok{1};
    g_extracted_names(end + 1) = string(g_fn_name);
    g_fid = fopen(fullfile(g_extract_dir, g_fn_name + ".m"), 'w');
    fprintf(g_fid, '%s\n', g_chunk);
    fclose(g_fid);
end
fprintf('Extracted: %s\n', strjoin(g_extracted_names, ', '));
addpath(g_extract_dir);

%% ---- function-level references ------------------------------------------
g_fn_root = fullfile(g_out_root, 'functions');
if ~exist(g_fn_root, 'dir'), mkdir(g_fn_root); end

% Alternative property sets to prevent any hard-coding of paper fluids.
g_liquid_alt = struct('name', "water_like_alt", 'T_C', 60.0, ...
    'rho_kgm3', 998.0, 'cp_JkgK', 4180.0, 'lambda_WmK', 0.6, ...
    'nu_m2s', 1.0e-6, 'mu_Pas', 0.998e-3, 'Pr', 7.0);
g_air_alt = struct('name', "air_alt", 'T_C', 60.0, ...
    'rho_kgm3', 1.0, 'cp_JkgK', 1007.0, 'lambda_WmK', 0.03, ...
    'nu_m2s', 2.0e-5, 'mu_Pas', 2.0e-5, 'Pr', 0.72);

% --- VDI G1 internal tube alpha ---
g_g1_cases = {
    'g1_alpha_i_base',      0.5, model_inner,                          fluid.liquid;
    'g1_alpha_i_v2',        2.0, model_inner,                          fluid.liquid;
    'g1_alpha_i_v01',       0.1, model_inner,                          fluid.liquid;
    'g1_alpha_i_chf',       0.5, g_with(model_inner, 'boundary_condition', "constant_heat_flux"), fluid.liquid;
    'g1_alpha_i_L100',      0.5, g_with(model_inner, 'length_m', 0.100), fluid.liquid;
    'g1_alpha_i_water',     0.5, model_inner,                          g_liquid_alt;
    'g1_alpha_i_prwall',    0.5, g_with(g_with(model_inner, 'apply_liquid_Pr_wall_correction', true), 'Pr_wall', 5.0), fluid.liquid;
    };
for g_ii = 1:size(g_g1_cases, 1)
    g_id = g_g1_cases{g_ii, 1};
    g_v = g_g1_cases{g_ii, 2};
    g_mi = g_g1_cases{g_ii, 3};
    g_fl = g_g1_cases{g_ii, 4};
    % Sweep spans laminar, transition, turbulent; exact anchors appended.
    g_di = [-1, 0, logspace(log10(0.005), log10(60), 400)];
    g_di = unique([g_di, 2300 .* g_fl.nu_m2s ./ g_v .* 1e3, 10000 .* g_fl.nu_m2s ./ g_v .* 1e3]);
    g_alpha = vdiG1InternalTubeAlpha(g_v, g_di, g_mi, g_fl);
    g_dir = fullfile(g_fn_root, g_id);
    if ~exist(g_dir, 'dir'), mkdir(g_dir); end
    g_write_f64(g_dir, 'd_i_mm', g_di);
    g_write_f64(g_dir, 'alpha_i', g_alpha);
    g_write_json(fullfile(g_dir, 'inputs.json'), ...
        struct('v_i_ms', g_v, 'model_inner', g_mi, 'liquid', g_fl));
end

% --- VDI G7 inline tube bank alpha ---
g_g7_cases = {
    'g7_alpha_o_base',        5.0, model_outer,                                   fluid.air;
    'g7_alpha_o_v1',          1.0, model_outer,                                   fluid.air;
    'g7_alpha_o_finite_rows', 5.0, g_with(g_with(model_outer, 'use_finite_row_correction', true), 'n_rows', 5), fluid.air;
    'g7_alpha_o_K11',         5.0, g_with(model_outer, 'property_correction_K', 1.1), fluid.air;
    'g7_alpha_o_b09',         5.0, g_with(model_outer, 'b_pitch_longitudinal', 0.9), fluid.air;
    'g7_alpha_o_a2b15',       5.0, g_with(g_with(model_outer, 'a_pitch_transverse', 2.0), 'b_pitch_longitudinal', 1.5), fluid.air;
    'g7_alpha_o_air_alt',     5.0, model_outer,                                   g_air_alt;
    };
for g_ii = 1:size(g_g7_cases, 1)
    g_id = g_g7_cases{g_ii, 1};
    g_v = g_g7_cases{g_ii, 2};
    g_mo = g_g7_cases{g_ii, 3};
    g_fl = g_g7_cases{g_ii, 4};
    g_do = [-1, 0, logspace(log10(0.05), log10(50), 400)];
    [g_alpha, g_re] = vdiG7InlineTubeBankAlpha(g_v, g_do, g_mo, g_fl);
    g_dir = fullfile(g_fn_root, g_id);
    if ~exist(g_dir, 'dir'), mkdir(g_dir); end
    g_write_f64(g_dir, 'd_o_mm', g_do);
    g_write_f64(g_dir, 'alpha_o', g_alpha);
    g_write_f64(g_dir, 'Re_cl', g_re);
    g_write_json(fullfile(g_dir, 'inputs.json'), ...
        struct('v_a_ms', g_v, 'model_outer', g_mo, 'air', g_fl));
end

% --- Darcy friction factor (laminar / transition / turbulent) ---
g_re = unique([logspace(0, 6, 500), 2300, 10000, -5, 0]);
g_fd = calcDarcyFrictionFactorSmoothTube(g_re);
g_dir = fullfile(g_fn_root, 'friction_factor');
if ~exist(g_dir, 'dir'), mkdir(g_dir); end
g_write_f64(g_dir, 'Re', g_re);
g_write_f64(g_dir, 'fD', g_fd);
g_write_json(fullfile(g_dir, 'inputs.json'), struct('note', 'smooth tube Darcy friction factor'));

% --- Tube friction pressure drop ---
g_dp_cases = {
    'dp_friction_base',  0.5, model_inner,                            fluid.liquid;
    'dp_friction_v2',    2.0, model_inner,                            fluid.liquid;
    'dp_friction_water', 0.5, model_inner,                            g_liquid_alt;
    'dp_friction_L100',  0.5, g_with(model_inner, 'length_m', 0.100), fluid.liquid;
    };
for g_ii = 1:size(g_dp_cases, 1)
    g_id = g_dp_cases{g_ii, 1};
    g_v = g_dp_cases{g_ii, 2};
    g_mi = g_dp_cases{g_ii, 3};
    g_fl = g_dp_cases{g_ii, 4};
    g_di = [-1, 0, logspace(log10(0.005), log10(60), 400)];
    g_di = unique([g_di, 2300 .* g_fl.nu_m2s ./ g_v .* 1e3, 10000 .* g_fl.nu_m2s ./ g_v .* 1e3]);
    g_dp = calcTubeFrictionPressureDropBar(g_v, g_di, g_mi, g_fl);
    g_dir = fullfile(g_fn_root, g_id);
    if ~exist(g_dir, 'dir'), mkdir(g_dir); end
    g_write_f64(g_dir, 'd_i_mm', g_di);
    g_write_f64(g_dir, 'dp_bar', g_dp);
    g_write_json(fullfile(g_dir, 'inputs.json'), ...
        struct('v_i_ms', g_v, 'model_inner', g_mi, 'liquid', g_fl));
end

% --- Burst pressure incl. tolerance-adjusted inner diameter ---
g_do_b = logspace(log10(0.1), log10(10), 50);
g_t_b = logspace(log10(0.005), log10(0.5), 40);
[g_DO_b, g_T_b] = meshgrid(g_do_b, g_t_b);
g_tols = [0.020, 0.005, 0.0];
g_tol_names = {'std', 'med', 'none'};
g_dir = fullfile(g_fn_root, 'burst_pressure');
if ~exist(g_dir, 'dir'), mkdir(g_dir); end
g_write_f64(g_dir, 'DO_mm', g_DO_b);
g_write_f64(g_dir, 'T_nom_mm', g_T_b);
for g_ii = 1:numel(g_tols)
    g_di_eff = calcEffectiveInnerDiameterForBurst(g_DO_b, g_T_b, g_tols(g_ii));
    g_write_f64(g_dir, ['DI_eff_' g_tol_names{g_ii} '_mm'], g_di_eff);
    g_write_f64(g_dir, ['pB_Al_' g_tol_names{g_ii} '_bar'], ...
        calcPburstBar(g_DO_b, g_di_eff, mat.Al.Rm_MPa));
    g_write_f64(g_dir, ['pB_Poly_' g_tol_names{g_ii} '_bar'], ...
        calcPburstBar(g_DO_b, g_di_eff, mat.Poly.Rm_MPa));
end
g_write_json(fullfile(g_dir, 'inputs.json'), struct( ...
    'tol_mm', g_tols, 'tol_names', {g_tol_names}, ...
    'Rm_Al_MPa', mat.Al.Rm_MPa, 'Rm_Poly_MPa', mat.Poly.Rm_MPa));

% --- Tube supply cost and footprint tube count ---
g_do_c = [-1, 0, logspace(log10(0.1), log10(10), 300)];
g_cost_cases = {
    'cost_inline_al',      "inline",    "Al";
    'cost_inline_poly',    "inline",    "Poly";
    'cost_staggered_al',   "staggered", "Al";
    'cost_staggered_poly', "staggered", "Poly";
    };
for g_ii = 1:size(g_cost_cases, 1)
    g_id = g_cost_cases{g_ii, 1};
    g_cp = params.cost;
    g_cp.arrangement = g_cost_cases{g_ii, 2};
    [g_ci, g_nt, g_rl] = calcTubeSupplyCostIndex(g_do_c, model_outer, g_cp, g_cost_cases{g_ii, 3});
    g_dir = fullfile(g_fn_root, g_id);
    if ~exist(g_dir, 'dir'), mkdir(g_dir); end
    g_write_f64(g_dir, 'd_o_mm', g_do_c);
    g_write_f64(g_dir, 'cost_index', g_ci);
    g_write_f64(g_dir, 'n_tubes', g_nt);
    g_write_f64(g_dir, 'raw_tube_length_mm', g_rl);
    g_write_json(fullfile(g_dir, 'inputs.json'), struct( ...
        'cost_params', g_cp, 'model_outer', model_outer, ...
        'material', g_cost_cases{g_ii, 3}));
end

%% ---- provenance ----------------------------------------------------------
g_prov = struct();
g_prov.generator = 'scripts/golden/generate_golden_references.m';
g_prov.command = 'matlab -batch "run(''scripts/golden/generate_golden_references.m'')"';
g_prov.matlab_version = version;
g_prov.matlab_release = version('-release');
g_prov.reference_script = 'references/Waermedurchgang_V10_physical.m';
g_prov.reference_script_sha256 = g_sha256(g_ref_script);
g_prov.generated_utc = char(datetime('now', 'TimeZone', 'UTC', ...
    'Format', 'yyyy-MM-dd''T''HH:mm:ss''Z'''));
g_prov.data_layout = struct( ...
    'binary', 'little-endian float64 (*.f64) / uint8 (*.u8), column-major (order F)', ...
    'meta', 'sibling <name>.meta.json files carry dtype/shape/order');
g_write_json(fullfile(g_out_root, 'provenance.json'), g_prov);

fprintf('== Golden reference generation complete ==\n');

%% ---- helpers -------------------------------------------------------------
function g_write_f64(dirPath, name, A)
A = double(A);
fid = fopen(fullfile(dirPath, [char(name) '.f64']), 'w', 'ieee-le');
fwrite(fid, A(:), 'float64');
fclose(fid);
g_write_json(fullfile(dirPath, [char(name) '.meta.json']), ...
    struct('dtype', 'float64', 'shape', size(A), 'order', 'F', 'endian', 'little'));
end

function g_write_u8(dirPath, name, A)
fid = fopen(fullfile(dirPath, [char(name) '.u8']), 'w', 'ieee-le');
fwrite(fid, uint8(A(:)), 'uint8');
fclose(fid);
g_write_json(fullfile(dirPath, [char(name) '.meta.json']), ...
    struct('dtype', 'uint8', 'shape', size(A), 'order', 'F', 'endian', 'little'));
end

function g_write_json(path, s)
txt = jsonencode(s, 'PrettyPrint', true);
fid = fopen(path, 'w');
fwrite(fid, unicode2native(txt, 'UTF-8'));
fclose(fid);
end

function s = g_with(s, field, value)
s.(field) = value;
end

function h = g_sha256(path)
md = java.security.MessageDigest.getInstance('SHA-256');
fid = fopen(path, 'rb');
data = fread(fid, inf, '*uint8');
fclose(fid);
md.update(data);
h = lower(reshape(dec2hex(typecast(md.digest(), 'uint8'))', 1, []));
end
