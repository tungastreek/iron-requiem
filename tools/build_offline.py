"""Package PNG bytes for safe file:// canvas access, without changing the artwork.

Run from any directory: python3 tools/build_offline.py
Rebuild after adding/replacing PNG assets. No third-party dependencies.
"""
from pathlib import Path
import base64
import hashlib
import json
import struct

ROOT = Path(__file__).resolve().parents[1]
entries = []
for source in sorted((ROOT / 'assets').rglob('*.png')):
    if 'offline' in source.parts:
        continue
    rel = source.relative_to(ROOT).as_posix()
    raw = source.read_bytes()
    width, height = struct.unpack('>II', raw[16:24])
    data = 'data:image/png;base64,' + base64.b64encode(raw).decode('ascii')
    target = ROOT / 'assets' / 'offline' / source.relative_to(ROOT / 'assets').with_suffix('.js')
    target.parent.mkdir(parents=True, exist_ok=True)
    key = rel.rsplit('.', 1)[0]
    target.write_text('window.IRON_OFFLINE=window.IRON_OFFLINE||{};window.IRON_OFFLINE[' + json.dumps(key) + ']=' + json.dumps(data) + ';\n')
    entries.append({'path': rel, 'width': width, 'height': height, 'sha256': hashlib.sha256(raw).hexdigest()})
(ROOT / 'assets' / 'manifest.json').write_text(json.dumps(entries, indent=2) + '\n')
print(f'Packaged {len(entries)} images for offline use; refreshed assets/manifest.json')
