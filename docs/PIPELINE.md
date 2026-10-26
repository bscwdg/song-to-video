# Pipeline

`song-to-video` 把歌曲生成视频拆成六个可验证阶段。

## 1. 声音事实

```powershell
python skills/papercut-mv/scripts/analyze_track.py song.mp3 `
  --lrc lyrics.lrc `
  --out timing.json
```

输出：

- `duration` / `musical_body_end`
- `bpm` / `beat_seconds` / `offset`
- 实测 `beats[]` / `half_beats[]`
- `beat_grid_method`

音乐正文与文件总时长必须分开。文件尾部的静音、UI 提示音或孤立尾音不应自动算进 MV。

## 2. 歌词 → 分镜

在写任何场景代码前，先把歌词分组并写成 `storyboard.json`：

```powershell
python skills/papercut-mv/scripts/validate_storyboard.py `
  examples/storyboard-first/storyboard.json
```

每个镜头必须填写：

- `intent`：这句歌词在讲什么
- `metaphor`：观众具体看到什么
- `scene.archetype / subject / camera / palette / motion / transition`
- `lyrics`：归属到该镜头的歌词行

详细字段见 [STORYBOARD_SPEC.md](STORYBOARD_SPEC.md)。

## 3. Storyboard → 时间轴

```powershell
python skills/papercut-mv/scripts/storyboard_to_timeline.py `
  timing.json storyboard.json `
  --out-ts src/generated/timeline.generated.ts
```

`storyboard_to_timeline.py` 会再次校验 `storyboard.json`，并要求它的
`duration` 与 `timing.json` 的 `musical_body_end` 对齐。

生成的 `scenes[].component` 来自 `storyboard.shots[].scene.archetype`，
`lyrics[]` 来自每镜的歌词归属。最终场景边界只从确认后的 storyboard 读取。

## 4. 时间轴代码生成

`timing.json` 不是备注文件，而是场景和动画的时间源。

生成的 `timeline.generated.ts` 包含：

- `meta`
- `beats`
- `scenes`
- `lyrics`
- `cues`

场景组件通过 `SceneProps` 接收 `sceneStart / sceneDuration / beats / fps / width / height`。

禁止在场景里手写另一套 `BPM + offset + index` 网格。

## 5. 画面与声音

每个场景只承担一个主要视觉动作。纸媒介动作优先使用：

- 抬升 / 折叠 / 撕裂 / 卷曲
- 剥离 / 滑移 / 孔洞透光
- 纸偶关节摆动

SFX 由 `generate_sfx.py` 生成，通过 cue 表进入同一条时间轴。BGM 为主，SFX 音量保持克制。

## 6. 渲染与 QA

```powershell
npx remotion render src/index.ts PaperCutMV out/papercut-mv.mp4 `
  --codec=h264 --crf=16 --pixel-format=yuv420p

python scripts/qa_video.py out/papercut-mv.mp4 --timing timing.json
python scripts/contact_sheet.py out/papercut-mv.mp4 --timing timing.json `
  --out out/contact-sheet.jpg
```

自动 QA 只能证明规格正确，不能证明镜头成立。交付前仍需逐镜检查：

1. 主体是否一眼可读
2. 每拍是否有可见变化
3. 字幕是否越界或遮挡主体
4. 构图轴是否真的不同
5. 切点附近是否跳帧或黑帧

## 媒体策略

仓库不提交：

- 用户歌曲
- 生成的 WAV / MP3
- 参考视频
- 成片 MP4
- `video/` 下的任何素材

媒体应在本地放置，并通过 `.gitignore` 保持仓库可分发。
