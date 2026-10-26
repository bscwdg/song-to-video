# Product

## 一句话

输入一首歌，选择片段，按歌词语义生成分镜和画面，最后合成一支有内容的卡点视频。

## 正式流程

```text
歌 + 可选歌词
    ↓
选择片段
    ↓
歌词分组
    ↓
storyboard.json（intent + metaphor + scene）
    ↓
人工确认
    ↓
timing.json / timeline codegen
    ↓
场景实现
    ↓
渲染 + QA
```

## 当前主线

`main` 只承诺四件事：

1. 稳定 skill：`skills/papercut-mv`
2. 歌词驱动分镜协议：`docs/STORYBOARD_SPEC.md`
3. 两个手工案例：`examples/money-girl`、`examples/papercut-song`
4. 一个 storyboard-first 样例：`examples/storyboard-first`（当前 4 镜 / 16 秒，仅用于质量校验）

镜头数不设固定值，规则见 [`SHOT_PLANNING.md`](SHOT_PLANNING.md)。

## 明确不承诺

- 任意歌曲一键出片
- 不需要人工确认的自动导演
- 任意视觉风格
- Seedream / Seedance 作为必需依赖
- 以镜头数量、参数数量或自动化程度代替画面质量

## MVP 验收

先完成一条 15–30 秒的片段。镜头数由歌词语义单元、时长和段落决定，不预设 4 或 9。

每个镜头必须满足：

1. 遮住字幕，画面仍能提示这句歌词在讲什么；
2. 镜头内有一个清楚的可见动作；
3. 与前后镜头使用不同构图轴；
4. 运动连续，不靠随机堆叠；
5. 切点来自实测拍点。

这五条不过，不进入下一轮引擎扩展。
