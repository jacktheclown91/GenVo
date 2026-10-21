#!/usr/bin/env python3
"""Create a self-contained itch.io HTML5 ZIP from GenVo's canonical public export.

This script is release-only packaging. It does not modify runtime source or
produce/change simulated worlds. Call from the repository root:
python3 tools/package-itch-preview.py /path/to/export /path/to/output.zip /path/to/report.json
"""
from __future__ import annotations

import hashlib
import json
import sys
import zipfile
from pathlib import Path

MAX_FILES = 1000
MAX_TOTAL = 500_000_000
MAX_SINGLE = 200_000_000


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("Usage: package-itch-preview.py EXPORT_DIR GAME_ZIP REPORT_JSON")
    source, target, report_path = map(lambda v: Path(v).resolve(), sys.argv[1:])
    if not source.is_dir() or source == target.parent or target.is_relative_to(source):
        raise SystemExit("Export must be an existing directory; output ZIP must be outside it")
    entries = sorted(source.rglob("*"))
    if any(p.is_symlink() for p in entries):
        raise SystemExit("Refusing symbolic links in the HTML5 export")
    files = [p for p in entries if p.is_file()]
    if len(files) > MAX_FILES:
        raise SystemExit(f"HTML5 file count exceeds {MAX_FILES}: {len(files)}")
    if not (source / "index.html").is_file():
        raise SystemExit("Export does not contain root index.html")
    sizes = [p.stat().st_size for p in files]
    if sum(sizes) > MAX_TOTAL:
        raise SystemExit(f"Unpacked HTML5 size exceeds {MAX_TOTAL} bytes")
    for p, size in zip(files, sizes):
        if size > MAX_SINGLE:
            raise SystemExit(f"HTML5 single-file size exceeds {MAX_SINGLE} bytes: {p}")
    if not (source / "assets/scenarios/catalog.json").is_file():
        raise SystemExit("Verified scenario catalog is missing")
    catalog = json.loads((source / "assets/scenarios/catalog.json").read_text())
    for scenario in catalog["scenarios"]:
        scenario_path = source / scenario["file"]
        if not scenario_path.is_file():
            raise SystemExit(f"Missing included evolved-world asset {scenario['file']}")
        digest = hashlib.sha256(scenario_path.read_bytes()).hexdigest()
        if digest != scenario["sha256"]:
            raise SystemExit(f"Scenario integrity mismatch: {scenario['id']}")
    target.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=True) as bundle:
        for p in files:
            bundle.write(p, p.relative_to(source).as_posix())
    with zipfile.ZipFile(target, "r") as bundle:
        names = bundle.namelist()
        if bundle.testzip() is not None or "index.html" not in names:
            raise SystemExit("ZIP integrity/root-entry check failed")
    report = {
        "schema": "genvo.itch-preview-package/1",
        "game_zip": target.name,
        "file_count": len(files),
        "unpacked_bytes": sum(sizes),
        "largest_file_bytes": max(sizes),
        "archive_bytes": target.stat().st_size,
        "archive_sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
        "scenario_ids": [s["id"] for s in catalog["scenarios"]],
        "source_commit": "e486b359f30343d8c47efb5b4326cf877884d5e2",
        "human_approval": False,
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
