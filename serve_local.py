"""Local mirror server: isolation headers, byte ranges, and engine batch I/O."""
import argparse, gzip, io, json, mimetypes, os, re, threading, time, webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote, parse_qs

ROOT = Path(__file__).resolve().parent / 'mirror' / 'playgta5.com'
PROJECT = ROOT.parent.parent
WORK = PROJECT / 'work'
MODS = PROJECT / 'mods'                # one folder per mod: mods/<id>/mod.json (+ entry script, + overrides/<game path>)
USERDATA = WORK / 'userdata'           # disk copy of the engine's savegames and settings (the browser keeps its own copy in IndexedDB)
USERDATA_HISTORY = WORK / 'userdata-history'
MODS_STATE = WORK / 'mods-state.json'
STORY_POS = WORK / 'story-position.json'   # where the player stood when the newest Story save was written (see /storypos)
LAST_POS = {}                              # latest position the trainer reported from free roam (in memory)
LOG_LOCK = threading.Lock()
mimetypes.add_type('application/wasm', '.wasm')
mimetypes.add_type('text/javascript', '.js')


def userdata_target(virtual):
    """'/userdata/Documents/...' -> a path inside work/userdata, or None when it is not a plain relative path."""
    if not isinstance(virtual, str) or not virtual.startswith('/userdata/') or len(virtual) > 400 or '\x00' in virtual:
        return None
    rel = virtual[len('/userdata/'):]
    if not rel or rel.endswith('/') or any(part in ('', '.', '..') for part in rel.split('/')):
        return None
    target = (USERDATA / rel).resolve()
    return target if target.is_relative_to(USERDATA.resolve()) else None

def read_mods_state():
    try:
        data = json.loads(MODS_STATE.read_text())
        enabled = data.get('enabled', {})
        return {'enabled': {k: bool(v) for k, v in enabled.items() if isinstance(k, str)}}
    except (OSError, ValueError, AttributeError):
        return {'enabled': {}}

def scan_mods():
    """Every mods/<id>/mod.json that parses. A broken manifest is listed with an error instead of being skipped silently."""
    found = []
    if not MODS.is_dir():
        return found
    enabled = read_mods_state()['enabled']
    for folder in sorted(MODS.iterdir()):
        if not folder.is_dir() or folder.name.startswith(('.', '_')):
            continue
        entry = {'id': folder.name, 'name': folder.name, 'version': '', 'author': '', 'description': '', 'entry': '', 'modes': [], 'overrides': (folder / 'overrides').is_dir(), 'enabled': bool(enabled.get(folder.name)), 'error': ''}
        try:
            manifest = json.loads((folder / 'mod.json').read_text())
            for key in ('name', 'version', 'author', 'description'):
                if isinstance(manifest.get(key), str): entry[key] = manifest[key][:400]
            if isinstance(manifest.get('modes'), list): entry['modes'] = [m for m in manifest['modes'] if m in ('story', 'sandbox')]
            ent = manifest.get('entry', '')
            if ent:
                target = (folder / ent).resolve()
                if isinstance(ent, str) and target.is_file() and target.is_relative_to(folder.resolve()): entry['entry'] = ent
                else: entry['error'] = 'entry script not found: ' + str(ent)[:120]
        except (OSError, ValueError, AttributeError) as e:
            entry['error'] = 'mod.json: ' + str(e)[:160]
        found.append(entry)
    return found

_overlay_cache = {'t': 0.0, 'dirs': []}
def overlay_dirs():
    """overrides/ folders of the enabled mods (cached 2 s: the engine makes thousands of requests)."""
    now = time.time()
    if now - _overlay_cache['t'] > 2.0:
        dirs = []
        try:
            enabled = read_mods_state()['enabled']
            for mod_id, on in enabled.items():
                d = MODS / mod_id / 'overrides'
                if on and d.is_dir() and not mod_id.startswith(('.', '_')): dirs.append(d.resolve())
        except OSError:
            dirs = []
        _overlay_cache.update(t=now, dirs=dirs)
    return _overlay_cache['dirs']

def send_json(handler, obj, status=200):
    body = json.dumps(obj).encode()
    handler.send_response(status)
    handler.send_header('Content-Type', 'application/json')
    handler.send_header('Content-Length', str(len(body)))
    handler.send_header('Cache-Control', 'no-store')
    handler.end_headers()
    handler.wfile.write(body)

class Handler(SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def setup(self):
        super().setup()
        self.connection.settimeout(30)

    def log_message(self, format, *args):
        # Thousands of successful streaming reads need no console work.
        if args and str(args[1] if len(args) > 1 else '') not in ('200', '204', '206', '304'):
            super().log_message(format, *args)

    def translate_path(self, path):
        clean = unquote(urlsplit(path).path)
        if clean.startswith('/mods/files/'):
            target = (MODS / clean[len('/mods/files/'):]).resolve()
            if target.is_relative_to(MODS.resolve()):
                return str(target)
            return str(MODS / '__invalid__')
        for d in overlay_dirs():
            candidate = (d / clean.lstrip('/')).resolve()
            if candidate.is_relative_to(d) and candidate.is_file():
                return str(candidate)
        return super().translate_path(path)

    def do_GET(self):
        route = urlsplit(self.path)
        if route.path == '/userdata/list':
            files = []
            if USERDATA.is_dir():
                for f in USERDATA.rglob('*'):
                    if f.is_file():
                        st = f.stat()
                        files.append({'path': '/userdata/' + f.relative_to(USERDATA).as_posix(), 'mtime': int(st.st_mtime * 1000), 'size': st.st_size})
            return send_json(self, files)
        if route.path == '/userdata/file':
            target = userdata_target(parse_qs(route.query).get('path', [''])[0])
            if target is None or not target.is_file():
                self.send_error(404)
                return
            body = target.read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', 'application/octet-stream')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(body)
            return
        if route.path == '/storypos':
            # The saved position, only if it belongs to the newest save on disk (written within 5 s of it); otherwise 'valid': false and the trainer leaves the player where the game put them.
            rec = {}
            try: rec = json.loads(STORY_POS.read_text())
            except (OSError, ValueError): pass
            newest = 0
            if USERDATA.is_dir():
                for f in USERDATA.rglob('SGTA*'):
                    if f.is_file() and not f.name.endswith('.bak'): newest = max(newest, int(f.stat().st_mtime * 1000))
            rec['valid'] = bool(rec.get('x') is not None and newest and abs(rec.get('saveMtime', 0) - newest) < 5000)
            rec['newest'] = newest
            return send_json(self, rec)
        if route.path == '/mods/list':
            return send_json(self, {'mods': scan_mods(), 'dir': str(MODS), 'api': 1})
        if route.path == '/mods/state':
            return send_json(self, read_mods_state())
        if urlsplit(self.path).path == '/state':
            f = WORK / 'session-state.json'
            body = f.read_bytes() if f.exists() else b''
            self.send_response(200 if body else 404)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(body)
            return
        if urlsplit(self.path).path == '/__gtav_health':
            body = json.dumps({'project': str(ROOT.parent.parent), 'pid': os.getpid()}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def __init__(self, *args, **kwargs):
        self.byte_range = None
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        self.send_header('Accept-Ranges', 'bytes')
        if urlsplit(self.path).path in ('/', '/index.html', '/local-profile.json', '/data/manifest.json'):
            self.send_header('Cache-Control', 'no-store')
        elif self.path.split('?')[0].endswith(('.js', '.wasm')):
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def send_head(self):
        self.byte_range = None  # Reset between requests on a persistent connection.
        if not self.headers.get('Range'):
            return super().send_head()
        path = Path(self.translate_path(self.path))
        if not path.is_file():
            self.send_error(404)
            return None
        size = path.stat().st_size
        match = re.fullmatch(r'bytes=(\d*)-(\d*)', self.headers['Range'])
        if not match or not any(match.groups()):
            self.send_error(416)
            return None
        start = int(match[1]) if match[1] else max(0, size - int(match[2]))
        end = min(size - 1, int(match[2])) if match[1] and match[2] else size - 1
        if start >= size or end < start:
            self.send_response(416)
            self.send_header('Content-Range', 'bytes */%d' % size)
            self.send_header('Content-Length', '0')
            self.end_headers()
            return None
        self.byte_range = (start, end)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(str(path)))
        self.send_header('Content-Range', 'bytes %d-%d/%d' % (start, end, size))
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()
        source = path.open('rb')
        source.seek(start)
        return source

    def copyfile(self, source, outputfile):
        if self.byte_range is None:
            return super().copyfile(source, outputfile)
        remaining = self.byte_range[1] - self.byte_range[0] + 1
        while remaining:
            chunk = source.read(min(1024 * 1024, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)

    def do_POST(self):
        url = urlsplit(self.path)
        if url.path in ('/profile', '/local-profile.json'):
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 <= length <= 65536: raise ValueError('profile too large')
                body = self.rfile.read(length)
                json.loads(body) # validate json
                (ROOT / 'local-profile.json').write_bytes(body)
                try: (ROOT.parent.parent / 'mac-profile.json').write_bytes(body)
                except Exception: pass
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', '11')
                self.end_headers()
                self.wfile.write(b'{"ok":true}')
            except Exception as e:
                self.send_error(400, str(e))
            return
        if url.path == '/state':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 16384: raise ValueError('state size')
                body = self.rfile.read(length)
                json.loads(body)
                with LOG_LOCK:
                    WORK.mkdir(exist_ok=True)
                    f = WORK / 'session-state.json'
                    if f.exists(): f.replace(WORK / 'session-state.prev.json')
                    tmp = WORK / 'session-state.tmp'
                    tmp.write_bytes(body); tmp.replace(f)
                self.send_response(204); self.send_header('Content-Length', '0'); self.end_headers()
            except (ValueError, OSError):
                self.close_connection = True
                self.send_error(400, 'invalid state')
            return
        if url.path == '/storypos':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 2048: raise ValueError('size')
                d = json.loads(self.rfile.read(length))
                LAST_POS.clear()
                LAST_POS.update({k: d[k] for k in ('m', 'x', 'y', 'z', 'h', 'tg', 'tb', 'hp', 'ar', 'hr', 'mn', 'vm') if k in d}, t=time.time() * 1000)
                self.send_response(204); self.send_header('Content-Length', '0'); self.end_headers()
            except (ValueError, OSError):
                self.close_connection = True
                self.send_error(400, 'invalid position')
            return
        if url.path == '/userdata/file':
            try:
                qs = parse_qs(url.query)
                target = userdata_target(qs.get('path', [''])[0])
                length = int(self.headers.get('Content-Length', '0'))
                if target is None or not 0 <= length <= 16 * 1024 * 1024: raise ValueError('bad userdata request')
                mtime_ms = int(qs.get('mtime', ['0'])[0] or 0)
                body = self.rfile.read(length)
                with LOG_LOCK:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    if target.exists() and target.read_bytes() != body:
                        # Keep the five previous versions of every file: a bad save can never be the only copy.
                        USERDATA_HISTORY.mkdir(parents=True, exist_ok=True)
                        stem = target.relative_to(USERDATA.resolve()).as_posix().replace('/', '__')
                        old = sorted(USERDATA_HISTORY.glob(stem + '.*'))
                        target.replace(USERDATA_HISTORY / (stem + '.' + time.strftime('%Y%m%d-%H%M%S')))
                        for extra in old[:-4]: extra.unlink(missing_ok=True)
                    tmp = target.with_name(target.name + '.tmp')
                    tmp.write_bytes(body); tmp.replace(target)
                    if mtime_ms > 0: os.utime(target, (mtime_ms / 1000, mtime_ms / 1000))
                    # A Story save file just arrived: remember where the player was (reported within the last 45 s from free roam) as belonging to this save.
                    if '/SGTA' in qs.get('path', [''])[0] and not target.name.endswith('.bak') and LAST_POS.get('x') is not None and time.time() * 1000 - LAST_POS.get('t', 0) < 45000:
                        STORY_POS.write_text(json.dumps(dict(LAST_POS, saveMtime=int(target.stat().st_mtime * 1000), save=target.name)))
                self.send_response(204); self.send_header('Content-Length', '0'); self.end_headers()
            except (ValueError, OSError):
                self.close_connection = True
                self.send_error(400, 'invalid userdata')
            return
        if url.path == '/userdata/delete':
            # Never lose a save: a delete moves the disk copy into userdata-history.
            try:
                target = userdata_target(parse_qs(url.query).get('path', [''])[0])
                if target is None: raise ValueError('bad path')
                with LOG_LOCK:
                    if target.is_file():
                        USERDATA_HISTORY.mkdir(parents=True, exist_ok=True)
                        stem = target.relative_to(USERDATA.resolve()).as_posix().replace('/', '__')
                        target.replace(USERDATA_HISTORY / (stem + '.deleted-' + time.strftime('%Y%m%d-%H%M%S')))
                self.send_response(204); self.send_header('Content-Length', '0'); self.end_headers()
            except (ValueError, OSError):
                self.close_connection = True
                self.send_error(400, 'invalid userdata path')
            return
        if url.path == '/mods/state':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 16384: raise ValueError('state size')
                data = json.loads(self.rfile.read(length))
                enabled = data.get('enabled', {})
                if not isinstance(enabled, dict): raise ValueError('enabled')
                clean = {k: bool(v) for k, v in enabled.items() if isinstance(k, str) and re.fullmatch(r'[A-Za-z0-9._-]{1,80}', k)}
                with LOG_LOCK:
                    WORK.mkdir(exist_ok=True)
                    tmp = WORK / 'mods-state.tmp'
                    tmp.write_text(json.dumps({'enabled': clean}, indent=1)); tmp.replace(MODS_STATE)
                    _overlay_cache['t'] = 0.0
                return send_json(self, {'enabled': clean})
            except (ValueError, OSError, AttributeError):
                self.close_connection = True
                self.send_error(400, 'invalid mods state')
            return
        if url.path == '/log':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 <= length <= 256000: raise ValueError('log too large')
                body = self.rfile.read(length).decode('utf-8', 'replace')
                # Retain performance, I/O health and errors; omit repetitive engine chatter.
                lines = [line for line in body.splitlines() if re.search(r'fps:|stutter:|CRASH|THREAD ERROR|validation|pipeline failed|\[page|\[io\]|world shown|GPU memory|THREAD ERROR|Aborted|out of memory|\[cheats|\[trainer', line, re.I)]
                if lines:
                    with LOG_LOCK:
                        WORK.mkdir(exist_ok=True)
                        log = WORK / 'game-diagnostics.log'
                        if log.exists() and log.stat().st_size > 5 * 1024 * 1024:
                            log.replace(WORK / 'game-diagnostics.previous.log')
                        with log.open('a') as out:
                            out.write(time.strftime('%Y-%m-%d %H:%M:%S') + ' ' + '\n'.join(lines) + '\n')
                self.send_response(204)
                self.send_header('Content-Length', '0')
                self.end_headers()
            except (ValueError, OSError):
                self.close_connection = True
                self.send_error(400, 'invalid diagnostic log')
            return
        if url.path != '/data/batch':
            self.close_connection = True
            self.send_error(404)
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length < 0: raise ValueError('negative length')
        except ValueError:
            self.close_connection = True
            self.send_error(400, 'invalid content length')
            return
        if length > 1024 * 1024:
            self.close_connection = True
            self.send_error(413)
            return
        try:
            runs = json.loads(self.rfile.read(length))
            if not isinstance(runs, list) or len(runs) > 1000:
                raise ValueError('invalid batch')
            selected = []
            data_root = (ROOT / 'data').resolve()
            for name, start, end in runs:
                if not isinstance(name, str) or type(start) is not int or type(end) is not int:
                    raise ValueError('invalid file/range types')
                file = (data_root / name).resolve()
                if not file.is_relative_to(data_root) or start < 0 or end < start:
                    raise ValueError('invalid file/range')
                selected.append((file, start, max(0, min(end + 1, file.stat().st_size) - start)))
            total = sum(n for _, _, n in selected)
            if total > 64 * 1024 * 1024:
                raise ValueError('batch exceeds 64 MiB')
            output = io.BytesIO()
            for file, start, n in selected:
                with file.open('rb') as source:
                    source.seek(start)
                    output.write(source.read(n))
            body = output.getvalue()
            compressed = parse_qs(url.query).get('gz') == ['1']
            if compressed:
                body = gzip.compress(body, compresslevel=1)
            self.send_response(200)
            self.send_header('Content-Type', 'application/octet-stream')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('X-Run-Lengths', ','.join(str(n) for _, _, n in selected))
            if compressed:
                self.send_header('Content-Encoding', 'gzip')
            self.end_headers()
            self.wfile.write(body)
        except (ValueError, TypeError, OSError) as exc:
            self.send_error(400, str(exc))

if __name__ == '__main__':
    args = argparse.ArgumentParser()
    args.add_argument('--port', type=int, default=8000)
    args.add_argument('--open', action='store_true', help='open the default browser after binding')
    options = args.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', options.port), Handler)
    address = 'http://localhost:%d/' % server.server_port
    print('Local mirror: %s (Ctrl+C to stop)' % address, flush=True)
    if options.open:
        webbrowser.open(address)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
