# Storyboard spec

`storyboard.json` 是 `song-to-video` 的核心产品数据结构。

它把“歌词”翻译成“为什么这样拍”，再交给代码生成时间轴和场景。

顶层 `style` 选择视觉风格包，可用 id 见
[`styles/registry.json`](../styles/registry.json)。当前稳定风格是
`papercut-mv`，另外五种是 preview 级风格包。

**镜头数不是固定值。** 先分组歌词，再按
[`SHOT_PLANNING.md`](SHOT_PLANNING.md) 决定合并或拆分。下面的 4 镜示例只用于
16 秒质量校验，不代表所有歌曲都做 4 镜。

## 为什么需要它

只按拍点和镜号轮转，会得到一支卡得准但没有内容的视频：

- 镜号 `% 5` 决定构图；
- 颜色池 `% 4` 决定色板；
- 主体池 `% 3` 决定画面；
- 歌词只作为字幕存在。

这不是 song-to-video，而是 beat-to-video。

## 文件结构

```json
{
  "version": 1,
  "style": "papercut-mv",
  "title": "4-shot quality gate",
  "segment": {"start": 0, "end": 16},
  "fps": 30,
  "duration": 16,
  "shots": [
    {
      "id": "01",
      "start": 0,
      "end": 4,
      "intent": "她终于等到这一天，愿望成真。",
      "metaphor": "纸门打开，婚礼拱门下落下纸钞雨。",
      "cut": {"requested": 4, "snapped": 4, "beatIndex": 10},
      "scene": {
        "archetype": "wedding-arch",
        "subject": ["bride", "groom", "banknotes"],
        "camera": "low angle, slow push-in",
        "palette": "rose-gold",
        "motion": "one banknote layer descends per beat",
        "transition": "paper tear"
      },
      "lyrics": [
        {"start": 0.5, "end": 3.4, "text": "她终于等到这一天"}
      ]
    }
  ]
}
```

完整示例：

- [examples/storyboard-first/storyboard.json](../examples/storyboard-first/storyboard.json)
- [JSON Schema](../skills/papercut-mv/references/storyboard-schema.json)

## 字段

### `intent`

这句歌词在叙事上要表达什么。

不是画面描述，也不是歌词改写。例如：

- “她终于熬出头了”
- “旧我还没有离开”
- “父母是这场婚礼的支点”

### `metaphor`

观众具体看到什么。必须能在画面上执行。

例如：

- “纸钞像雨一样从婚礼拱门下落下”
- “房间里每拍多一个人影”
- “四只纸杯依次举起”

### `scene`

只允许一个主导构图和一个主导动作：

- `archetype`：镜头语法
- `subject`：画面主体
- `camera`：机位与运动
- `palette`：色板
- `motion`：拍点驱动的可见动作
- `transition`：进入/离开方式

### `lyrics`

每句歌词必须属于一个镜头。允许一句歌词跨一个镜头，也允许多句共享同一镜头，但前提是它们属于同一个叙事单元。

### `cut`

推荐记录：

- 人工请求的切点 `requested`
- 吸附后的实测拍点 `snapped`
- 拍点索引 `beatIndex`

## 规则

1. 镜头时间必须从 0 连续覆盖到 `duration`，不能有缝隙或重叠。
2. 每个镜头必须有非空 `intent` 和 `metaphor`。
3. 每个镜头必须有一个构图轴和一个可见动作。
4. 歌词归属必须落在镜头时间范围内。
5. 不允许用 `shot_index % len(pool)` 决定叙事。
6. duplicate archetype 只能作为有意回环，不能作为自动轮转的副作用。
7. 先确认 JSON，再写场景代码。

歌词起唱/收尾允许最多 250ms 越过镜头边界，因为切点需要吸附到实测拍点；
超过 250ms 会被 `validate_storyboard.py` 拒绝。

## 验证

```powershell
python skills\papercut-mv\scripts\validate_storyboard.py `
  examples\storyboard-first\storyboard.json
```

严格模式：

```powershell
python skills\papercut-mv\scripts\validate_storyboard.py `
  examples\storyboard-first\storyboard.json --strict
```

确认后生成 Remotion 时间轴：

```powershell
python skills\papercut-mv\scripts\storyboard_to_timeline.py `
  timing.json storyboard.json `
  --out-ts src\generated\timeline.generated.ts
```

## 人工审看

JSON 通过只代表结构正确，不代表导演正确。必须先看一页分镜表，确认：

1. 遮住字幕，画面还能提示歌词含义；
2. 每镜只有一动作；
3. 每镜构图轴不同；
4. 镜头之间有情绪推进，而不是素材轮播。

这四条通过后，才允许进入场景实现。
