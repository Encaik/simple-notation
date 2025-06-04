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
  // harmonium: '/samples/harmonium/',
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
    'F#4': 'Fs4.mp3',
    G4: 'G4.mp3',
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
  if (sampler && currentInstrumentType.value === instrumentType) {
    // If sampler exists and instrument type is the same, no need to re-create
    return;
  }

  const baseUrl = instrumentBaseUrls[instrumentType];
  const urls = instrumentUrls[instrumentType];

  if (!baseUrl || !urls) {
    console.error(
      `Unsupported instrument type or missing URLs: ${instrumentType}`,
    );
    return;
  }

  // Dispose of the old sampler if it exists
  if (sampler) {
    await sampler.dispose(); // Use await dispose() for async operation
    sampler = undefined; // Ensure it's set to undefined after disposing
  }

  // Create a new sampler with the new base URL and specific URLs
  sampler = new Tone.Sampler({
    urls: urls,
    baseUrl: baseUrl,
    onload: () => {
      console.log(`Sampler loaded for instrument: ${instrumentType}`);
    },
    onerror: (error) => {
      console.error(`Error loading sampler for ${instrumentType}:`, error);
    },
  }).toDestination();

  currentInstrumentType.value = instrumentType;
  await Tone.start(); // Ensure context is running before loading samples
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
    duration: Tone.Unit.Time = '8n', // 默认时长改为8分音符，更通用
    time?: Tone.Unit.Time, // 添加time parameter for sequencer use
  ) {
    await Tone.start();
    if (!sampler) {
      console.warn('Sampler not initialized.');
      // Attempt to set the default instrument if sampler is somehow null
      setInstrument(currentInstrumentType.value).catch(console.error);
      return;
    }
    let noteName: string;
    if (typeof note === 'number') {
      noteName = midiToNoteName(note);
    } else {
      noteName = note;
    }

    // triggerAttackRelease(note, duration, time, velocity)
    // velocity defaults to 1, can be adjusted if needed
    sampler.triggerAttackRelease(noteName, duration, time);
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
  };

  /**
   * 分析mp3音频文件的音高，输出音符列表
   * @param {ArrayBuffer} mp3ArrayBuffer - mp3文件的二进制数据
   * @returns {Promise<{time: number, freq: number, note: string, clarity: number}[]>}
   */
  async function analyzeMp3Pitch(
    mp3ArrayBuffer: ArrayBuffer,
  ): Promise<{ time: number; freq: number; note: string; clarity: number }[]> {
    // 1. 解码mp3为AudioBuffer
    const audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(
      mp3ArrayBuffer.slice(0),
    );
    // 2. 取第一个声道
    const channelData = audioBuffer.getChannelData(0);
    // 3. 初始化 pitchy 检测器
    const frameSize = 2048;
    const hopSize = 512; // 帧移
    const detector = PitchDetector.forFloat32Array(frameSize);
    const notes: Array<{
      time: number;
      freq: number;
      note: string;
      clarity: number;
    }> = [];
    for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
      const frame = channelData.slice(i, i + frameSize);
      const [pitch, clarity] = detector.findPitch(
        frame,
        audioBuffer.sampleRate,
      );
      if (clarity > 0.95 && pitch > 60 && pitch < 1500) {
        notes.push({
          time: i / audioBuffer.sampleRate,
          freq: pitch,
          note: freqToNoteName(pitch),
          clarity,
        });
      }
    }
    audioContext.close();
    return notes;
  }

  /**
   * 频率转音名+八度（如C4、D#4、A5）
   * @param {number} freq
   * @returns {string}
   */
  function freqToNoteName(freq: number): string {
    const noteNames = [
      'C',
      'C#',
      'D',
      'D#',
      'E',
      'F',
      'F#',
      'G',
      'G#',
      'A',
      'A#',
      'B',
    ];
    const A4 = 440;
    const n = Math.round(12 * Math.log2(freq / A4));
    const noteIndex = (n + 9 + 12 * 1000) % 12;
    const octave = 4 + Math.floor((n + 9) / 12);
    return noteNames[noteIndex] + octave;
  }
}
