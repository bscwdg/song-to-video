# Paper Tide · full worked example

This is the complete nine-shot production case, kept separate from `template/`.

- Runtime: 24.056s / 1920×1080 / 30fps / 722 frames
- Measured tempo: 143.55 BPM
- Cuts: 0 / 3.646 / 5.759 / 7.477 / 10.472 / 13.886 / 17.276 / 20.248 / 22.384 / 24.056s
- Music: user-provided track, **not included**
- Timing data: `timing.json`
- Storyboard: `STORYBOARD.md`

## Run

Put the licensed source track at `public/audio/song.mp3`, generate the SFX, then:

```powershell
npm install
python scripts/generate_sfx.py
npm run typecheck
npm run render
```

The example still uses a global composition timeline rather than the v0.2 scene-props contract. That is intentional: it documents the delivered film. New projects should start from `../../template/`, which uses `timeline.generated.ts`, measured-beat helpers and a scene registry.
