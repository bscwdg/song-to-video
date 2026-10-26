# song-to-video

输入一首歌，选择片段，按歌词语义生成分镜和画面，最后合成一支有内容的卡点视频。

这个仓库当前只承诺一条主线：

```text
歌 + 可选歌词
    → 选片段
    → 歌词分组
    → storyboard.json（intent + metaphor + scene）
    → 人工确认
    → 时间轴 codegen
    → 场景实现
    → 渲染 + QA
```

不是“任意歌曲一键出片”，也不是“镜头模板轮播”。

## 当前主线

- **稳定 skill**：`skills/papercut-mv`
- **核心协议**：[docs/STORYBOARD_SPEC.md](docs/STORYBOARD_SPEC.md)
- **镜头数规则**：[docs/SHOT_PLANNING.md](docs/SHOT_PLANNING.md)
- **风格包**：[styles/README.md](styles/README.md)
- **产品边界**：[docs/PRODUCT.md](docs/PRODUCT.md)
- **使用说明**：[docs/USAGE.md](docs/USAGE.md)
- **4 镜质量样例**：[examples/storyboard-first](examples/storyboard-first)（16 秒测试，不是固定镜头数）

`papercut-mv` 的职责是：

- 测 BPM、拍点和音乐正文终点
- 把切点吸附到真实拍点
- 生成 Remotion 时间轴
- 提供纸感材质、纸偶、字体和 QA 工具

**它不负责替你想“这句歌词该画什么”。** 这一步必须由 Agent 提出、人工确认，写进 `storyboard.json`。

## 仓库结构

```text
song-to-video/
├─ skills/
│  └─ papercut-mv/          # 稳定剪纸 skill
├─ styles/                   # 5 个 preview 风格包 + registry
├─ examples/
│  ├─ style-gallery/         # 五种风格 20 秒预览
│  ├─ storyboard-first/     # 4 镜语义分镜样例（非固定规则）
│  ├─ money-girl/           # 手工剪纸案例
│  └─ papercut-song/        # 早期九镜案例
├─ experiments/
│  ├─ v2-engine/            # 参数化引擎与 Seedream 样片，非主路径
│  └─ README.md
├─ docs/
│  ├─ PRODUCT.md
│  ├─ STORYBOARD_SPEC.md
│  ├─ USAGE.md
│  ├─ PIPELINE.md
│  └─ research/             # 历史审查、需求、问题记录
├─ tests/
└─ .github/workflows/
```

`experiments/` 里的东西可以保留、可以失败，但不进入稳定 skill 的默认答案。

## 快速开始

```powershell
Copy-Item skills\papercut-mv\template examples\my-song -Recurse
cd examples\my-song
npm install
python -m pip install -r requirements.txt
```

1. 放入歌曲：`public/audio/song.mp3`
2. 放入歌词：`lyrics.lrc`
3. 先按歌词语义单元决定镜头数，再写 `storyboard.json`
4. 验证分镜：

```powershell
python ..\..\skills\papercut-mv\scripts\validate_storyboard.py storyboard.json
```

5. 生成实测时间数据，再由确认后的 storyboard 生成时间轴：

```powershell
python ..\..\skills\papercut-mv\scripts\analyze_track.py public\audio\song.mp3 `
  --lrc lyrics.lrc --out timing.json

python ..\..\skills\papercut-mv\scripts\storyboard_to_timeline.py `
  timing.json storyboard.json `
  --out-ts src\generated\timeline.generated.ts
```

6. 按确认后的 storyboard 实现场景，再 typecheck、渲染、QA。

## 设计原则

1. **先语义，后画面。** 没有 `intent` 和 `metaphor`，不写场景代码。
2. **实测拍点是唯一时间真相。** 不在场景里另算一套 BPM 网格。
3. **一镜一构图，一镜一动作。** 不用镜号取模伪装叙事。
4. **镜头数随内容变化。** 时长、歌词密度、段落和能量共同决定，不先定 4 或 9。
5. **模板与案例分离。** 模板不包含某一首歌的歌词、切点和导演内容。
6. **先看画面，再谈完成。** 自动 QA 不能判断歌词和画面是否相关。
7. **实验不污染主路径。** v2 引擎、Seedream、自动导演先留在 `experiments/`。
8. **风格不是换颜色。** 每个 style pack 约束构图、动作、字体、色板、声音与禁止项。

## 当前不做

- 任意歌曲无人值守一键出片
- 用词表覆盖率代替导演理解
- 先扩 40 个意象库，再验证画面是否成立
- 把 Seedream/Seedance 当作必需依赖
- 用更多参数、更多镜头、更多 QA 指标掩盖语义缺失

`papercut-mv` 是 stable；`painted-animation` 已到 beta（有可运行模板和风格演示）；`kinetic-reel`、`ink-wash`、`flat-explainer`、`pixel-8bit` 是 preview 风格包，已能选择、预览和写进 storyboard，但还没有完整生产级场景库。

## 媒体与版权

仓库只提交代码、模板、时间轴和文档，不提交用户歌曲、歌词原文或成品视频。

`**/video/`、`**/public/audio/*`、`**/public/sfx/*`、`out/` 和常见音视频格式均已在 `.gitignore` 中排除。

`**/storyboard.json` 默认也被忽略，因为它通常包含歌词正文；只有 `examples/storyboard-first/storyboard.json` 这份示例被显式保留。

示例案例保留实测时间数据，但歌词正文使用长度占位；原文仅在本地使用。

## License

代码使用 MIT License。音乐、歌词、第三方参考素材不包含在授权范围内。
