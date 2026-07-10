# Interfaces

Shared contracts between the Python core, the Pyodide worker, and the
frontend. Contract changes follow semantic versioning; breaking changes
require an ADR (AGENTS §6, §14).

| Document | Content | Milestone |
|---|---|---|
| [contracts.md](contracts.md) | `SimulationRequest` / `SimulationResult`, defaults source, validity policy | M2 |
| [python-api.md](python-api.md) | Direct Python `simulate(request)` payload and array-buffer boundary | M3 |
| [worker-protocol.md](worker-protocol.md) | Pyodide worker message protocol, transferables, cancellation | M4 |
| [url-state.md](url-state.md) | Versioned URL serialization of scientific inputs | M5 |
| [report-payload.md](report-payload.md) | Report/export payload structure | M7 |
