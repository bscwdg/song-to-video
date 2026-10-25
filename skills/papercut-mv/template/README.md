# Paper-cut MV template

This is a reusable 16:9 Remotion starter, not a finished film. It contains no song, lyrics, cuts or character story.

## What is reusable

- `PaperDefs` and paper material primitives;
- moon, wave, boat, character, lantern and speck components;
- measured-beat helpers in `src/timeline.ts`;
- scene registry and `SceneProps` contract;
- generated timeline type and demo data;
- lyrics and sound-cue schedulers;
- Python helpers for beat analysis, cue generation and QA.

## Start a project

1. Copy this directory to a new project folder.
2. Put the user-owned track at `public/audio/song.mp3`.
3. Install dependencies:

   ```powershell
   npm install
   python -m pip install -r requirements.txt
   python scripts/generate_sfx.py
   ```

4. Generate the timing data and Remotion timeline:

   ```powershell
   python scripts/analyze_track.py public/audio/song.mp3 `
     --cuts 3.6,5.7,7.4 `
     --scene-components world,split,world `
     --scene-names 启航,离开,尾声 `
     --lrc lyrics.lrc `
     --out timing.json `
     --emit-ts src/generated/timeline.generated.ts
   ```

5. Implement only the scene components named by `--scene-components`; register each component key in `src/scenes/registry.tsx`.
6. Optionally pass `--cues cues.example.json` to mix procedural SFX.
7. Check and render:

   ```powershell
   npm run typecheck
   npx remotion render src/index.ts PaperCutMV out/papercut-mv.mp4 `
     --codec=h264 --crf=16 --pixel-format=yuv420p `
     --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"
   python scripts/qa_video.py out/papercut-mv.mp4 --timing timing.json `
     --width 1920 --height 1080
   python scripts/contact_sheet.py out/papercut-mv.mp4 --timing timing.json `
     --out out/contact-sheet.jpg
   ```

`--browser-executable` 这行是 Windows Chrome 示例；macOS/Linux 可省略该参数，或改为本机 Chrome 路径。

The template intentionally supports only the 16:9 paper-cut grammar. A vertical edition needs its own composition layout and camera coordinates; do not claim it without rendering it.

The demo `timeline.generated.ts` has `audio: null` and two generic scenes, so the starter can typecheck and render before a song is supplied.
