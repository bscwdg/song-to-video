# Validation

## Template independence

- `template/` contains two generic scenes: `world` and `split`.
- It contains no `Paper Tide` BPM, cut times, lyrics or nine-shot imports.
- Song-specific source lives only in `examples/paper-tide/`.

## Code generation

Tested against the 27.118s source container:

```text
duration:          27.1184s
musical_body_end:  24.1488s
method:            trim-isolated-tail
bpm:               143.5547
scenes generated:  9
```

The generated TypeScript consumed `timing.json`, used the measured `beats[]`
array and passed `tsc --noEmit` when temporarily placed in the template.

Additional checks:

- Silent 4s WAV no longer crashes: `uniform-fallback`, 120 BPM, 9 beats.
- Multi-timestamp LRC `[00:02.13][00:06.44]Chorus` becomes two lyric rows.
- Lyric starts keep the LRC time; `nearestBeat` and `beatDeltaMs` are metadata.
- `beat_count` equals the filtered `beats[]` length.
- Negative `--body-end` is rejected by argument validation.

## Template smoke

- `npm run typecheck`: PASS
- 6s Remotion render at 960×540: PASS
- QA without audio: FAIL with `missing audio stream` rather than crashing
- QA after attaching a silent test track: PASS
- QA rejects VP9/Opus and prints both codec mismatches
- QA accepts H.264/AAC
- QA accepts 29.97fps (`30000/1001`) within tolerance
- Explicit `--width/--height/--fps/--expect-duration` override `timing.json`
- Contact sheet generated from scene midpoints: PASS
- Contact sheet rejects empty scene lists with a clear message

## Fonts

The template loads `Noto Serif SC` through `@remotion/google-fonts` at module
load, which uses Remotion's delayed rendering. This removes reliance on a
Chinese system font being installed. The first render requires network access;
subsequent renders use the browser cache.

## Skill validation

`skill-creator/scripts/quick_validate.py`: PASS

## Independent CC0换歌 test

An independent agent tested with
[Beat electronic.ogg](https://commons.wikimedia.org/wiki/File:Beat_electronic.ogg)
(Wikimedia Commons, public domain), cut to 23.9857s.

- detected tempo: 123.0469 BPM
- detected beats: 50
- generated scenes: 2 (`world`, `split`)
- typecheck: PASS
- render: 960×540, 30fps, 719 frames, 23.979s, H.264 + AAC
- rendered BGM correlation with source: r = 0.999982
- QA and contact sheet: PASS after the CLI override fix documented above

The rendered test artifacts were kept outside the skill directory and are not
part of the distributed package.

## 2026-10-26 real-song test

Tested against a 32.1s excerpt of the user-provided track `数钱的女孩`
(11.50-43.60s), using 18 supplied lyric lines and nine new paper-cut scenes.

- detected tempo: 161.499 BPM
- measured beats: 86
- generated scenes: 9
- typecheck: PASS
- render: 1920x1080, 30fps, 963 frames, 32.107s, H.264 + AAC
- QA: PASS via `qa_video.py`
- contact sheet: PASS via `contact_sheet.py`
- scene-specific source lives in `episodes/07-money-girl`, not in `template/`

The test confirms that a new song can replace the demo timeline without copying
the `paper-tide` example's shots, lyrics or BPM.
