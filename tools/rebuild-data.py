"""Offline regeneration from privately held vendor sample CSVs. Never copies raw data."""
import pathlib, json, hashlib, subprocess, sys
root=pathlib.Path(__file__).resolve().parents[1]
if len(sys.argv)!=3:
    raise SystemExit('Usage: python3 tools/rebuild-data.py /private/SPY_1min.csv /private/AAPL_1min.csv')
manifest=json.loads((root/'data/provenance.json').read_text())
parts=[]
for inp,arg in zip(manifest['inputs'],sys.argv[1:]):
    p=pathlib.Path(arg).resolve()
    if hashlib.sha256(p.read_bytes()).hexdigest()!=inp['csv_sha256']:
        raise SystemExit('Source fingerprint mismatch. Samples rotate; this input is not the pinned sample.')
    s=subprocess.check_output(['java','-cp',str(root/'build/classes'),'daymark.Aggregate',inp['asset'],str(p)],text=True)
    parts.append(s if not parts else s.split('\n',1)[1])
b=''.join(parts).encode()
if hashlib.sha256(b).hexdigest()!=manifest['result_sha256']:
    raise SystemExit('Rebuilt results differ from the frozen manifest; no file written.')
(root/'web/data/shares.csv').write_bytes(b)
print('private source to public derived results: byte-exact')
