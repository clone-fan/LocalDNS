"""Build a UI update ZIP from a fresh clone, using only Python's standard library."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import hashlib, json

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'VERSION.json').read_text(encoding='utf-8'))
output = root / 'dist'
output.mkdir(exist_ok=True)
name = 'LocalDNS_UI_' + version['uiVersion'] + '_Update.zip'
payload = {'ui/' + file.relative_to(root / '_src/ui').as_posix():file.read_bytes() for file in sorted((root / '_src/ui').rglob('*')) if file.is_file()}
payload['ui/version.json'] = (json.dumps(version,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
payload['install-ui.sh'] = (root / 'tools/install-ui.sh').read_bytes()
payload['VERSION.txt'] = ('LocalDNS UI '+version['uiVersion']+'\nBackend '+version['backendVersion']+'\n').encode()
payload['release.json'] = (json.dumps(dict(version,packageType='ui-update'),ensure_ascii=False,indent=2)+'\n').encode('utf-8')
payload['README.md'] = (root / 'INSTALL.md').read_bytes()
payload['CHANGELOG.md'] = (root / 'CHANGELOG.md').read_bytes()
payload['MANIFEST.sha256'] = ''.join(f'{hashlib.sha256(data).hexdigest()}  {path}\n' for path,data in sorted(payload.items())).encode()
archive = output / name
with ZipFile(archive,'w',ZIP_DEFLATED) as z:
    for path,data in sorted(payload.items()):
        info=ZipInfo(path);info.create_system=3;info.compress_type=ZIP_DEFLATED
        info.external_attr=(0o100755 if path.endswith('.sh') else 0o100644)<<16
        z.writestr(info,data)
with ZipFile(archive) as z:
    if z.testzip() is not None:raise RuntimeError('ZIP integrity verification failed')
    for path,data in payload.items():
        if z.read(path)!=data:raise RuntimeError('Archive mismatch: '+path)
digest=hashlib.sha256(archive.read_bytes()).hexdigest()
(output / 'SHA256SUMS.txt').write_text(f'{digest}  {name}\n',encoding='utf-8')
print(name)
print(digest)
