# 使用 papercut-mv skill

`papercut-mv` 是一个面向 Codex / Claude 等代码 Agent 的**制作 skill**，不是双击即可出片的桌面软件。

它的作用是让 Agent 按同一套流程完成：

1. 读取歌曲和歌词
2. 测 BPM、拍点和音乐正文终点
3. 把切点吸附到真实拍点
4. 生成 Remotion 时间轴
5. 实现 9 个剪纸镜头
6. 渲染并做 QA

## 两种使用方式

### 方式 A：直接在仓库里做新项目

不需要安装 skill，直接复制模板：

```powershell
cd song-to-video
Copy-Item skills\papercut-mv\template examples\my-song -Recurse
cd examples\my-song
npm install
python -m pip install -r requirements.txt
```

然后把用户提供的歌曲放到：

```text
public/audio/song.mp3
```

把歌词保存为 `lyrics.lrc`。

### 方式 B：安装成 Codex skill

把整个 `papercut-mv` 目录复制到 Codex 的用户 skill 目录：

```powershell
$src = ".\skills\papercut-mv"
$dst = Join-Path $env:USERPROFILE ".codex\skills\papercut-mv"

New-Item -ItemType Directory -Force $dst | Out-Null
Copy-Item "$src\*" $dst -Recurse -Force
```

重新打开或刷新 Codex 后，就可以在对话里直接要求使用 `papercut-mv`。

如果只是当前项目临时使用，也可以不安装，直接对 Agent 说：

```text
读取 song-to-video/skills/papercut-mv/SKILL.md，按它制作这条 MV。
```

## 推荐调用方式

最稳的提示词是同时给出四件事：歌曲路径、歌词、画幅和交付阶段。

```text
使用 papercut-mv 制作一支 16:9 的层叠剪纸 MV。

歌曲：D:\music\song.mp3
歌词：D:\music\song.lrc
目标：9 个不重复构图，切点吸附到真实拍点。

先完成：
1. 音频分析
2. 拍点和场景切分
3. 9 镜分镜

先不要渲染整片，等我确认分镜后再实现代码。
```

确认分镜后，再继续：

```text
按确认后的 STORYBOARD.md 实现场景。
先渲染 9 张中点静帧给我看，确认后再渲染整片。
```

这种方式比直接说“帮我做个视频”更稳定，因为 Agent 不会在分镜未确认时提前铺 9 个场景代码。

## 标准命令

在新建的项目目录中执行：

```powershell
python scripts\analyze_track.py public\audio\song.mp3 `
  --cuts 3.6,5.7,7.4 `
  --scene-components world,split,world `
  --scene-names 起航,离开,尾声 `
  --lrc lyrics.lrc `
  --out timing.json `
  --emit-ts src\generated\timeline.generated.ts
```

实现场景后：

```powershell
npm run typecheck
npx remotion render src\index.ts PaperCutMV out\papercut-mv.mp4 `
  --codec=h264 --crf=16 --pixel-format=yuv420p

python scripts\qa_video.py out\papercut-mv.mp4 --timing timing.json
python scripts\contact_sheet.py out\papercut-mv.mp4 --timing timing.json `
  --out out\contact-sheet.jpg
```

## 输入文件

### 音频

建议使用用户自己拥有或已获授权的音频。仓库不会提交：

- `public/audio/*`
- `public/sfx/*`
- `out/*`
- 任何 `video/` 目录

### 歌词 LRC

示例：

```text
[00:11.91]第一句歌词
[00:13.50]第二句歌词
```

字幕保留 LRC 原始起唱时间。切点另行吸附到拍点，两者不混用。

## 生成的项目结构

```text
my-song/
├─ public/audio/song.mp3
├─ lyrics.lrc
├─ timing.json
├─ STORYBOARD.md
├─ src/generated/timeline.generated.ts
├─ src/scenes/
└─ out/
```

## 常见问题

### 只有模板，为什么不能直接出片？

模板只提供纸张材质、纸偶、时间轴和场景协议。每首歌的构图、角色和动作仍需实现。

### 可以自动选 9 个镜头吗？

Agent 可以根据歌词结构提出 9 镜分镜，但必须先确认构图和动作。代码只能执行已确定的分镜。

### 可以换视觉风格吗？

可以。当前 `papercut-mv` 是第一种风格。新增风格应复制一套 `skills/<style-name>/`，不要直接把别的风格塞进剪纸模板。

### 可以上传歌曲和成片吗？

不建议。仓库只保存代码和文档。歌曲、歌词与成片是否可公开，取决于权利授权。

## 当前限制

- 只内置 16:9 模板
- 场景美术需要逐镜实现
- 分镜和画面质量需要人工审查
- 不是一键生成任意题材视频的产品
