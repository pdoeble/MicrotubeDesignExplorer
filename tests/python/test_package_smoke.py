"""M0 baseline smoke test: package imports and exposes versions."""

import microtubes_core


def test_package_exposes_versions() -> None:
    assert microtubes_core.__version__
    assert microtubes_core.CONTRACT_VERSION.count(".") == 2
