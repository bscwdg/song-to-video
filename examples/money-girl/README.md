# 数钱的女孩 · 纸婚测试段

用 `papercut-mv` skill 做的完整换歌测试。截取用户提供的歌曲 11.50–43.60s，采用用户指定的 18 行歌词，生成 9 个不重复构图的层叠剪纸镜头。

## 成片

- `out/money-girl-papercut.mp4`
- 1920×1080 / 30fps / 963 帧 / 32.107s
- H.264 + AAC
- 9 镜 / 86 个实测拍点 / 18 行歌词 / 11 条纸感 SFX

## 声音与时间基准

- 原始文件：用户提供的本地歌曲文件（未随仓库分发）
- 截取区间：11.50–43.60s
- 检测 BPM：161.499
- 拍长：0.371519s
- 音乐正文终点：32.09s（片段内相对时间）
- 切点全部吸附到实测 `beats[]`

## 场景

| 镜号 | 时间 | 构图 |
|---|---|---|
| 01 如愿 | 0.00–3.23 | 低角度婚礼拱门，纸钞雨 |
| 02 婚礼 | 3.23–5.85 | 红色舞台与纸泪 |
| 03 旧我 | 5.85–9.22 | 室内剖面，人群逐拍填满房间 |
| 04 敬父母 | 9.22–12.59 | 长桌横移，四位父母与酒杯 |
| 05 钱扇 | 12.59–15.19 | 手部特写，纸钞扇与戒指 |
| 06 圆台 | 15.19–18.23 | 俯视圆形舞台，人群环绕 |
| 07 新家 | 18.23–21.22 | 房屋立面，窗户逐拍亮起 |
| 08 碰杯 | 21.22–24.59 | 低角度桌面，四杯碰杯 |
| 09 告别 | 24.59–32.09 | 日夜钱轮，旧我走入纸门 |

## 复现

```powershell
npm install
python scripts/generate_sfx.py
python ..\..\skills\papercut-mv\scripts\analyze_track.py public\audio\song.mp3 `
  --cuts 3.11,6.03,9.19,12.51,15.23,18.16,21.14,24.49 `
  --scene-components money-rise,stage-tears,room-fill,toast,hands-macro,stage-top,house-cross,table-profile,farewell `
  --scene-names 如愿,婚礼,旧我,敬父母,钱扇,圆台,新家,碰杯,告别 `
  --lrc lyrics.lrc --cues cues.json `
  --out timing.json --emit-ts src/generated/timeline.generated.ts
npx remotion render src/index.ts PaperCutMV out/money-girl-papercut.mp4 `
  --codec=h264 --crf=16 --pixel-format=yuv420p `
  --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

## 说明

本目录仅用于本次 skill 功能测试。歌曲、歌词版权归原权利人；`public/audio/song.mp3` 不应作为 skill 模板或通用素材分发。
