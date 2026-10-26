# Style packs

`song-to-video` 的视觉风格按 **style pack** 接入。

一个 style pack 至少包含：

- `style.json`：机器可读的风格元数据
- `STYLE.md`：美术、排版、动作、声音与适用边界

可运行的预览代码在
`examples/style-gallery/src/previews/<style-id>.tsx`，避免风格包和具体 Remotion 项目互相耦合。

## 状态

- `stable`：已有完整模板、案例、脚本和验收，可用于正式项目。
- `beta`：已有可运行模板和风格演示，但还没有完成真实歌曲案例验收。
- `preview`：已能预览风格方向，但还没有完整的场景库和生产级验收。
- `scaffold`：只有规范，没有可运行预览。

当前 `papercut-mv` 是 `stable`，`painted-animation` 是 `beta`，其余四个是 `preview`。

## 选择方式

在 `storyboard.json` 顶层写：

```json
{
  "style": "painted-animation"
}
```

可用 id 见 [`registry.json`](registry.json)。

风格选择不是换颜色。每个 style pack 会约束：

- 允许的构图
- 允许的动作
- 字体与排版
- 色板
- 音效音色
- 禁止元素

## 预览

```powershell
cd examples\style-gallery
npm install
npx remotion studio src/index.ts
```

## 当前接入

| id | 风格 | 状态 |
|---|---|---|
| `papercut-mv` | 层叠剪纸 | stable |
| `painted-animation` | 手绘水彩动画 | beta |
| `kinetic-reel` | 动态字体 Reel | preview |
| `ink-wash` | 水墨国风 | preview |
| `flat-explainer` | 扁平插画科普 | preview |
| `pixel-8bit` | 8-bit 像素 | preview |
