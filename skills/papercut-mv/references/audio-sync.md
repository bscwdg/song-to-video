# 音乐同步与音效

## 1. 先确定“音乐正文”

用户给的视频文件常带平台尾页、静音或孤立尾音。先量：

```bash
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 input.mp4
```

再看 RMS/波形。连续近静音超过 0.5s 一般说明歌曲主体已结束。成片时长取音乐正文，不取容器时长；若用户明确要求完整容器，再另做“尾部留白版”。

`analyze_track.py` 会输出 `musical_body_end` 及其判定方式：

- `trim-isolated-tail`：跳过静音后的孤立尾音；
- `last-active-run`：取最后一段持续发声；
- `cli`：调用方用 `--body-end` 明确覆盖。

## 2. 拍网格

对 120–170 BPM 的流行歌，BPM 公式只能用于没有检测结果时的 fallback：

```python
beat_seconds = 60 / bpm
beat_times = offset + np.arange(n) * beat_seconds
```

真实流行歌会有轻微变速和检测量化误差，片尾累计漂移可到数百毫秒。**动作层必须以 `timing.json` 的 `beats[]` 为准。**

切点吸附：

```python
snapped = beat_times[np.argmin(np.abs(beat_times - user_cut))]
```

如果用户说“切点落在离唱句最近的那一拍”，以**唱句起唱附近**的拍为主，不要机械取整到整秒。

切点和字幕是两条时间线：

- **切点**吸附到最近的拍；
- **字幕起唱**保留 LRC/ASR 的原始时间，因为人声不一定正好落在量化拍点上；
- 若需要显示对拍质量，用 `lyrics[].nearestBeat` / `beatDeltaMs` 记录参考，但不要偷偷改字幕时间。

生成 Remotion 时间轴：

```bash
python scripts/analyze_track.py public/audio/song.mp3 \
  --cuts 3.6,5.7,7.4 \
  --scene-components world,split,world \
  --out timing.json \
  --emit-ts src/generated/timeline.generated.ts
```

不要把 seconds 公式另抄进 scene；scene 的 `beatPulseAt` / `localBeatIndex` 必须使用注入的 `beats[]`。

## 3. 歌词

- 优先用 LRC/ASR 得到起唱。
- 支持一行多时间戳（例如 `[00:02.13][00:06.44]Chorus`），都写入独立歌词行。
- 没有时间轴时，从参考画面逐句截图核对。
- 同一句跨过切点时，字幕保持整句；切镜不等于切句。
- 字幕出现不要做逐字弹跳；用纸片抽出、上抬或轻揭示即可。

## 4. 音效层级

| 层级 | 音量 | 用途 |
|---|---:|---|
| BGM | -12 至 -9 LUFS 感知 | 主情绪 |
| 结构音效（纸浪/撕纸） | -22 至 -18 dB | 标记切点/动作 |
| 细节音效（灯/星） | -28 至 -24 dB | 半拍闪烁/小动作 |
| 特殊音效（鲸/水） | -24 至 -20 dB | 峰值时刻 |

不要为每一拍都放同一个音效。让“结构音效”只出现在物理动作真正发生时。

## 5. 混音检查

- 第一遍只听 BGM：确认没有断点。
- 第二遍只听 SFX：确认没有刺耳或连续高频。
- 第三遍听全混：确认 SFX 不遮住人声。
- 用 ffmpeg 输出频谱图，检查是否有整体削波或 DC。
- 成片音频峰值建议低于 -1 dBFS，必要时 `loudnorm` 到 -14 LUFS。
