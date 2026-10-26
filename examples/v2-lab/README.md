# v2-lab · 参数化剪纸 MV 引擎

这是 `v0.1` 之后的一次结构性重写，目标是两件事：

1. **画面**：从“每首歌手写九个场景”变成“镜头语法 + 参数化构图”；
2. **流程**：从“人给切点”变成“歌 → song.json → shots.json → 成片”。

目前是**可渲染的工程原型**，不是发布级成品。真实歌曲的听感与美术仍需人工审。

## 一眼看懂

```text
song.mp3 + lyrics.lrc
        ↓  song_facts.py         (拍 / 小节 / 段落 / 能量 / 歌词)
     song.json
        ↓  direct.py             (小节量化 + 构图选择 + 色板/运镜)
     shots.json + STORYBOARD.md + src/generated/shots.generated.ts
        ↓  Remotion
     V2Song
```

## 一条命令跑完

```powershell
python skills\papercut-mv\scripts\song2video.py `
  D:\music\song.mp3 `
  --lrc D:\music\song.lrc `
  --project examples\v2-lab `
  --render
```

不加 `--render` 时只跑分析、分镜和 codegen，方便先审 `STORYBOARD.auto.md`。

## 快速验证（不需要真实歌曲）

```powershell
cd examples\v2-lab
python scripts\make_test_song.py
cd ..\..

python skills\papercut-mv\scripts\song_facts.py `
  examples\v2-lab\public\audio\test.wav `
  --out examples\v2-lab\song.json

python skills\papercut-mv\scripts\direct.py `
  examples\v2-lab\song.json `
  --out examples\v2-lab\shots.json `
  --storyboard examples\v2-lab\STORYBOARD.auto.md `
  --emit-ts examples\v2-lab\src\generated\shots.generated.ts

cd examples\v2-lab
npm run typecheck
npx remotion render src\index.ts V2Song out\v2.mp4 `
  --codec=h264 --crf=16 --pixel-format=yuv420p `
  --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

## 这一版改了什么

| v0.1 | v0.2-lab |
|---|---|
| 只有 BPM + beats | beats + downbeats + bars + sections + 逐拍 rms/low/mid/high/flux |
| 切点吸“最近的拍” | 切点吸“小节线”，段落决定镜头长度 |
| 每首歌手写 2000+ 行场景 | 5 个参数化 archetype，`shots.json` 驱动 |
| 单层贴纸 | bg/mg/fg 三层视差 + 空气透视 + 接触阴影 |
| 静态纸人 + 花束旋转 | 关节纸偶（髋/膝/肩/肘）+ 姿态库 + 衣摆次级动作 |
| 固定 54px nowrap 字幕 | 限时、换行、长句缩放、底部安全区 |
| 只有规格 QA | 自动 EDL 自带镜头表，后续接逐拍帧差/响度 QA |

## 镜头库

| id | 用途 | 主要运动 |
|---|---|---|
| `wide-horizon` | 建世界 / 主歌起 | 纸云、低日、湖面反光、慢推 |
| `corridor` | 纵深 / 进入 | 七重纸门、末端风景、横向轨道 |
| `window` | 室内 / 内心 | 拱窗逆光、光柱、植物前景、手持 |
| `iris` | 回忆 / 副歌 | 同心撕纸环、环内小景、拉开 |
| `macro` | 情绪插入 | 花瓶纸花、桌面、浅景深光斑 |

`direct.py` 会优先使用尚未出现过的 archetype，避免“同一构图重复”。

## 已知限制（写清楚，不假装）

- 段落检测依赖和声/色度变化；强节奏、弱和声的歌（说唱、电子）仍需人工改 `song.json`。
- `corridor` 与 `macro` 的美术仍偏简单；纸偶在远景只保证剪影可读，不保证表演。
- 色板目前固定为暖色家族（dusk/ember/wine/night），亮色歌需要换 family。
- 只有 16:9；`Stage` 已做归一化，但 9:16 需要按画幅重排构图。
- SFX 只生成 cue 表，`V2Song` 还未挂 SFX 轨；BGM 直接播源文件，未做 LUFS 归一。
- 没有自动 QA（逐拍帧差 / 黑帧 / 字幕越界），下一阶段补。

## 文件

```text
src/engine/
  stage.ts       归一化舞台
  geom.ts        撕边/山脊/圆环几何
  palette.ts     暖色家族色板
  camera.ts      运镜 + 视差 + 拍脉冲
  paper.tsx      纸材质、滤镜、颗粒
  depth.tsx      深度层 + 接触阴影
  puppet.tsx     关节纸偶
  archetypes.tsx 五个构图
  Subtitles.tsx  字幕
  Shot.tsx       单镜渲染 + 整片 Film
src/lab/
  Lab.tsx        五个构图并排看
  Generated.tsx  自动 EDL 成片
scripts/
  make_test_song.py
```
