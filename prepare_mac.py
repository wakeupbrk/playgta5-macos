"""Apply reversible, hash-gated Mac settings to separately supplied assets."""
import argparse, hashlib, json, os, shutil, tempfile
from pathlib import Path

BASE = Path(__file__).resolve().parent
ORIGINAL_ENGINE = "11ca8d2c04c5e843d18ff4aea4899d72c86973c6b031df334e67c446b2ae83e0"
PATCHED_ENGINE = "1a588adf2e6697223b01c73b38425d7107c2eb4127d841c05305043d6c4a811b"

def digest(data): return hashlib.sha256(data).hexdigest()

def find_root():
    candidates = [BASE / name / "playgta5.com" for name in ("mirror", ".mirror")]
    found = [path for path in candidates if (path / "index.html").is_file()]
    if len(found) > 1: raise RuntimeError("Both mirror and .mirror exist. Keep one asset tree beside GTAV.app.")
    if not found: raise RuntimeError("Game assets are missing. Add mirror/playgta5.com/index.html or .mirror/playgta5.com/index.html beside GTAV.app. See README.md.")
    return found[0]

def atomic(path, data):
    with tempfile.NamedTemporaryFile(dir=path.parent, prefix=".mac-setup-", delete=False) as handle:
        temporary = Path(handle.name)
        handle.write(data)
    try: os.replace(temporary, path)
    finally: temporary.unlink(missing_ok=True)

LAYER = [("homepage.html", "index.html"), ("cheats.js", "cheats.js"), ("loader.js", "b/8b0b5899ed/loader.js"), ("game.js", "b/8b0b5899ed/game.js")]

def sync_layer(root, backup):
    """Install this repo's page files (menu, trainer, cheats, loader) over the mirror's. The mirror's originals are saved once under backup/layer/."""
    saved_dir = backup / "layer"
    for name, target in LAYER:
        source, dest = BASE / name, root / target
        data = source.read_bytes()
        if dest.exists() and dest.read_bytes() == data: continue
        saved = saved_dir / target
        if dest.exists() and not saved.exists():
            saved.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(dest, saved)
        dest.parent.mkdir(parents=True, exist_ok=True)
        atomic(dest, data)
        print("Installed " + name)

def prepare(glass_fix=True):
    root = find_root()
    engine = root / "b/8b0b5899ed/game.wasm"
    for relative in ("b/8b0b5899ed/loader.js", "b/8b0b5899ed/game.js", "b/8b0b5899ed/io_worker.js", "b/8b0b5899ed/wgpu_worker.js", "b/8b0b5899ed/game.wasm", "data"):
        if not (root / relative).exists(): raise RuntimeError("The mirror is incomplete: missing " + relative)
    patch = json.loads((BASE / "mac-index-patch.json").read_text())
    index = root / "index.html"
    original = index.read_bytes()
    index_hash = digest(original.decode("utf-8").replace("\r\n", "\n").encode("utf-8"))
    ours_hash = digest((BASE / "homepage.html").read_bytes())
    if index_hash not in (patch["original_sha256"], patch["modified_sha256"], ours_hash):
        raise RuntimeError("This mirror's index.html is a different version. No files were changed. This release supports upstream build 8b0b5899ed.")
    with engine.open("rb") as handle:
        if handle.read(8) != b"\0asm\1\0\0\0": raise RuntimeError("Invalid WebAssembly engine.")
    data = engine.read_bytes() if glass_fix else None
    engine_hash = digest(data) if data is not None else None
    if data is not None and engine_hash == ORIGINAL_ENGINE:
        changed = bytearray(data)
        changed[44147366:44151634] = b"\x0f" + b"\x01" * 4267
        if digest(changed) != PATCHED_ENGINE: raise RuntimeError("Engine patch validation failed; no files were changed.")
    else: changed = None
    if shutil.disk_usage(BASE).free < 128 * 1024 * 1024:
        raise RuntimeError("Keep at least 128 MiB free for setup backups.")
    backup = BASE / "work/backups/mac-setup" / root.parent.name
    backup.mkdir(parents=True, exist_ok=True)
    sync_layer(root, backup)
    profile = root / "local-profile.json"
    if not profile.exists():
        atomic(profile, (BASE / "mac-profile.json").read_bytes())
        (backup / "created-profile.txt").write_text(digest(profile.read_bytes()))
    if changed is not None:
        saved = backup / "game.wasm"
        if saved.exists() and digest(saved.read_bytes()) != ORIGINAL_ENGINE: raise RuntimeError("Existing engine backup differs; preserve it before retrying.")
        if not saved.exists(): shutil.copy2(engine, saved)
        atomic(engine, changed)
        print("Applied reversible vehicle-glass workaround.")
    elif glass_fix and engine_hash not in (ORIGINAL_ENGINE, PATCHED_ENGINE):
        print("Engine differs from the supported hash; glass workaround skipped.")
    print("Mac settings ready. Existing custom profiles are preserved.")
    return root

def restore():
    root = find_root()
    backup = BASE / "work/backups/mac-setup" / root.parent.name
    patch = json.loads((BASE / "mac-index-patch.json").read_text())
    for name, target in LAYER:
        saved = backup / "layer" / target
        if saved.exists(): atomic(root / target, saved.read_bytes())
    actions = [("game.wasm", root / "b/8b0b5899ed/game.wasm", PATCHED_ENGINE)]
    pending = []
    for name, path, expected in actions:
        saved = backup / name
        if saved.exists():
            data = saved.read_bytes()
            saved_hash = digest(data)
            original_hash = digest(data.decode("utf-8").replace("\r\n", "\n").encode("utf-8")) if name == "index.html" else saved_hash
            allowed_original = patch["original_sha256"] if name == "index.html" else ORIGINAL_ENGINE
            if original_hash != allowed_original: raise RuntimeError("Invalid backup: " + name)
            current_hash = digest(path.read_bytes())
            if current_hash == saved_hash: continue
            if current_hash != expected: raise RuntimeError("Refusing to overwrite a modified " + name)
            pending.append((path, data))
    for path, data in pending: atomic(path, data)
    marker = backup / "created-profile.txt"
    profile = root / "local-profile.json"
    if marker.exists() and profile.exists() and digest(profile.read_bytes()) == marker.read_text():
        profile.unlink()
    print("Original setup files restored. Backups and savegames retained.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-glass-fix", action="store_true")
    parser.add_argument("--restore", action="store_true")
    options = parser.parse_args()
    if options.restore: restore()
    else: prepare(not options.no_glass_fix)
