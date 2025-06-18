import { SNRuntime, SNPlayer, SNTransition, SNPointerLayer } from 'simple-notation';
import { ref } from 'vue';
import { useTone } from './useTone';
import * as Tone from 'tone';
import { useGuitarStore, useHarmonicaStore, usePianoStore } from '@/stores';

const player = ref<SNPlayer | null>(null);
const playState = ref<'idle' | 'playing' | 'paused'>('idle');
/**
 * 伴奏开关状态
 */
const isAccompanimentActive = ref(true);

/**
 * 旋律开关状态
 */
const isMelodyActive = ref(true);
/**
 * 自动滚动开关状态
 */
const isAutoScrollActive = ref(true);
/**
 * 节拍器开关状态
 */
const isMetronomeActive = ref(false);
/**
 * 独立节拍器模式下的 Tempo
 */
const metronomeTempo = ref(Number(SNRuntime.info?.tempo) || 120); // Default tempo is sheet tempo or 120

let teardownFns: Array<() => void> = [];

export function usePlayer() {
  const {
    transpose,
    playNote,
    noteNameToMidi,
    midiToNoteName,
    transport,
    currentInstrumentType,
    startStandaloneMetronome,
  } = useTone();

  const init = async () => {
    if (player.value) return;
    // 根据传入的tempo参数设置播放速度
    Tone.Transport.bpm.value = Number(SNRuntime.info.tempo);
    // 确保 Transport 处于运行状态
    await Tone.start();
    transport.start();
    player.value = new SNPlayer();
    return player.value;
  };

  const play = async () => {
    if (!player.value) {
      await init();
    }
    setupPlayerListeners();
    playState.value = 'playing';
    player.value?.play();
  };

  const pause = () => {
    playState.value = 'paused';
    player.value?.pause();
    transport.pause();
  };

  const resume = () => {
    playState.value = 'playing';
    player.value?.resume();
    transport.start();
  };

  const stop = () => {
    playState.value = 'idle';
    player.value?.stop();
    transport.stop();
    transport.position = 0;
    clearAllHighlightsAndTimers(); // 调用清除所有高亮和定时器的函数
    currentMainKeyMidi = null; // 重置主音 MIDI
    SNPointerLayer.clearPointer();
    teardownPlayerListeners(); // 停止时移除监听
  };

  const reset = () => {
    stop();
    player.value = new SNPlayer();
    teardownPlayerListeners(); // 新player前移除监听
  };

  const setCurrentIndex = (index: number) => {
    player.value?.setCurrentIndex(index);
  };

  const getNotes = () => {
    return player.value?.getNotes() || [];
  };

  const pianoStore = usePianoStore();
  const guitarStore = useGuitarStore();
  const harmonicaStore = useHarmonicaStore();

  let currentMainKeyMidi: number | null = null;
  // 用于管理旋律高亮的定时器
  let melodyHighlightTimer: number | null = null;
  // 用于管理和弦高亮的定时器
  let chordHighlightTimer: number | null = null;

  /**
   * 设置 player 的事件监听器
   */
  const setupPlayerListeners = () => {
    teardownPlayerListeners(); // 先移除旧监听
    if (!player.value) return;
    teardownFns = [];
    teardownFns.push(
      player.value.onNotePlay((note, duration) => {
        // 将简谱数字转换为音名
        const num = parseInt(note.note.replaceAll(/[()（）]/g, ''), 10);
        let noteName = '';
        // 如果是1-7的简谱数字，查找对应的音名并处理升降号和八度
        if (!isNaN(num) && num >= 1 && num <= 7) {
          noteName = SNTransition.scaleMap[num - 1];
          if (note.upDownCount > 0) noteName += '#'.repeat(note.upDownCount); // 处理升号
          // 注意：这里简谱的八度表示方式可能需要根据实际情况调整
          const octave = SNTransition.baseOctave + note.octaveCount; // 根据八度记号调整八度
          noteName += octave;
        }

        // 播放音符并处理高亮（只播放有效的、属于旋律部分的音符）
        currentMainKeyMidi = null; // 重置当前主音 MIDI

        // 旋律音播放时，清除当前旋律高亮和其定时器，但不影响和弦高亮
        clearMelodyHighlightsAndTimer();

        if (note.note === '0') {
          // 0 表示休止符，清除所有高亮和定时器
          clearAllHighlightsAndTimers(); // 清除所有，包括可能的和弦高亮
        } else if (noteName && isMelodyActive.value) {
          // 如果是有效的旋律音符且旋律功能激活
          const midi = noteNameToMidi(noteName); // 获取音符的 MIDI 值
          // 应用移调后获取实际播放的音名
          const playNoteName = midiToNoteName(midi + transpose.value);
          playNote(playNoteName, duration * 0.001); // 播放音符
          currentMainKeyMidi = midi + transpose.value; // 记录当前播放的移调后的主音 MIDI

          // 设置旋律高亮并安排清除
          pianoStore.setHighlightMidis([currentMainKeyMidi]);
          guitarStore.setHighlightMidis([currentMainKeyMidi]);
          harmonicaStore.setHighlightMidis([currentMainKeyMidi]);
          scheduleMelodyHighlightClear(duration * 0.001); // 调用旋律高亮清除函数
        } else {
          // 如果是非旋律音符（例如和弦分解中的音）或休止符
          // 对于非旋律音符，不设置旋律高亮，确保清除旧的旋律高亮
          clearMelodyHighlightsAndTimer();
        }
      }),
    );

    // 监听和弦播放事件 (主要用于伴奏部分)
    teardownFns.push(
      player.value.onChordPlay((note, duration) => {
        clearChordHighlightsAndTimer();

        // 如果有和弦符号且伴奏功能激活
        if (Array.isArray(note.chord) && isAccompanimentActive.value) {
          let allNotesToPlay: string[] = []; // 收集所有需要播放的音符

          switch (currentInstrumentType.value) {
            case 'piano':
              const pianoNotesToPlay = pianoStore.processChord(note.chord);
              allNotesToPlay.push(...pianoNotesToPlay);
              break;
            case 'guitar-acoustic':
              const guitarNotesToPlay = guitarStore.processChord(note.chord);
              allNotesToPlay.push(...guitarNotesToPlay);
              break;
            case 'harmonica':
              break;
            default:
              break;
          }

          // 和弦释放额外时长，用于模拟扫弦效果
          const chordReleaseExtra = 0.15;

          // 播放所有收集到的音符（去重）
          Array.from(new Set(allNotesToPlay)).forEach((noteToPlay) => {
            // 应用移调后播放音符
            const midi = noteNameToMidi(noteToPlay);
            const playNoteName = midiToNoteName(midi + transpose.value);
            playNote(playNoteName, duration * 0.001 + chordReleaseExtra);
          });

          // 安排和弦高亮在持续时间后清除
          scheduleChordHighlightClear(duration * 0.001 + chordReleaseExtra); // 调用和弦高亮清除函数
        } else {
          // 如果没有播放和弦或者伴奏功能未激活，清除和弦高亮和其定时器
          clearChordHighlightsAndTimer();
        }
      }),
    );

    // 监听指针移动事件，显示当前播放位置的指针
    teardownFns.push(
      player.value.onPointerMove((note) => {
        SNPointerLayer.showPointer(`note-${note.index}`);

        // 如果自动滚动激活，将当前音符滚动到视口内
        if (isAutoScrollActive.value) {
          const container = document.getElementById('auto-scroll-container'); // 获取乐谱容器
          const noteElement = document.querySelector(`[sn-tag="note-${note.index}"]`); // 获取当前音符对应的DOM元素
          if (container && noteElement) {
            const containerRect = container.getBoundingClientRect();
            const noteRect = noteElement.getBoundingClientRect();
            const containerHeight = containerRect.height;
            const noteHeight = noteRect.height;
            const noteTopToViewport = noteRect.top - containerRect.top;
            const desiredBottomMargin = 160; // 设置距离容器底部视口的期望像素值
            const desiredTopMargin = 160; // 设置距离容器顶部视口的期望像素值
            const desiredNoteBottomToViewport = containerHeight - desiredBottomMargin;
            const noteBottomToViewport = noteTopToViewport + noteHeight;
            let scrollDelta = 0;
            if (noteTopToViewport < desiredTopMargin) {
              scrollDelta = noteTopToViewport - desiredTopMargin;
            } else if (noteBottomToViewport > desiredNoteBottomToViewport) {
              scrollDelta = noteBottomToViewport - desiredNoteBottomToViewport;
            } else {
              return;
            }
            const currentScrollTop = container.scrollTop;
            const targetScrollTop = currentScrollTop + scrollDelta;
            const maxScrollTop = container.scrollHeight - containerHeight;
            const finalScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));
            console.log(finalScrollTop, currentScrollTop);

            if (finalScrollTop !== currentScrollTop) {
              console.log(finalScrollTop);

              container.scrollTo({
                top: finalScrollTop,
                behavior: 'smooth',
              });
            }
          }
        }
      }),
    );

    // 监听播放结束事件
    teardownFns.push(
      player.value.onEnd(() => {
        clearAllHighlightsAndTimers(); // 调用清除所有高亮和定时器的函数
        currentMainKeyMidi = null;
        transport.stop();
        transport.position = 0; // 重置播放位置
        SNPointerLayer.clearPointer();
        playState.value = 'idle'; // 更新播放状态为停止
        if (isMetronomeActive.value) {
          startStandaloneMetronome(Number(metronomeTempo.value)); // Restart in standalone mode with current tempo
        }
      }),
    );
  };

  const teardownPlayerListeners = () => {
    teardownFns.forEach((fn) => fn && fn());
    teardownFns = [];
  };

  /**
   * 清除所有当前旋律高亮和旋律高亮清除定时器。
   */
  function clearMelodyHighlightsAndTimer() {
    pianoStore.clearMelodyHighlightMidis();
    guitarStore.clearMelodyHighlightMidis();
    harmonicaStore.clearMelodyHighlightMidis();
    if (melodyHighlightTimer) {
      clearTimeout(melodyHighlightTimer);
      melodyHighlightTimer = null;
    }
  }

  /**
   * 安排旋律高亮在指定持续时间后清除。
   * 在设置新的旋律高亮时调用此函数。它会取消之前安排的任何旋律清除操作。
   * @param {number} durationSec - 高亮持续时间（秒）。
   */
  function scheduleMelodyHighlightClear(durationSec: number) {
    if (melodyHighlightTimer) {
      clearTimeout(melodyHighlightTimer);
      melodyHighlightTimer = null;
    }
    melodyHighlightTimer = window.setTimeout(() => {
      pianoStore.clearMelodyHighlightMidis();
      guitarStore.clearMelodyHighlightMidis();
      harmonicaStore.clearMelodyHighlightMidis();
      melodyHighlightTimer = null;
    }, durationSec * 1000);
  }

  /**
   * 清除所有当前和弦高亮和和弦高亮清除定时器。
   */
  function clearChordHighlightsAndTimer() {
    pianoStore.clearChordHighlightMidis();
    guitarStore.clearChordHighlightMidis();
    harmonicaStore.clearChordHighlightMidis();
    if (chordHighlightTimer) {
      clearTimeout(chordHighlightTimer);
      chordHighlightTimer = null;
    }
  }

  /**
   * 安排和弦高亮在指定持续时间后清除。
   * 在设置新的和弦高亮时调用此函数。它会取消之前安排的任何和弦清除操作。
   * @param {number} durationSec - 高亮持续时间（秒）。
   */
  function scheduleChordHighlightClear(durationSec: number) {
    if (chordHighlightTimer) {
      clearTimeout(chordHighlightTimer);
      chordHighlightTimer = null;
    }
    chordHighlightTimer = window.setTimeout(() => {
      pianoStore.clearChordHighlightMidis();
      guitarStore.clearChordHighlightMidis();
      harmonicaStore.clearChordHighlightMidis();
      chordHighlightTimer = null;
    }, durationSec * 1000);
  }

  /**
   * 清除所有高亮和任何 pending 的高亮清除定时器（旋律和和弦）。
   */
  function clearAllHighlightsAndTimers() {
    clearMelodyHighlightsAndTimer();
    clearChordHighlightsAndTimer();
  }

  return {
    player,
    playState,
    init,
    play,
    pause,
    resume,
    stop,
    reset,
    setCurrentIndex,
    getNotes,
    setupPlayerListeners,
    teardownPlayerListeners,
    isAccompanimentActive,
    isMelodyActive,
    isAutoScrollActive,
    isMetronomeActive,
    metronomeTempo,
  };
}
