# papercut-mv skill · v0.2

一个面向 **Remotion + React + SVG** 的层叠剪纸 MV 技能草稿。它不是对某一条参考片的复刻，而是从两条纸片 MV 和两个视频制作 skill 项目中抽取出的可复用方法：

- 参考片 1：九镜叙事、歌词切点、月亮/海/船母题。
- 参考片 2：纸偶角色、固定舞台、轻量动作与手工质感。
- `painted-animation`：每一帧是时间的纯函数、逐镜渲染与“看画面”审查循环。
- `code-video-showcase`：硬约束、可运行模板、参考片实测拆解、音画 QA。

## 结构

```text
SKILL.md
references/style-dna.md
references/composition-matrix.md
references/audio-sync.md
references/qa.md
scripts/analyze_track.py
scripts/generate_sfx.py
scripts/qa_video.py
scripts/contact_sheet.py
template/
examples/paper-tide/
```

## 当前定位

这是一个 **风格专用 skill**，不是“任意视频生成 skill”。它刻意把以下内容写死：

- 2.5D 剪纸层；
- 拍点驱动的动作；
- 九镜构图去重；
- 纸感音效与字幕位置；
- Remotion/SVG 的渲染陷阱。

真正可变的只有歌曲、歌词、角色造型、九镜的具体故事与色彩。

## v0.2 的关键变化

- `template/` 不再复制《纸潮》的九镜或歌曲常数；
- 实测 `beats[]` 是唯一拍网格；
- `timing.json -> timeline.generated.ts` 自动生成；
- scene 通过 registry + `SceneProps` 注入 `sceneStart / beats / fps`；
- QA 接受 `--timing / --width / --height / --fps`；
- `examples/paper-tide/` 保存完整九镜案例，与模板分离；
- 模板使用 `@remotion/google-fonts` 等待中文字体加载；
- 明确只承诺 16:9 模板，竖屏需单独实现。
