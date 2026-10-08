"""Local mirror server: isolation headers, byte ranges, and engine batch I/O."""
import argparse, gzip, io, json, mimetypes, os, re, threading, time, webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote, parse_qs

BASE = Path(__file__).resolve().parent
ROOT = next((BASE / name / 'playgta5.com' for name in ('mirror', '.mirror') if (BASE / name / 'playgta5.com/index.html').is_file()), BASE / 'mirror/playgta5.com')
WORK = BASE / 'work'
LOG_LOCK = threading.Lock()
mimetypes.add_type('application/wasm', '.wasm')
mimetypes.add_type('text/javascript', '.js')

class Handler(SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def setup(self):
        super().setup()
        self.connection.settimeout(30)

    def log_message(self, format, *args):
        # Thousands of successful streaming reads need no console work.
        if args and str(args[1] if len(args) > 1 else '') not in ('200', '204', '206', '304'):
            super().log_message(format, *args)

    def do_GET(self):
        if urlsplit(self.path).path == '/__gtav_health':
            body = json.dumps({'project': str(BASE), 'pid': os.getpid()}).encode()
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
        if urlsplit(self.path).path in ('/', '/index.html', '/local-profile.json'):
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
        if url.path == '/log':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 <= length <= 256000: raise ValueError('log too large')
                body = self.rfile.read(length).decode('utf-8', 'replace')
                # Retain performance, I/O health and errors; omit repetitive engine chatter.
                lines = [line for line in body.splitlines() if re.search(r'fps:|stutter:|CRASH|THREAD ERROR|validation|pipeline failed|\[page|\[io\]|world shown|GPU memory|THREAD ERROR|Aborted|out of memory', line, re.I)]
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
