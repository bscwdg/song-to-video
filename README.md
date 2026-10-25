# song-to-video

把一首歌生成一支按真实拍点剪辑的动态视频。

输入歌曲、歌词和视觉风格，输出：

- 实测 BPM、拍点和音乐正文边界
- 吸附到真实拍点的场景切分
- 可直接渲染的 Remotion 时间轴
- 程序化生成的画面、字幕和音效
- 编码、分辨率、帧率、时长与接触表 QA

当前已实现第一套视觉风格：**层叠剪纸**（`papercut-mv`）。

## 当前状态

这是一个可运行的工程骨架，不是“任意歌曲一键出片”的最终产品。

- 歌曲分析、拍点吸附、时间轴生成、Remotion 渲染、QA 已跑通
- 场景美术仍需按 visual style / storyboard 实现
- 目前只内置 16:9 剪纸模板；竖屏及其他风格需要单独设计
- 示例歌曲仅用于本地验证，不随仓库分发

## 工作流

```text
audio + lyrics
      ↓
analyze_track.py  →  timing.json / timeline.generated.ts
      ↓
scene components + storyboard
      ↓
Remotion render
      ↓
qa_video.py + contact_sheet.py
```

详细说明见 [docs/PIPELINE.md](docs/PIPELINE.md)。

## 仓库结构

```text
song-to-video/
├─ skills/
│  └─ papercut-mv/          # 第一套视觉风格与可复用工程模板
│     ├─ SKILL.md
│     ├─ references/
│     ├─ scripts/
│     ├─ template/
│     └─ examples/paper-tide/
├─ examples/
│  ├─ papercut-song/        # 《纸潮》完整九镜实现
│  └─ money-girl/           # 《数钱的女孩》32s 换歌测试
└─ docs/
   └─ PIPELINE.md
```

## 快速开始

```powershell
cd skills\papercut-mv\template
npm install
python -m pip install -r requirements.txt

python scripts\analyze_track.py public\audio\song.mp3 `
  --cuts 3.6,5.7,7.4 `
  --scene-components world,split,world `
  --scene-names 起航,离开,尾声 `
  --out timing.json `
  --emit-ts src\generated\timeline.generated.ts

npm run typecheck
npx remotion render src\index.ts PaperCutMV out\papercut-mv.mp4 `
  --codec=h264 --crf=16 --pixel-format=yuv420p
```

## 设计原则

1. **实测拍点是唯一时间真相。** 不在场景里另算一套 BPM 网格。
2. **模板与案例分离。** 模板不包含某一首歌的歌词、切点和导演内容。
3. **画面是时间的纯函数。** 不使用 `Date.now()` 或逐帧随机数。
4. **先看画面，再谈完成。** 每个镜头至少检查一张静帧和关键动作。
5. **代码正确不等于片子成立。** 构图、可读性和节奏仍需人工审查。

## 媒体与版权

仓库只提交代码、模板、时间轴和文档，不提交用户歌曲、歌词成品视频或第三方参考片。

`**/video/`、`**/public/audio/*`、`**/public/sfx/*`、`out/` 和常见音视频格式均已在 `.gitignore` 中排除。示例歌曲与歌词版权归原权利人，仓库中的示例仅用于技术验证。

## License

代码使用 MIT License。音乐、歌词、第三方参考素材不包含在授权范围内。
