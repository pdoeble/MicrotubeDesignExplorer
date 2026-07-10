# Golden data — provenance and regeneration

Golden references live under `/reference` and are **immutable** (AGENTS §10).
They were generated directly from the unmodified authoritative MATLAB script
with MATLAB R2024b Update 1 per ADR-0002.

## Layout

```text
reference/
  provenance.json          MATLAB version, script SHA-256, timestamp, command
  manifest.json            SHA-256 + size of every golden file
  default_case/            full 250×250 sweep of the paper default case
    *.f64                  float64 little-endian, column-major (order F)
    *.u8                   uint8 masks (0/1)
    *.meta.json            dtype/shape/order per array
    scalars.json           params/fluids/materials/model structs, checks,
                           feasibility diagnostics
  functions/<case-id>/     function-level references (verbatim-extracted
                           local functions called over sweeps)
    inputs.json            exact inputs incl. model/fluid structs
    *.f64                  input vectors and outputs
```

## Reading arrays in Python/NumPy

```python
import json, numpy as np
meta = json.load(open("reference/default_case/k_Al_raw.meta.json"))
a = np.fromfile("reference/default_case/k_Al_raw.f64", dtype="<f8")
a = a.reshape(meta["shape"], order=meta["order"])  # (250, 250), rows = t, cols = d_o
```

## What the default case captures

Fields are harvested **after** the wall-ratio calculation mask
(`Y_calc_mask`) is applied — exactly the state consumed by the design
screens. Technology masks and design-feasibility masks are stored
separately, so masked plot states are reconstructable. See
[matlab-inventory.md](matlab-inventory.md) §5.

## Function-level coverage (why these cases exist)

The fixed-parameter script never visits e.g. turbulent coolant flow or the
constant-heat-flux boundary. The web application exposes editable
velocities, lengths, and fluids, so the ported functions are pinned across
their full branch structure:

| Case family | Branches covered |
|---|---|
| `g1_alpha_i_*` | laminar/transition/turbulent (exact Re=2300/10000 anchors appended), CWT vs CHF, L=100 mm, v ∈ {0.1, 0.5, 2}, alternative fluid, Pr-wall correction |
| `g7_alpha_o_*` | many-row vs finite-row, K≠1, b<1 void-fraction branch, alternative pitches, alternative air |
| `friction_factor`, `dp_friction_*` | all f_D branches, alternative fluid/length/velocity |
| `burst_pressure` | tolerances {0.020, 0.005, 0} mm incl. t_loc ≤ 0 → NaN region |
| `cost_*` | inline and staggered arrangements, both material indices |
| invalid inputs | d ≤ 0 rows included in every sweep (NaN expected) |

## Comparison-mode note

"Different geometry / same material" and other two-cooler comparisons are
app-level arithmetic over two independent single-case results; their physics
is fully covered by the per-case goldens above plus contract tests. The
paper-specific tech-adjusted comparison (`ratio_tech_adjusted`,
`dAlNearest_mm`, composite boundaries) **is** part of the default case.

## Regeneration procedure (requires MATLAB R2024b)

```bash
matlab -batch "run('scripts/golden/generate_golden_references.m')"
python scripts/golden/build_manifest.py
```

Rules (AGENTS §10): never regenerate merely to make tests pass; any
regeneration requires a provenance note here, review of the MATLAB
reference diff (`provenance.json → reference_script_sha256`), and a commit
that contains only golden changes.

## Provenance log

| Date | MATLAB | Script SHA-256 | Reason |
|---|---|---|---|
| 2026-07-10 | R2024b Update 1 | `e521b0b7…7527fc` | Initial generation (M1) |
