"""Package PNGs for file:// canvas access and index optional music files.

Run from any directory: python3 tools/build_offline.py
Rebuild after adding/replacing PNG assets or local music. No third-party dependencies.
"""
from pathlib import Path
import base64
import hashlib
import json
import re
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
metadata={kind:{p.stem:json.loads(p.read_text()) for p in sorted((ROOT/'assets'/kind).glob('*.json'))} for kind in ['units','portraits']}
files = {}
for extension in ('png', 'webp'):
    for source in sorted((ROOT / 'assets').rglob(f'*.{extension}')):
        if 'offline' not in source.relative_to(ROOT).parts:
            base = source.relative_to(ROOT).with_suffix('').as_posix()
            files.setdefault(base, []).append(extension)
metadata['images'] = files
(ROOT/'assets'/'art-metadata.js').write_text('window.IRON_ART_META='+json.dumps(metadata,separators=(',',':'))+';\n')
music_dir = ROOT / 'assets' / 'music'
music_dir.mkdir(exist_ok=True)
tracks = {}
for extension in ('ogg', 'mp3'):
    for source in sorted(music_dir.glob(f'*.{extension}')):
        if source.is_file() and re.fullmatch(r'[a-z][a-z0-9_]*', source.stem):
            tracks.setdefault(source.stem, []).append(source.name)
(music_dir / 'tracks.js').write_text('const IRON_MUSIC_TRACKS = ' + json.dumps(tracks, indent=2) + ';\n')
print(f'Packaged {len(entries)} images for offline use; refreshed assets/manifest.json')
print(f'Indexed {sum(map(len, tracks.values()))} optional music recordings')
