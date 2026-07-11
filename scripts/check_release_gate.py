"""Release-candidate gate checks for M9/M10.

The default mode is strict and intended for the manual release-gate workflow.
Use ``--allow-provisional`` during pre-release development when citation or
version metadata is intentionally still provisional.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROHIBITED_ARTIFACT_TOKENS = (
    "source_materials/",
    "Waermedurchgang_V10_physical.m",
    "Paper.pdf",
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--allow-provisional",
        action="store_true",
        help="Permit provisional citation/version metadata while the release is not final.",
    )
    args = parser.parse_args()

    violations: list[str] = []
    notices: list[str] = []

    required_files = ["LICENSE", "CITATION.cff", "CHANGELOG.md", "package.json"]
    for relative in required_files:
        if not (ROOT / relative).is_file():
            violations.append(f"Missing required release file: {relative}")

    _check_metadata(violations, notices, allow_provisional=args.allow_provisional)
    _check_contract_defaults(violations)
    _check_git_clean_contracts(violations)
    _check_dist_artifact(violations)

    if notices:
        print("Release-gate notices:")
        for notice in notices:
            print(f"  - {notice}")
    if violations:
        print("Release-gate violations:")
        for violation in violations:
            print(f"  - {violation}")
        return 1
    print("Release-gate checks passed.")
    return 0


def _check_metadata(violations: list[str], notices: list[str], *, allow_provisional: bool) -> None:
    package_path = ROOT / "package.json"
    citation_path = ROOT / "CITATION.cff"
    changelog_path = ROOT / "CHANGELOG.md"
    if not package_path.is_file() or not citation_path.is_file() or not changelog_path.is_file():
        return

    package = json.loads(package_path.read_text(encoding="utf8"))
    package_version = str(package.get("version", ""))
    citation = citation_path.read_text(encoding="utf8")
    changelog = changelog_path.read_text(encoding="utf8")
    citation_version = _yaml_scalar(citation, "version")
    repository = _yaml_scalar(citation, "repository-code")

    if not re.fullmatch(r"\d+\.\d+\.\d+", package_version):
        violations.append(f"package.json version is not semantic: {package_version!r}")
    if citation_version != package_version:
        message = (
            f"CITATION.cff version {citation_version!r} does not match "
            f"package.json {package_version!r}"
        )
        if allow_provisional and citation_version == "0.0.0":
            notices.append(message)
        else:
            violations.append(message)
    if not repository.startswith("https://github.com/"):
        violations.append("CITATION.cff repository-code must point to GitHub.")
    if "## [Unreleased]" not in changelog:
        violations.append("CHANGELOG.md must keep an [Unreleased] section.")
    if "- " not in changelog.split("## [Unreleased]", 1)[1]:
        violations.append("CHANGELOG.md [Unreleased] section has no release notes.")


def _check_contract_defaults(violations: list[str]) -> None:
    defaults_path = ROOT / "src" / "contracts" / "defaults.json"
    if not defaults_path.is_file():
        violations.append("Missing src/contracts/defaults.json.")
        return
    defaults = json.loads(defaults_path.read_text(encoding="utf8"))
    if defaults.get("contract_version") != "1.0.0":
        violations.append("defaults.json contract_version is not 1.0.0.")
    if defaults.get("defaults_version") != "1.0.0":
        violations.append("defaults.json defaults_version is not 1.0.0.")
    request = defaults.get("request", {})
    if request.get("contract_version") != "1.0.0":
        violations.append("defaults.json request.contract_version is not 1.0.0.")


def _check_git_clean_contracts(violations: list[str]) -> None:
    result = subprocess.run(
        ["git", "diff", "--exit-code", "--", "src/contracts"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        violations.append("Generated contract/default artifacts have uncommitted drift.")


def _check_dist_artifact(violations: list[str]) -> None:
    dist = ROOT / "dist"
    if not dist.is_dir():
        violations.append("dist/ artifact is missing; run the production build first.")
        return
    for path in dist.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(ROOT).as_posix()
        if path.suffix.lower() == ".pdf":
            violations.append(f"PDF artifact must not ship in dist/: {relative}")
            continue
        if path.stat().st_size > 20_000_000:
            violations.append(f"Unexpectedly large dist artifact: {relative}")
            continue
        if path.suffix.lower() not in {".html", ".js", ".css", ".map", ".json", ".txt"}:
            continue
        text = path.read_text(encoding="utf8", errors="ignore")
        for token in PROHIBITED_ARTIFACT_TOKENS:
            if token in text:
                violations.append(
                    f"dist artifact leaks prohibited source token {token!r}: {relative}"
                )


def _yaml_scalar(text: str, key: str) -> str:
    match = re.search(rf"^{re.escape(key)}:\s*['\"]?([^'\"\n]+)['\"]?\s*$", text, re.MULTILINE)
    return match.group(1).strip() if match else ""


if __name__ == "__main__":
    sys.exit(main())
