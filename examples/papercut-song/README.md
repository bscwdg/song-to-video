# 纸潮 · Paper Tide

为 24.056s 歌曲正文制作的 9 镜层叠剪纸动效 MV。画面、纸偶、纹理、转场和音效全部由 Remotion + React + SVG 程序化生成；用户提供的歌曲是唯一外部音源。

## 成片

- `out/papercut-mv.mp4`
- 1920×1080 / 30fps / 722 帧 / H.264 + AAC
- 9 镜，切点吸附至 143.55 BPM 的真实拍点

## 运行

```powershell
npm install
npm run start
```

正式渲染：

```powershell
npx remotion render src/index.ts PaperCutMV out/papercut-mv.mp4 `
  --codec=h264 --crf=16 --pixel-format=yuv420p `
  --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

重新生成音效：

```powershell
python scripts/generate_sfx.py
```

## 文件结构

```text
src/
  timeline.ts              拍点、切点、歌词与缓动工具
  components/Paper.tsx     剪纸纹理、月亮、纸船、人物、鲸、孔明灯
  components/Lyrics.tsx    纸片歌词条
  components/Soundtrack.tsx BGM + 卡点音效编排
  scenes/                  9 个独立构图镜头
scripts/generate_sfx.py    程序化合成 10 个纸感音效
```

## 素材说明

`public/audio/song.mp3` 是用户为本项目提供的参考音频，仅用于本次成片，不随 skill 模板分发。重复使用 skill 时必须替换为用户自有或已获授权的音轨与歌词。
