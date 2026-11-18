# Presentation systems integration

These modules keep the existing script-global architecture and have no new network or package dependency. Tests are `tests/presentation.cjs`. Browser screenshots, audible playback and measured device timings remain pending because browser access was unavailable in this session.

## Load order

- `js/render/quality.js` before `js/render/r3d.js`.
- `js/render/audio.js` keeps its existing position.
- `js/ui/touch.js` after `ui.js`, before `main.js`.
- Add `css/touch.css` after `css/style.css`.
- Mirror these tags in `artifact.html`.

## Quality hooks

`SAVE.settings.graphics` defaults to `'auto'` in new saves and migration. In boot call `QUALITY.init()`. Add a Graphics select in Settings (`auto`, `high`, `low`) whose change handler calls `QUALITY.set(value)`. Show `QUALITY.mode` beside the select.

Use `QUALITY.dpr` wherever map canvas or terrain currently computes devicePixelRatio. Gate terrain baking and the 3D battle environment with `!QUALITY.low`. Call `QUALITY.configureRenderer(renderer)` whenever a renderer is created or its settings change. Set each bloom pass `enabled = !QUALITY.low` and each renderer's shadow map `enabled = !QUALITY.low`. Subscribe to changes if an existing renderer must update immediately.

At the particle insertion point, retain only every second attempted particle when `QUALITY.low` (for example `if (!QUALITY.keepParticle(particleAttempt++)) return;`). This avoids changing gameplay or effect completion promises.

Call `QUALITY.observe(frameIntervalMS, 'map')` / `'battle'` from the visible render loops. Pass the interval between animation-frame timestamps, not just draw CPU time: the debug FPS counter derives from that interval. For separate drawing-cost measurements, record `performance.now()` before and after drawing in the QA harness. `QUALITY.summary()` provides the active mode, renderer, reason and recent interval samples. `?debug` displays the active quality and rolling frame statistics.

Auto chooses Low for software renderers (SwiftShader, llvmpipe, Software, softpipe, Microsoft Basic Renderer) a first visible frame above 100 ms, or sustained median frame intervals above 30 ms after 45 samples. A forced High setting is respected. No claim about actual laptop frame times can be made from simulated tests.

## Score hooks

`SFX` retains `ensure`, `play`, `music`, `setMusicVol`. It adds `phase(phase, chapter)`, `battle(left,right,chapter)` and `themeInfo()`.

In `MAP.phaseStart`, after assigning the phase: `SFX.phase(phase, st.ch)`. In `SCENE.play`, start `const restoreScore=SFX.battle(opts.left, opts.right, G.map?.ch)` and invoke the returned function at completion (prefer a finally block if restructuring error handling). Remove the old unconditional `SFX.music('battle')` after a map exchange so it does not overwrite the restored faction/phase theme. The existing story mood and intermission `music` calls continue working.

Music calls made before the first user gesture only store the requested key. The existing gesture calls to `SFX.ensure()` create/resume audio and start that key. Optional local tracks crossfade in only after their playback succeeds; rejected or absent tracks leave procedural music running. See `assets/prompts/MUSIC.md` for the twelve keys and replacement recording briefs.

## Touch hooks

During boot:

```js
TOUCH.init({skipBattle:()=>SCENE.skip(),fastBattle:()=>SCENE.fastForward()});
```

Expose `skip:()=>{skipAll=true}` and `fastForward:()=>{timeScale=timeScale===1?3:1}` from SCENE. During `MAP.initCanvas`, add:

```js
TOUCH.attachMap(cv,{
  state:()=>st, ui:()=>ui, geom:()=>({T,ox,oy}), toTile, click:onClick,
  preview:t=>{hover=t;if(t)onHover();else ui.path=null;},
  inspect:t=>{hover=t;onHover();}
});
```

Update `toTile` to inverse-transform the canvas point:

```js
const p=TOUCH.localPoint(e,cv);
const x=Math.floor((p.x-ox)/T),y=Math.floor((p.y-oy)/T);
```

The existing bounds checks follow that conversion. Call `TOUCH.resetMap()` after starting/resizing a fresh map, and `TOUCH.revealUnit(ui.sel,{T,ox,oy})` when selection/action menus open on small screens. Keep desktop click handlers; the touch module captures compatibility clicks so a tap cannot also issue a mouse command.

Touch movement requires destination preview followed by the same destination again or Confirm move. Two fingers pinch, plus/minus buttons zoom, one-finger dragging pans, and a 480 ms hold opens tile/unit information. The existing story click listener already supports tapping anywhere. The CSS supplies 44px targets, an under-900px unit bottom sheet, right-side tactical menus, horizontally scrollable intermission tabs, stacked skill trees, safe-area padding and visible battle buttons.

## Verification limits

The pure tests exercise quality selection, software and slow-frame decisions, DPR/particle policy, score scheduling/crossfades/mute routing, local-file fallback and touch confirmation/gesture logic. They do not certify layout, audio quality, touch feel, FPS gains, screenshots or end-to-end chapter play. Those remain explicit acceptance work.
