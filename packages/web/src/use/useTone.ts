import * as Tone from 'tone';
import { ref } from 'vue';
import { PitchDetector } from 'pitchy';

/**
 * useTone - 采样器全局单例及播放hook
 * @returns { sampler: Tone.Sampler, playNote: (noteName: string, duration?: number, time?: Tone.Unit.Time) => Promise<void>, noteNameToMidi: (noteName: string) => number, midiToNoteName: (midi: number) => string, transport: Tone.Transport, setInstrument: (instrumentType: string) => Promise<void> }
 */
let sampler: Tone.Sampler | undefined;
const transport = Tone.getTransport();
const currentInstrumentType = ref('piano'); // 记录当前乐器类型
const transpose = ref(0); // 移调

const instrumentBaseUrls: Record<string, string> = {
  piano: '/samples/piano/',
  'guitar-acoustic': '/samples/guitar-acoustic/',
  harmonium: '/samples/harmonium/',
};

const instrumentUrls: Record<string, Record<string, string>> = {
  piano: {
    C1: 'C1.mp3',
    'D#1': 'Ds1.mp3',
    'F#1': 'Fs1.mp3',
    A1: 'A1.mp3',
    C2: 'C2.mp3',
    'D#2': 'Ds2.mp3',
    'F#2': 'Fs2.mp3',
    A2: 'A2.mp3',
    C3: 'C3.mp3',
    'D#3': 'Ds3.mp3',
    'F#3': 'Fs3.mp3',
    A3: 'A3.mp3',
    C4: 'C4.mp3',
    'D#4': 'Ds4.mp3',
    'F#4': 'Fs4.mp3',
    A4: 'A4.mp3',
    C5: 'C5.mp3',
    'D#5': 'Ds5.mp3',
    'F#5': 'Fs5.mp3',
    A5: 'A5.mp3',
    C6: 'C6.mp3',
    'D#6': 'Ds6.mp3',
    'F#6': 'Fs6.mp3',
    A6: 'A6.mp3',
    C7: 'C7.mp3',
    'D#7': 'Ds7.mp3',
    'F#7': 'Fs7.mp3',
    A7: 'A7.mp3',
    C8: 'C8.mp3',
  },
  'guitar-acoustic': {
    A2: 'A2.mp3',
    'A#2': 'As2.mp3',
    B2: 'B2.mp3',
    D2: 'D2.mp3',
    'D#2': 'Ds2.mp3',
    E2: 'E2.mp3',
    F2: 'F2.mp3',
    'F#2': 'Fs2.mp3',
    G2: 'G2.mp3',
    C3: 'C3.mp3',
    'C#3': 'Cs3.mp3',
    D3: 'D3.mp3',
    'D#3': 'Ds3.mp3',
    E3: 'E3.mp3',
    F3: 'F3.mp3',
    'F#3': 'Fs3.mp3',
    G3: 'G3.mp3',
    A3: 'A3.mp3',
    'A#3': 'As3.mp3',
    B3: 'B3.mp3',
    C4: 'C4.mp3',
    'C#4': 'Cs4.mp3',
    D4: 'D4.mp3',
    'D#4': 'Ds4.mp3',
    E4: 'E4.mp3',
    F4: 'F4.mp3',
    'F#4': 'Fs4.mp3',
    G4: 'G4.mp3',
    A4: 'A4.mp3',
    'A#4': 'As4.mp3',
    B4: 'B4.mp3',
    C5: 'C5.mp3',
    'C#5': 'Cs5.mp3',
    D5: 'D5.mp3',
  },
  harmonium: {
    A2: 'A2.mp3',
    'A#2': 'As2.mp3',
    B2: 'B2.mp3',
    C2: 'C2.mp3',
    'C#2': 'Cs2.mp3',
    D2: 'D2.mp3',
    'D#2': 'Ds2.mp3',
    E2: 'E2.mp3',
    F2: 'F2.mp3',
    'F#2': 'Fs2.mp3',
    G2: 'G2.mp3',
    A3: 'A3.mp3',
    'A#3': 'As3.mp3',
    B3: 'B3.mp3',
    C3: 'C3.mp3',
    'C#3': 'Cs3.mp3',
    D3: 'D3.mp3',
    'D#3': 'Ds3.mp3',
    E3: 'E3.mp3',
    F3: 'F3.mp3',
    'F#3': 'Fs3.mp3',
    G3: 'G3.mp3',
    A4: 'A4.mp3',
    'A#4': 'As4.mp3',
    B4: 'B4.mp3',
    C4: 'C4.mp3',
    'C#4': 'Cs4.mp3',
    D4: 'D4.mp3',
    'D#4': 'Ds4.mp3',
    E4: 'E4.mp3',
    F4: 'F4.mp3',
    G4: 'G4.mp3',
    'G#4': 'Gs4.mp3',
    C5: 'C5.mp3',
    'C#5': 'Cs5.mp3',
    D5: 'D5.mp3',
  },
};

/**
 * 节拍器合成器
 */
let strongMetronomeSynth: Tone.Synth | undefined;
let weakMetronomeSynth: Tone.Synth | undefined;

/**
 * 节拍器事件调度部分
 */
let metronomePart: Tone.Part | undefined;

/**
 * 初始化或切换采样器乐器
 * @param instrumentType - 要切换的乐器类型 ('piano', 'guitar-acoustic', 'harmonium')
 */
async function setInstrument(instrumentType: string): Promise<void> {
  // If sampler exists and instrument type is the same and loaded, no need to re-create
  if (sampler && sampler.loaded && currentInstrumentType.value === instrumentType) {
    return Promise.resolve();
  }

  // If a sampler for the same instrument is already loading, return its loaded promise
  if (sampler && !sampler.loaded && currentInstrumentType.value === instrumentType) {
    await sampler.loaded;
    return;
  }

  const baseUrl = instrumentBaseUrls[instrumentType];
  const urls = instrumentUrls[instrumentType];

  if (!baseUrl || !urls) {
    console.error(`Unsupported instrument type or missing URLs: ${instrumentType}`);
    return Promise.reject(new Error('Unsupported instrument'));
  }

  // Dispose of the old sampler if it exists
  if (sampler) {
    sampler.dispose();
  }

  return new Promise((resolve, reject) => {
    sampler = new Tone.Sampler({
      urls: urls,
      baseUrl: baseUrl,
      onload: () => {
        console.log(`Sampler loaded for instrument: ${instrumentType}`);
        currentInstrumentType.value = instrumentType;
        resolve();
      },
      onerror: (error) => {
        console.error(`Error loading sampler for ${instrumentType}:`, error);
        reject(error);
      },
    }).toDestination();
    Tone.start();
  });
}

/**
 * 初始化节拍器合成器
 */
function initMetronomeSynth() {
  if (!strongMetronomeSynth) {
    strongMetronomeSynth = new Tone.Synth({
      oscillator: {
        type: 'triangle',
      },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0.1,
        release: 0.2,
      },
      volume: 0,
    }).toDestination();
  }

  if (!weakMetronomeSynth) {
    weakMetronomeSynth = new Tone.Synth({
      oscillator: {
        type: 'triangle',
      },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0.1,
        release: 0.2,
      },
      volume: -10,
    }).toDestination();
  }
}

/**
 * 启动独立节拍器
 * @param tempo - 节拍速度 (BPM)
 */
async function startStandaloneMetronome(tempo: number) {
  await Tone.start();
  initMetronomeSynth();
  if (metronomePart) {
    metronomePart.dispose();
  }
  Tone.Transport.bpm.value = tempo;
  metronomePart = new Tone.Part(
    (time, noteType) => {
      if (noteType === 'strong') {
        strongMetronomeSynth?.triggerAttackRelease('C5', '8n', time);
      } else {
        weakMetronomeSynth?.triggerAttackRelease('C4', '8n', time);
      }
    },
    [
      ['0:0:0', 'strong'],
      ['0:1:0', 'weak'],
      ['0:2:0', 'weak'],
      ['0:3:0', 'weak'],
    ],
  );

  metronomePart.loop = true;
  metronomePart.loopEnd = '1m';
  metronomePart.start(0);
  transport.start();
}

/**
 * 停止独立节拍器
 */
function stopStandaloneMetronome() {
  if (metronomePart) {
    metronomePart.stop(0);
    metronomePart.dispose();
    metronomePart = undefined;
  }

  if (strongMetronomeSynth) {
    strongMetronomeSynth.dispose();
    strongMetronomeSynth = undefined;
  }

  if (weakMetronomeSynth) {
    weakMetronomeSynth.dispose();
    weakMetronomeSynth = undefined;
  }
}

export function useTone() {
  // Initialize sampler with default instrument if not already initialized
  if (!sampler) {
    setInstrument(currentInstrumentType.value).catch(console.error);
  }

  function setTranspose(val: number) {
    transpose.value = val;
  }

  /**
   * 将音名转为midi number
   * @param noteName - 如C4、D#4
   * @returns midi number
   */
  function noteNameToMidi(noteName: string): number {
    return Tone.Frequency(noteName).toMidi();
  }

  /**
   * 将midi number转为音名
   * @param midi - midi number
   * @returns note name
   */
  function midiToNoteName(midi: number): string {
    return Tone.Frequency(midi, 'midi').toNote();
  }

  /**
   * 播放指定音名或midi的音符，支持移调
   * @param note - 如C4、D#4或midi number
   * @param duration - 秒，音符持续时间
   * @param time - Tone.js时间单位，指定音符何时触发
   */
  async function playNote(
    note: string | number,
    duration: Tone.Unit.Time = '8n',
    time?: Tone.Unit.Time,
  ) {
    if (!sampler) {
      console.error('Sampler not initialized. Cannot play note.');
      return;
    }
    if (!sampler.loaded) {
      // This warning is helpful for debugging loading issues.
      console.warn('Sampler is not fully loaded yet, playback might be skipped.');
      return;
    }
    let noteName = '';
    if (typeof note === 'number') {
      noteName = midiToNoteName(note);
    } else {
      noteName = note;
    }
    const noteNameWithTranspose = midiToNoteName(noteNameToMidi(noteName) + transpose.value);
    sampler.triggerAttackRelease(noteNameWithTranspose, duration, time);
  }

  /**
   * 频率转音名+八度（如C4、D#4、A5）
   * @param {number} freq
   * @returns {string}
   */
  function freqToNoteName(freq: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    const n = Math.round(12 * Math.log2(freq / A4));
    const noteIndex = (n + 9 + 12 * 1000) % 12;
    const octave = 4 + Math.floor((n + 9) / 12);
    return noteNames[noteIndex] + octave;
  }

  function noteNameToFreq(noteName: string): number {
    return Tone.Frequency(noteName).toFrequency();
  }

  return {
    sampler: sampler!,
    transpose,
    setTranspose,
    playNote,
    noteNameToMidi,
    midiToNoteName,
    transport,
    setInstrument,
    currentInstrumentType,
    startStandaloneMetronome, // 导出新的节拍器函数
    stopStandaloneMetronome, // 导出新的节拍器函数
    analyzeMp3Pitch,
    freqToNoteName,
    noteNameToFreq,
  };

  /**
   * 将 MP3 文件中的音高进行分析，返回音符事件数组
   * @param mp3ArrayBuffer - MP3 文件的 ArrayBuffer
   * @param onProgress - 进度回调函数，接收 0-100 的数字
   * @returns - 返回一个 Promise，解析为音符事件数组
   */
  async function analyzeMp3Pitch(
    mp3ArrayBuffer: ArrayBuffer,
    onProgress: (progress: number) => void,
  ): Promise<{ pitchEvents: { note: string; time: number }[]; decodedAudioData: AudioBuffer }> {
    // 1. 在主线程解码音频，因为 Worker 中没有 AudioContext
    const audioContext = new AudioContext();
    const decodedAudioData = await audioContext.decodeAudioData(mp3ArrayBuffer);
    const channelData = decodedAudioData.getChannelData(0); // Float32Array
    const sampleRate = decodedAudioData.sampleRate;

    return new Promise((resolve, reject) => {
      // Vite 支持直接使用 `new Worker(...)` 语法
      // `?worker` 后缀是 Vite 特有的，它会自动处理 worker 的构建
      const worker = new Worker(new URL('./pitch.worker.ts', import.meta.url), {
        type: 'module',
      });

      worker.onmessage = (
        event: MessageEvent<{
          type: 'progress' | 'result' | 'error';
          data: any;
        }>,
      ) => {
        const { type, data } = event.data;
        if (type === 'progress') {
          onProgress(data);
        } else if (type === 'result') {
          resolve({ pitchEvents: data, decodedAudioData });
          worker.terminate();
        } else if (type === 'error') {
          console.error('Pitch analysis worker error:', data);
          reject(new Error(data));
          worker.terminate();
        }
      };

      worker.onerror = (error) => {
        console.error('Worker error:', error);
        reject(error);
        worker.terminate();
      };

      // 2. 准备数据并发送给 worker
      // Float32Array 是可转移对象 (Transferable)，可以高效传递，避免拷贝
      const workerData = {
        channelData,
        sampleRate,
      };
      worker.postMessage(workerData, [workerData.channelData.buffer]);
    });
  }

  /**
   * 将一段音频流进行实时音高检测
   * @param stream - 音频流
   * @param onPitchUpdate - 音高更新回调函数
   */
  async function analyzeStreamPitch(
    stream: MediaStream,
    onPitchUpdate: (pitchData: {
      time: number;
      freq: number;
      note: string;
      clarity: number;
    }) => void,
  ) {
    await Tone.start();
    const audioContext = Tone.getContext().rawContext as AudioContext;
    const analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyserNode);

    const detector = PitchDetector.forFloat32Array(analyserNode.fftSize);
    const input = new Float32Array(detector.inputLength);

    const updatePitch = () => {
      analyserNode.getFloatTimeDomainData(input);
      const [freq, clarity] = detector.findPitch(input, audioContext.sampleRate);
      if (freq) {
        onPitchUpdate({
          time: Tone.now(),
          freq,
          note: freqToNoteName(freq),
          clarity,
        });
      }
      requestAnimationFrame(updatePitch);
    };
    updatePitch();
  }
}
