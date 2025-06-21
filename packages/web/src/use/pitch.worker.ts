import { PitchDetector } from 'pitchy';

/**
 * 频率转MIDI音高
 * @param frequency 频率 (Hz)
 * @returns MIDI 音高 (0-127)
 */
function frequencyToMidi(frequency: number): number {
  return Math.round(12 * Math.log2(frequency / 440) + 69);
}

/**
 * MIDI音高转音名
 * @param midi MIDI 音高
 * @returns 音名 (例如 "A4")
 */
function midiToNoteName(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return noteNames[noteIndex] + octave;
}

interface WorkerData {
  channelData: Float32Array;
  sampleRate: number;
}

/**
 * 监听主线程消息，执行音高分析
 */
self.onmessage = async (event: MessageEvent<WorkerData>) => {
  try {
    const { channelData, sampleRate } = event.data;

    // --- Pitchy 正确用法 ---
    const frameSize = 2048; // 帧大小，通常是2的幂
    const hopSize = 512; // 帧之间的跳跃大小
    const detector = PitchDetector.forFloat32Array(frameSize);
    const noteEvents: { note: string; time: number }[] = [];

    for (let i = 0; i <= channelData.length - frameSize; i += hopSize) {
      const frame = channelData.slice(i, i + frameSize);
      const [pitch, clarity] = detector.findPitch(frame, sampleRate);

      const currentTime = i / sampleRate;

      // 每处理一定步数后报告一次进度
      if (i % (hopSize * 10) === 0) {
        const progress = (i / (channelData.length - frameSize)) * 100;
        self.postMessage({ type: 'progress', data: progress });
      }

      // 根据清晰度和频率范围过滤结果
      if (clarity > 0.95 && pitch > 60 && pitch < 1500) {
        const midi = frequencyToMidi(pitch);
        const noteName = midiToNoteName(midi);
        noteEvents.push({
          note: noteName,
          time: currentTime,
        });
      }
    }

    // 发送最终结果
    self.postMessage({ type: 'progress', data: 100 }); // 确保进度条达到100%
    self.postMessage({ type: 'result', data: noteEvents });
  } catch (error) {
    // 发送错误信息
    self.postMessage({ type: 'error', data: (error as Error).message });
  } finally {
    // 分析完成，关闭 worker
    self.close();
  }
};
