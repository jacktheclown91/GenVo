"""Source-package boundary: Git-visible files, excluding generated local evidence.

Includes pending nonignored work; receipt hashes identify exact packaged bytes.
Does not modify files or Git. Public/browser exports have a separate runtime graph.
"""
from pathlib import Path
import json
import subprocess

EXCLUDED_DIRS = {".git", ".claude", ".codex", ".agents", "node_modules", "__pycache__", "builds", "archived-source-packages"}

def source_files(root):
    root = Path(root).resolve()
    result = subprocess.run(["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard"], cwd=root, check=True, stdout=subprocess.PIPE)
    names = set(result.stdout.decode("utf-8").split("\0")) - {""}
    selected = []
    for name in sorted(names):
        rel = Path(name)
        if EXCLUDED_DIRS.intersection(rel.parts) or any(part.endswith(".artifacts") for part in rel.parts):
            continue
        if rel.name.endswith((".snapshot.bin", ".snapshot.json.gz", ".pyc")):
            continue
        if name.startswith("docs/test-runs/artifacts/"):
            continue
        # Only explicitly tracked comparison profiles belong in source archives.
        if rel.suffix == ".cpuprofile" and not name.startswith("reports/consolidation-demand-"):
            continue
        target = root / rel
        if target.is_file() and not target.is_symlink():
            selected.append(target)
    return selected

if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    files = source_files(root)
    print(json.dumps({"schema": "genvo.source-package-inventory/1", "files": len(files), "bytes": sum(p.stat().st_size for p in files), "paths": [p.relative_to(root).as_posix() for p in files]}, indent=2))
