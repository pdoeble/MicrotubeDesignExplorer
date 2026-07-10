"""Fail CI when prohibited files are tracked in git.

Prohibited (AGENTS.md §16): secrets, proprietary PDFs outside the read-only
source_materials/ directory, local caches, environment files, and build output.

Usage: python scripts/check_prohibited_files.py
"""

from __future__ import annotations

import fnmatch
import subprocess
import sys

# source_materials/ is the user-provided read-only source area and is exempt for PDFs.
PROHIBITED_PATTERNS: list[str] = [
    "*.pem",
    "*.key",
    "*.p12",
    "*.pfx",
    ".env",
    ".env.*",
    "*secret*",
    "node_modules/*",
    "dist/*",
    "coverage/*",
    "__pycache__/*",
    "*.pyc",
    ".venv/*",
]

PDF_ALLOWED_PREFIXES = ("source_materials/", "reference/")


def tracked_files() -> list[str]:
    out = subprocess.run(["git", "ls-files"], capture_output=True, text=True, check=True).stdout
    return [line.strip() for line in out.splitlines() if line.strip()]


def main() -> int:
    violations: list[str] = []
    for path in tracked_files():
        normalized = path.replace("\\", "/")
        lower = normalized.lower()
        for pattern in PROHIBITED_PATTERNS:
            if fnmatch.fnmatch(lower, pattern) or fnmatch.fnmatch(lower, f"*/{pattern}"):
                violations.append(f"{path}  (pattern: {pattern})")
                break
        else:
            if lower.endswith(".pdf") and not normalized.startswith(PDF_ALLOWED_PREFIXES):
                violations.append(f"{path}  (PDF outside source_materials/ or reference/)")

    if violations:
        print("Prohibited files tracked in git:")
        for v in violations:
            print(f"  - {v}")
        return 1
    print("No prohibited files tracked.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
