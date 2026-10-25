# 交付前 QA

## 硬检查

- [ ] 成片时长 = 音乐正文时长 ±80ms。
- [ ] 目标画幅与 `timing.json` 的 `target_width` / `target_height` 一致。默认模板是 16:9；竖屏必须单独验收。
- [ ] H.264 + AAC，音画同步。
- [ ] 9 镜切点全部在拍网格 ±20ms 内（受帧率限制时可取最近帧）。
- [ ] 每镜首帧可见，无因 SVG 绘制顺序导致的空白。
- [ ] 无 NaN 路径、峰值过曝、文字溢出。
- [ ] 最后一镜在最后 0.2–0.4s 完成淡出。

## 导演检查

- [ ] 前 0.5s 能说清“这是纸的世界”。
- [ ] 前 2s 有第一个世界级动作（浪抬/月现/船入）。
- [ ] 每镜的观众先看点与第二看点清楚。
- [ ] 九个镜头构图矩阵无重复。
- [ ] 每个切点前 2–4 帧有“预备”，切点后有“跟随”。
- [ ] 角色在所有镜头保持造型、朝向和道具一致性。
- [ ] 转场来自画面内部，不是一个通用叠化。
- [ ] 字幕在全片同一位置，亮度足够，且不压主体。
- [ ] 结尾回到开场母题，但信息/色彩有变化，不是简单重播。

## 逐镜静帧检查

每个镜头至少看：

- 起始后 0.2s（进入是否成立）
- 中段（主动作是否读得清）
- 切点前 0.2s（是否有离开动作）

关键动作另看 3 帧 strip：

- 浪起：底 → 峰 → 回落
- 纸幕：合 → 裂 → 分
- 虹膜：外景 → 瞳孔 → 内景
- 孔明灯：地面 → 中景 → 天空

## 质检命令

```bash
python scripts/qa_video.py out/papercut-mv.mp4 --timing timing.json \
  --width 1920 --height 1080
python scripts/contact_sheet.py out/papercut-mv.mp4 --timing timing.json \
  --out out/contact-sheet.jpg --cols 3 --width 640
ffmpeg -y -i out/papercut-mv.mp4 -filter_complex "showwavespic=s=1600x400" \
  -frames:v 1 out/wave.png
```

接触表必须从 `timing.json` 的每个 scene 取一个中点帧，不能用固定 `fps=1/2.6` 猜九格。
