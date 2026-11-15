"""Verify the frozen, derived-only public dataset. Does not fetch vendor data."""
import csv, hashlib, json, pathlib, datetime, math
root = pathlib.Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'data/provenance.json').read_text())
b = (root / 'web/data/shares.csv').read_bytes()
assert hashlib.sha256(b).hexdigest() == manifest['result_sha256'], 'derived data fingerprint changed'
rows = list(csv.DictReader(b.decode().splitlines()))
assert len(rows) == 260
expected = {f'2026-11-{d:02d}' for d in (2,3,4,5,6,9,10,11,12,13)}
for asset in ('SPY', 'AAPL'):
    sessions = {r['date'] for r in rows if r['asset'] == asset}
    assert sessions == expected
    for day in sessions:
        group = [r for r in rows if r['asset'] == asset and r['date'] == day]
        assert sorted(int(r['bin']) for r in group) == list(range(13))
        assert datetime.date.fromisoformat(day).weekday() < 5
        for measure in ('variance_share', 'volume_share'):
            values = [float(r[measure]) for r in group]
            assert all(math.isfinite(x) and 0 <= x <= 1 for x in values)
            assert abs(sum(values) - 1) < 1e-12
assert not manifest['raw_redistributed']
print('frozen derived dataset: SHA256, 20 sessions, 260 unique bins, shares validated')
