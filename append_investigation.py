"""Append newly created evidence to the existing portable ZIP, then refresh SHA256."""
import hashlib, json, time, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ARCHIVE = ROOT / 'playgta5-offline-2026-10-06.zip'
PREFIX = 'playgta5-offline/'
NAMES = ['INVESTIGATION.md', 'ENGINE_INVESTIGATION.md', 'inspect_assets.py',
         'engine_static_evidence.py', 'append_investigation.py', 'snapshot/asset-evidence.json',
         'snapshot/engine-evidence.json', 'snapshot/domain-rdap.json']

def main():
    records = []
    original_entries = {}
    with zipfile.ZipFile(ARCHIVE, 'a', compression=zipfile.ZIP_STORED, allowZip64=True) as archive:
        original_entries = {i.filename: (i.CRC, i.file_size, i.header_offset) for i in archive.infolist()}
        for name in NAMES:
            if PREFIX + name in original_entries:
                raise ValueError('Already appended; refusing duplicate archive entries: ' + name)
            body = (ROOT / name).read_bytes()
            archive.writestr(PREFIX + name, body)
            records.append({'path': name, 'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()})
        manifest = json.dumps({'scope': 'Evidence appended after the original asset bundle; original entries unchanged.',
                               'files': records}, indent=2).encode()
        archive.writestr(PREFIX + 'snapshot/investigation-manifest.json', manifest)
    (ROOT / 'snapshot/investigation-manifest.json').write_bytes(manifest)
    with zipfile.ZipFile(ARCHIVE) as archive:
        current = {i.filename: (i.CRC, i.file_size, i.header_offset) for i in archive.infolist()}
        assert all(current[name] == value for name, value in original_entries.items())
        for rec in records:
            body = archive.read(PREFIX + rec['path'])
            assert hashlib.sha256(body).hexdigest() == rec['sha256']
        assert archive.read(PREFIX + 'snapshot/investigation-manifest.json') == manifest
    digest = hashlib.sha256()
    read_bytes = 0
    last = time.monotonic()
    with ARCHIVE.open('rb') as source:
        while chunk := source.read(8 * 1024 * 1024):
            digest.update(chunk)
            read_bytes += len(chunk)
            if time.monotonic() - last > 10:
                print('Final ZIP SHA256: %.1f%%' % (read_bytes / ARCHIVE.stat().st_size * 100), flush=True)
                last = time.monotonic()
    (ROOT / (ARCHIVE.name + '.sha256')).write_text(digest.hexdigest() + '  ' + ARCHIVE.name + '\n')
    report_file = ROOT / 'snapshot/package-report.json'
    report = json.loads(report_file.read_text())
    report.update(bytes=ARCHIVE.stat().st_size, sha256=digest.hexdigest(), archive_entries=len(current),
                  investigation_files_added=len(records) + 1,
                  appended_evidence_validation='Original entry CRC/size/header offsets unchanged; all new entries read and SHA256 checked.')
    report_file.write_text(json.dumps(report, indent=2))
    (ROOT / 'snapshot/package-status.json').write_text(json.dumps({'phase': 'complete', **report}, indent=2))
    print(json.dumps(report, indent=2), flush=True)

if __name__ == '__main__':
    main()
