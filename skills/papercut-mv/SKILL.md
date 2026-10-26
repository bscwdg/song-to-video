---
name: papercut-mv
description: "用 Remotion + React + SVG 制作层叠剪纸动效音乐视频。适用于把用户提供的歌曲拆成 9 个左右不重复构图、按真实拍点剪辑、用纸偶/纸浪/纸云/孔明灯等程序化元素表演的 MV；也适用于从参考 MV 中逆向风格规则、节拍卡点、纸感音效与质检流程。关键词：剪纸 MV、paper-cut music video、Remotion 动画、歌词卡点、分层纸偶、paper stop-motion、程序化音效。"
license: MIT
metadata:
  version: "0.1.0"
  stack: "Remotion 4 / React 19 / SVG / TypeScript / Python / ffmpeg"
  aspect: "16:9 by default; vertical requires a separate composition"
---

# 层叠剪纸 MV

把一支歌变成一支“会动的纸”：**画面由分层的剪纸形状组成，动作由真实的歌曲拍点驱动，镜头之间用纸的物理行为完成转场。**

这不是“给歌词配一些图”的技能。一个合格镜头必须同时回答四件事：

1. 观众第一眼看见谁/什么？
2. 这一拍发生了什么可见变化？
3. 纸的哪一层在动，为什么这样动？
4. 这个镜头和其他八个镜头在构图与景别上有什么不可互换的差异？

## 何时使用

- 用户给一首歌，要求做剪纸/纸偶/拼贴/纸片 stop-motion 风格的 MV。
- 用户给了逐句/逐镜分镜，要求用 Remotion、React、SVG 或代码实现。
- 用户想从 1–3 支参考 MV 反推一种可复用的视频 skill。
- 用户要“9 个镜头、每镜不同构图、切点卡在唱句最近的拍上”。

不适用：写实合成、真人拍摄、需要视频/图像生成模型的镜头、复杂长叙事。

## 两种交付物

- `template/`：真正的空骨架。只允许出现通用场景、通用素材和 demo 时间轴。
- `examples/paper-tide/`：完整九镜案例。允许出现具体歌词、切点、角色和音效设计。

**不要把 example 的导演内容复制进 template，也不要把某一支歌的 BPM、歌词和时间表写进 `timeline.ts`。**

## 不可妥协的规则

1. **先测歌，再分镜。** 读取真实时长、BPM、拍网格、歌词起唱点。文件尾部的静音/UI 尾音不要自动算进歌曲正文。
2. **每个切点都有出处。** 切点必须来自实测拍网格、LRC/ASR 或用户明确给的时间；不能凭感觉四舍五入。切点吸附到最近的拍，但**字幕起唱保留 LRC 原始时间**，另记 `nearestBeat` 供对拍参考。
3. **一镜一构图。** 每一镜必须占用不同的构图轴/景别/视线方向。禁止“月亮+海+小船”换个机位重复九次。
4. **一镜一个明喻。** 每个镜头只讲一个动作或一个视觉隐喻。不要在一镜里同时塞泡泡、鲸鱼、码头和星轨。
5. **纸只做纸会做的事。** 抬升、折叠、撕裂、卷曲、剥离、滑移、孔洞透光、纸偶关节摆动。不要粒子爆炸、3D 镜头穿模、玻璃拟态或默认霓虹。
6. **每拍必须有可见变化。** 可以是一层浪抬起、一次灯亮、一批行人换位、一朵孔明灯升起；但不要所有元素一起抖。
7. **硬切为主。** 默认在拍点硬切；需要过渡时从画面内部“长出”下一镜：浪脊成山、纸缝裂开、虹膜扩成月门。只有最后一镜可以整屏淡出。
8. **画面是时间的纯函数。** 不读 `Date.now()`，不在每帧 `Math.random()`；所有随机都使用固定种子或常量数组。
9. **音效克制。** 只做纸、灯、水、鲸、撕裂等少量功能音效；BGM 为主，SFX 单条一般 ≤ -18dB。禁止用音效填满每一拍。
10. **先看画面再谈完成。** 每个镜头至少看一张全屏静帧；关键动作看 3 帧 strip；切点看相邻两帧。代码能跑 ≠ 镜头成立。

## 七步工作流

### 1. 建立声音事实

```powershell
python -m pip install -r requirements.txt
python scripts/analyze_track.py public/audio/song.mp3 `
  --cuts 3.6,5.7,7.4 `
  --scene-components world,split,world `
  --scene-names 启航,离开,尾声 `
  --out timing.json `
  --emit-ts src/generated/timeline.generated.ts
```

输出应至少包含：

- `duration` / `musical_body_end`
- `bpm` / `beat_seconds` / `offset` / `beats[]` / `beat_grid_method`
- 用户切点对应的 `snapped_cuts[]`
- LRC 行的原始起唱时间 + `nearestBeat` / `beatIndex` / `beatDeltaMs`
- target width/height/fps，供 QA 读取

若没有 LRC，就用参考画面/ASR 得到逐句歌词，再人工核对每句起唱。**不从字幕消失时间推断下一句起唱。**

### 2. 写 `STORYBOARD.md`

每镜至少写：

```text
镜号 / 起止时间 / 歌词
主构图（必须唯一）
观众先看到什么，再看到什么
每拍动作（哪一层、怎么动）
进入/离开方式
音效 cue
```

九镜常用构图轴：

| 镜号 | 构图任务 | 例子 |
|---|---|---|
| 1 | 建立世界 | 低地平线 + 大月亮 + 多层浪 |
| 2 | 抽离/孤独 | 远景小主体，负空间占 70% |
| 3 | 内心化 | 偏置近景 + 纸泡泡/回忆框 |
| 4 | 能量峰值 | 对角巨浪 + 跃出纸鲸 |
| 5 | 时间流动 | 横向多层路人交错 |
| 6 | 分离 | 对称中缝，两片纸幕拉开 |
| 7 | 升华 | 仰视上升的孔明灯层 |
| 8 | 主观视角 | 圆形虹膜推进，里面有内景 |
| 9 | 回收母题 | 俯视圆门/纸浪坠落，首尾押韵 |

### 3. 锁角色与纸感

先做一套模型表，不要每个镜头现画：

- 男孩、女孩各 2–3 个姿势/表情；
- 小船 1 个主造型 + 1 个远景简化版；
- 月亮、浪、云、灯、鲸各 1 个可参数化组件；
- 统一 `paper-cut / paper-shadow / grain / glow` 滤镜栈；
- 统一纸边轮廓（轻微位移、不规则）、纸纤维、层间阴影。

纸张表面保持哑光、平面、少高光。允许背景用渐变，但纸片本身要通过层叠与透光建立体积，不靠塑料高光。

### 4. 生成时间轴并搭 Remotion 骨架

推荐目录：

```text
src/
  timeline.ts                         # 类型 + 基于实测 beats[] 的工具
  generated/timeline.generated.ts     # codegen 产物，不手改
  theme.ts
  components/Paper.tsx
  components/Lyrics.tsx
  components/Soundtrack.tsx
  scenes/registry.tsx                 # component key -> React component
  scenes/SceneWorld.tsx               # 通用范例
  scenes/SceneSplit.tsx               # 通用范例
  PaperCutMV.tsx
```

`timing.json -> timeline.generated.ts` 是唯一时间真相：FPS、总帧数、拍点、切点、歌词、音频、音效 cue 都来自一次 codegen。禁止在场景里手写秒数或复制另一套 BPM 网格。

`PaperCutMV` 用 scene registry 渲染 `timeline.generated.ts` 里的场景，并向每个场景注入：

```ts
type SceneProps = {
  sceneStart: number;
  sceneDuration: number;
  beats: number[];
  fps: number;
  width: number;
  height: number;
};
```

`useCurrentFrame()` 在 `Sequence` 内是**局部帧**；用 `sceneStart + frame / fps` 得到全局时间，再查询 `beats[]`。禁止用 `BPM + offset + index` 再算一套网格。

### 5. 先做一条完整镜头的运动

不要九个镜头一起铺代码。先做一个“建世界”镜头，确认：

- 月亮、浪、船、人物都在正确图层；
- 一层纸抬起时有进入与回落；
- 船的浮沉不是匀速；
- 灯笼每拍亮一下，但不会过曝；
- 纸阴影和颗粒没有糊掉主体。

再复制工程结构，逐个镜头实现。每个镜头结束前做一次静帧检查。

### 6. 声音设计与卡点

使用用户提供的 BGM，不擅自替换。SFX 用 `scripts/generate_sfx.py` 生成，按 cue 表放入 Remotion：

- 切点：短纸纤维声/撕纸声；
- 浪起/页面翻落：低频起音 + 细碎高频；
- 灯亮/星闪：轻铃或短 glint；
- 水花：低频 plop；
- 鲸跃：长滑音，但极低音量。

cue 文件传给 codegen：

```powershell
python scripts/analyze_track.py public/audio/song.mp3 `
  --cues cues.json `
  --scene-components world,split `
  --out timing.json `
  --emit-ts src/generated/timeline.generated.ts
```

混音原则：BGM 保持主位；SFX 起音对齐切点，尾音可跨镜。不要让每个拍点都响同一种铃。

### 7. 渲染与验收

```bash
npx remotion render src/index.ts PaperCutMV out/papercut-mv.mp4 \
  --codec=h264 --crf=16 --pixel-format=yuv420p \
  --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"
python scripts/qa_video.py out/papercut-mv.mp4 --timing timing.json \
  --width 1920 --height 1080
python scripts/contact_sheet.py out/papercut-mv.mp4 --timing timing.json \
  --out out/contact-sheet.jpg
```

`--browser-executable` 是 Windows 的本机 Chrome 示例；macOS/Linux 可省略，或指向本机 Chrome。不要依赖 Remotion 现场下载浏览器。

至少输出：

- `papercut-mv.mp4`
- `poster.png`
- `contact-sheet.jpg`（九镜各一张）
- `timing.json`
- `timing.json` 生成的 `src/generated/timeline.generated.ts`
- `STORYBOARD.md`

## v2 参数化引擎（实验）

`examples/v2-lab` 走了另一条路径：不逐歌手写场景，而是
`song_facts.py -> song.json -> direct.py -> shots.json -> 5 个参数化构图`。
切点量化到小节线，镜头长度由段落能量决定，构图库负责纸感与视差。
真实歌曲仍需人工审分镜与美术；详见 `examples/v2-lab/README.md`。

## Remotion + SVG 踩坑

- **绝对定位的 `<AbsoluteFill>` 背景会盖住后面的普通流式 `<svg>`。** 主 SVG 自己也必须是 `position:absolute; inset:0`，否则浏览器只显示渐变和字幕。
- SVG filter 放在一个零尺寸 `<svg><defs>` 中可用，但主 SVG 仍需绝对定位并处于正确的绘制顺序。
- 每个镜头根节点先用一个 `AbsoluteFill` 画背景，再把主 SVG、光效、字幕分层。
- 对大形状使用 `feTurbulence + feDisplacementMap` 做纸边时，给 filter 声明 124%–160% 的 region，避免边缘被裁。
- 不要在渲染过程中下载浏览器。优先传入本机 Chrome 的 `--browser-executable`。
- 中文字体用 `@remotion/google-fonts/NotoSerifSC` 在模块加载时 `loadFont(...)`，让 Remotion 的 `delayRender` 等字体完成；不要依赖渲染机器的系统字体。首次加载需要网络，之后使用缓存。
- `Math.random()` 会造成并行帧不一致。需要星点/纸屑时用索引哈希或常量数组。
- 文本超过约 12 个汉字时，必须检查 1920 宽下的字距和留白；MV 字幕不要做过多逐字弹跳。
- 模板默认只支持 16:9。不要因为改了 `1080x1920` 两个数字就声称支持竖屏；需要重新设计坐标、字号、字幕和镜头。

## 交付与复盘

先交付片子，再交付 skill。复盘时只记录**可复用的决定**：

- 哪些构图轴真的不同？
- 哪些动作必须靠拍点，哪些可以靠缓动？
- 渲染花了多久，哪类 SVG filter 最贵？
- 哪些问题来自代码（层级、滤镜、时间轴），哪些来自导演（读不清、重复、过满）？

推荐把一次成功项目拆成：

```text
reference analysis -> style DNA -> engine template -> one finished example -> QA scripts
```

不要把某一支歌的镜头表写进 skill 的“默认答案”；把它放进 `examples/`。

## 参考

- `references/style-dna.md`：纸感、色彩、镜头、转场、角色规则
- `references/audio-sync.md`：节拍/歌词对齐、SFX 混音
- `references/composition-matrix.md`：九镜不重复构图检查表
- `references/qa.md`：交付前验收清单
- `scripts/analyze_track.py`：BPM、实测拍点、切点吸附、`musical_body_end`、codegen
- `scripts/song_facts.py`：v2 声音事实（downbeat / 小节 / 段落 / 逐拍能量）
- `scripts/direct.py`：v2 小节量化分镜 + `STORYBOARD.md` + Remotion TS
- `scripts/song2video.py`：v2 一条命令入口（分析 → 分镜 → codegen → 可选渲染）
- `scripts/generate_sfx.py`：纸感音效合成
- `scripts/qa_video.py`：参数化编码/时长/流检查
- `scripts/contact_sheet.py`：按 `timing.json` 每个 scene 取中间帧
- `examples/paper-tide/`：24.056s 九镜完整案例
