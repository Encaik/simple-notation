import * as Tone from 'tone';
import { ref } from 'vue';

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
let metronomeSynth: Tone.Synth | undefined;

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
  // 修改函数名以反映使用一个合成器
  if (!metronomeSynth) {
    metronomeSynth = new Tone.Synth({
      oscillator: {
        type: 'sine', // 简单正弦波
      },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0.01,
        release: 0.1,
      },
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
      const pitch = noteType === 'strong' ? 'C5' : 'C4';
      metronomeSynth?.triggerAttackRelease(pitch, '8n', time);
    },
    [
      ['0:0:0', 'strong'],
      ['0:1:0', 'weak'],
      ['0:2:0', 'weak'],
      ['0:3:0', 'weak'],
    ],
  );

  metronomePart.loop = true; // 循环播放
  metronomePart.loopEnd = '1m'; // 一小节后循环 (假设是4/4拍)
  metronomePart.start(0);
  transport.start();
}

/**
 * 停止独立节拍器
 */
function stopStandaloneMetronome() {
  if (metronomePart) {
    metronomePart.stop(0); // 立即停止 Part
    metronomePart.dispose(); // 释放资源
    metronomePart = undefined;
  }
  // 注意：这里不停止 Tone.Transport，因为它可能被乐谱播放使用
  // 如果 Transport 没有被乐谱使用，它会在闲置一段时间后自动停止

  // 释放合成器资源，避免内存泄露
  if (metronomeSynth) {
    // 修改为只处理一个合成器
    metronomeSynth.dispose();
    metronomeSynth = undefined;
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
  };
}
