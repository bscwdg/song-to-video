# Experiments

这里保存不进入主产品承诺的实验。

## v2-engine

参数化镜头库、小节量化、相机/视差、Seedream 锚图样片。

它解决的是“如何更快生成镜头”，但**没有解决歌词语义**。在
`examples/storyboard-first` 通过质量验收前，不应继续扩展它。

运行方式见 [`v2-engine/README.md`](v2-engine/README.md)。

## 边界

- 实验代码不进入 `skills/papercut-mv` 的默认答案；
- 实验失败不阻塞稳定 skill；
- 新产品能力只有在 storyboard-first 案例通过后才能迁回主线；
- 实验中的 AI 生成物和音频不进入仓库。
