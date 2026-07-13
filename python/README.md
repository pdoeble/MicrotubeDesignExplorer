# microtubes-core

Pure, deterministic, side-effect-free Python port of the approved MATLAB
screening model `source_materials/Waermedurchgang_V10_physical.m`.

Public computation contract: `SimulationRequest` → `SimulationResult`
(see `microtubes_core/contracts.py` and `wiki/interfaces/`).

Every equation cites its source (VDI-Wärmeatlas, 12th ed. (2019), G1/G7;
Lamé; Darcy)
in the docstrings and in `wiki/model/`.

Golden parity against MATLAB-derived references in `/reference` is enforced
by `tests/python/` at `rtol=1e-8`, `atol=1e-10`.
