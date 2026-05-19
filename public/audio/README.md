# BGM 文件放置说明

请把四个阶段的背景音乐放在这个目录，并使用以下文件名：

- `menstrual.mp3`：月经期 / 冬
- `follicular.mp3`：卵泡期 / 春
- `ovulatory.mp3`：排卵期 / 夏
- `luteal.mp3`：黄体期 / 秋

前端播放器会自动读取这些路径：

- `/audio/menstrual.mp3`
- `/audio/follicular.mp3`
- `/audio/ovulatory.mp3`
- `/audio/luteal.mp3`

建议使用 `.mp3`，音量不用提前压太低，前端默认播放音量是 28%。
