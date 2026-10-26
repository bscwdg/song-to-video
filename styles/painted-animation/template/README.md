# Painted animation template

手绘水彩 + 沸腾墨线的 Remotion 起始模板。

## 观感

- 宣纸/水彩纸底
- 水彩色块晕染
- 手绘墨线持续轻微沸腾
- 角色先出剪影，再被颜色覆盖
- 转场来自笔触和纸面，不使用默认叠化

## 内容

12 秒无声风格样例，3 个镜头：

1. `watercolor-world`：水彩世界与行走角色
2. `character-beat`：角色与心形水彩
3. `ink-reveal`：墨线揭示房屋与树

## 运行

```powershell
npm install
npm run start
```

渲染：

```powershell
npm run typecheck
npm run render
```

## 接入真实歌曲

保留 `src/timeline.ts` 的 `SceneProps`、`beatPhase` 和 `clamp` 工具。把
`DEMO_TIMELINE` 替换成真实歌曲的 `timing.json + storyboard` codegen 结果，
再把 `scene.archetype` 映射到三个基础场景或新增场景。
