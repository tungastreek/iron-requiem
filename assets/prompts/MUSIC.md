# Optional local score

The game synthesizes all twelve themes in WebAudio. To override a theme, save a looping recording as `assets/music/<key>.ogg` or `assets/music/<key>.mp3`, run `python3 tools/build_offline.py` to update the track list, then reload the page. If both recordings are present, the game tries Ogg first. Themes without a recording use the synthesized score. Keep the beginning and end suitable for a seamless loop, omit vocals and copyrighted melodies, and normalize all files to comparable loudness.

| Key | Procedural theme and prompt for a replacement recording |
| --- | --- |
| title | **Iron and Light**, 92 BPM. A solemn minor-key mecha adventure overture: warm low strings, clear bell-like lead, restrained marching rhythm, rising light in the final phrase. |
| calm | **Forty Hands Aboard**, 76 BPM. Intimate major-key intermission music for a lived-in starship: soft electric piano, warm bass, spare melody, no percussion. |
| tense | **The Redacted Line**, 100 BPM. Low ostinato, nervous minor seconds, sparse mechanical percussion; investigative unease without a combat climax. |
| sad | **The Empty Channel**, 62 BPM. A falling solo melody with generous silence, gentle sustained harmony and no drums; grief remembered rather than sentimental spectacle. |
| hope | **Fourth Dawn**, 104 BPM. Bright major-key fleet theme: ascending motif, steady bass and modest snare rhythm, human and optimistic. |
| player | **Open Corridor**, 124 BPM. Tactical initiative: agile minor-key lead, active eighth-note bass, crisp backbeat, a melody that can loop through long decisions. |
| enemy | **Emergency Directive**, 116 BPM. Threatening repeating low motif, clipped brass/synth lead and an uneven kick pattern, disciplined rather than chaotic. |
| concord | **Order Is Mercy**, 104 BPM. Militaristic minor-key march with repeated brass calls, double snare strokes and a heavy regular bass. |
| free_states | **A Free Sky**, 140 BPM. Defiant instrumental rock: bright distorted lead, driving bass, continuous closed hats, energy without imitation of any existing song. |
| ourobor | **Under the Cradle**, 72 BPM. Organic low drone, widely spaced sub-bass and irregular hand-drum pulses; a distant flute/bell motif suggests a living collective. |
| vael | **The Thousand-Year Choir**, 84 BPM. Wordless synthetic choir, suspended minor harmonies, a high descending motif and sparse distant percussion. |
| final_boss | **Answer the Silence**, 152 BPM. Fast entropic final battle: urgent ascending/descending lead, pulsing low bass, relentless percussion and a persistent hopeful harmonic voice. |

Chapter numbers transpose the synthesized arrangements by a small interval, providing related chapter variations. Faction themes take over during exchanges and the phase theme returns afterward. All sources share the music-volume control and crossfade between changes.
