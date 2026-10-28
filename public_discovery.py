"""Bounded same-origin public-surface discovery for playgta5.com.

Inputs are the completed mirror inventory.  It deliberately avoids wordlists and
does not attempt authentication or access-control bypasses.
"""
import concurrent.futures as futures
import hashlib
import html.parser
import json
import os
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MIRROR = ROOT / "mirror" / "playgta5.com"
SNAPSHOT = ROOT / "snapshot"
BASE = "https://playgta5.com"
UA = "curl/8.0 public-mirror-discovery"
TIMEOUT = 25
MAX_WORKERS = 16

known = json.loads((SNAPSHOT / "manifest-sha256.json").read_text(encoding="utf-8"))
known_paths = {x["path"] for x in known}
homepage = (ROOT / "homepage.html").read_bytes()
homepage_hash = hashlib.sha256(homepage).hexdigest()
lock = threading.Lock()
attempts = []
added = []

def norm_path(path):
    path = urllib.parse.unquote(urllib.parse.urlsplit(path).path)
    if not path.startswith("/"):
        path = "/" + path
    return path

def request(path):
    url = BASE + path
    started = time.monotonic()
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
            body = res.read()
            out = {"url": url, "path": path, "status": res.status,
                   "content_type": res.headers.get("Content-Type", ""),
                   "bytes": len(body), "body": body,
                   "elapsed_ms": round((time.monotonic() - started) * 1000)}
    except urllib.error.HTTPError as e:
        out = {"url": url, "path": path, "status": e.code,
               "content_type": e.headers.get("Content-Type", ""), "bytes": 0,
               "elapsed_ms": round((time.monotonic() - started) * 1000)}
    except Exception as e:
        out = {"url": url, "path": path, "status": None, "error": str(e), "bytes": 0,
               "elapsed_ms": round((time.monotonic() - started) * 1000)}
    with lock:
        attempts.append({k: v for k, v in out.items() if k != "body"})
    return out

def fallback(result):
    body = result.get("body", b"")
    if hashlib.sha256(body).hexdigest() == homepage_hash:
        return "homepage-sha256"
    text = body[:4096].lower()
    if b'<div id="loading"' in text and b"playgta5" in text:
        return "homepage-signature"
    return None

class Refs(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(); self.refs = []
    def handle_starttag(self, tag, attrs):
        for k, v in attrs:
            if k.lower() in ("href", "src", "action", "poster") and v:
                self.refs.append(v)

def same_origin_refs(path, body, content_type):
    if not ("text/" in content_type or "javascript" in content_type or path.endswith((".js", ".css", ".html", ".xml", ".webmanifest"))):
        return set()
    try: text = body.decode("utf-8", "ignore")
    except Exception: return set()
    p = Refs()
    try: p.feed(text)
    except Exception: pass
    p.refs += re.findall(r"(?:['\"])(/[^'\"\\\\?# ]+|https?://playgta5\.com/[^'\"\\\\?# ]+)", text)
    out = set()
    for ref in p.refs:
        u = urllib.parse.urljoin(BASE + path, ref)
        s = urllib.parse.urlsplit(u)
        if s.scheme == "https" and s.netloc == "playgta5.com":
            clean = norm_path(s.path)
            if clean and clean not in known_paths:
                out.add(clean)
    return out

def save_addition(result, provenance):
    path, body = result["path"], result["body"]
    if path in known_paths or fallback(result): return False
    target = MIRROR.joinpath(*path.lstrip("/").split("/"))
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists(): return False
    target.write_bytes(body)
    item = {"path": path, "url": result["url"], "bytes": len(body),
            "sha256": hashlib.sha256(body).hexdigest(), "content_type": result["content_type"],
            "provenance": provenance}
    with lock:
        added.append(item); known_paths.add(path)
    return True

def run_batch(paths, provenance):
    refs = set()
    with futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        for result in pool.map(request, sorted(set(paths))):
            if result.get("status") == 200 and "body" in result:
                is_dir = result["path"].endswith("/")
                if not is_dir: save_addition(result, provenance)
                refs.update(same_origin_refs(result["path"], result["body"], result["content_type"]))
    return refs

# Conventional public discovery endpoints and build references visible in root assets.
standard = [
    "/robots.txt", "/sitemap.xml", "/sitemap_index.xml", "/sitemap-index.xml",
    "/favicon.ico", "/favicon.png", "/apple-touch-icon.png", "/site.webmanifest",
    "/manifest.webmanifest", "/manifest.json", "/browserconfig.xml", "/humans.txt",
    "/security.txt", "/.well-known/security.txt",
]
builds = sorted({p.split("/")[2] for p in known_paths if p.startswith("/b/") and p.count("/") >= 2})
scripts = [p for p in known_paths if p.endswith((".js", ".css", ".html"))]
maps = [p + ".map" for p in scripts]
for b in builds:
    standard += [f"/b/{b}/manifest.json", f"/b/{b}/manifest.webmanifest", f"/b/{b}/sw.js", f"/b/{b}/service-worker.js"]

# Every existing path's directory gets exactly one GET. This detects enabled listing/index pages.
dirs = sorted({p.rsplit("/", 1)[0] + "/" for p in known_paths if p.count("/") >= 2})
new_refs = run_batch(standard + maps, "conventional-or-runtime-derived")
new_refs.update(run_batch(dirs, "known-directory-listing-check"))

# Follow only newly surfaced same-origin references to a fixed point.
rounds = 0
while new_refs and rounds < 4:
    todo = {p for p in new_refs if p not in known_paths}
    new_refs = run_batch(todo, "reachable-same-origin-reference") if todo else set()
    rounds += 1

attempts.sort(key=lambda x: x["path"])
added.sort(key=lambda x: x["path"])
status_counts = {}
for x in attempts: status_counts[str(x.get("status"))] = status_counts.get(str(x.get("status")), 0) + 1
report = {
    "base": BASE, "run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "user_agent": UA, "network_concurrency": MAX_WORKERS,
    "known_input_paths": len(known), "known_derived_directories": len(dirs),
    "build_ids": builds, "attempt_count": len(attempts), "status_counts": status_counts,
    "added_count": len(added), "added_bytes": sum(x["bytes"] for x in added),
    "attempts": attempts,
    "coverage": ["robots/sitemaps/icons/web manifests/.well-known security", "runtime source-map candidates", "build-local manifest/service-worker candidates", "one trailing-slash request for every directory derived from the 12,480-path inventory", "same-origin references extracted from successful textual responses"],
    "limits": ["No authentication, credentials, bypasses, parameter fuzzing, or blind filename dictionaries.", "A non-listing directory response cannot prove undisclosed children absent.", "References embedded only in binary assets or constructed dynamically beyond inspected textual responses are outside this crawl.", "HTTP success is retained only when it is not the known generic homepage fallback; non-200 results are logged but not downloaded."],
}
(SNAPSHOT / "discovery-added.json").write_text(json.dumps(added, indent=2) + "\n", encoding="utf-8")
(SNAPSHOT / "discovery-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
(SNAPSHOT / "DISCOVERY_REPORT.md").write_text(
    "# Public discovery report\n\n"
    f"- Input inventory: {len(known)} paths; derived directories: {len(dirs)}.\n"
    f"- Requests: {len(attempts)}; status counts: {status_counts}.\n"
    f"- Additions: {len(added)} files / {sum(x['bytes'] for x in added)} bytes.\n"
    "- Scope: standard discovery files, source-map/build candidates, every known directory, then reachable same-origin textual references.\n"
    "- Limits: no authenticated/private probing or blind dictionary enumeration; directory non-listing does not establish that no unlinked children exist.\n",
    encoding="utf-8")
print(json.dumps({"attempts": len(attempts), "status_counts": status_counts, "added": added}, indent=2))
