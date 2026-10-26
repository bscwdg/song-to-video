# storyboard-first · 4-shot quality gate

这是一份**语义分镜合同**示例，不是成片。

它用来回答一个比“拍点准不准”更重要的问题：

> 遮住字幕，画面还能不能提示这句歌词在讲什么？

当前示例故意只做 4 个镜头、16 秒。每个镜头都必须有：

- 歌词归属
- `intent`：这句在讲什么
- `metaphor`：观众具体看到什么
- 一个构图轴
- 一个可见动作
- 一个转场

验证：

```powershell
python skills\papercut-mv\scripts\validate_storyboard.py `
  examples\storyboard-first\storyboard.json
```

下一步不是扩镜头库，而是把这 4 个镜头做成可审片的质量标杆。
在它通过人工审看之前，不继续扩 `experiments/v2-engine`。

**注意：4 镜只是为了在 16 秒内做一次质量校验，不是所有歌曲的固定镜头数。**
实际项目应按 [`docs/SHOT_PLANNING.md`](../../docs/SHOT_PLANNING.md) 决定合并或拆分。
