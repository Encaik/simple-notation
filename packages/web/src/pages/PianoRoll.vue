<template>
  <Card>
    <template v-slot:title>
      <PianoRollTitle :is-playing="isPlaying" :toggle-playback="togglePlayback" />
    </template>
    <div class="h-[90vh] w-full flex bg-gray-700 rounded-md overflow-hidden relative">
      <Loading :is-loading="isLoading" text="正在分析和加载音符..." />
      <PianoRollKeyboard class="w-16 flex-shrink-0" />
      <div class="flex flex-col flex-1 w-0">
        <PianoRollTimeLine />
        <PianoRollMinimap />
        <PianoRollGrid
          ref="pianoGridRef"
          class="flex-1 overflow-auto"
          :key="pianoRollStore.mp3Offset"
          :audio-buffer="audioBuffer"
        />
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import PianoRollKeyboard from '../components/piano-roll/PianoRollKeyboard.vue';
import PianoRollGrid from '../components/piano-roll/PianoRollGrid.vue';
import PianoRollTimeLine from '../components/piano-roll/PianoRollTimeLine.vue';
import PianoRollMinimap from '../components/piano-roll/PianoRollMinimap.vue';
import PianoRollTitle from '../components/piano-roll/PianoRollTitle.vue';
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { SNTransition } from 'simple-notation';
import * as Tone from 'tone';
import { useTone } from '@/use';
import { useEditorStore, usePianoRollStore, type PianoRollNote } from '@/stores';
import { storeToRefs } from 'pinia';
import Loading from '../widgets/Loading.vue';

// 统一用store管理全局参数
const pianoRollStore = usePianoRollStore();
const { mode, type, barWidth, viewWidth, bars, minimapWidth, beatsPerBar, tempo } =
  storeToRefs(pianoRollStore);

const { playNote, midiToNoteName, setInstrument } = useTone();
const editorStore = useEditorStore();
const isPlaying = ref(false);
const isLoading = ref(false);
const route = useRoute();

// 用于mp3原始音频播放
const audioContext = ref<AudioContext | null>(null);
const audioSource = ref<AudioBufferSourceNode | null>(null);
const audioBuffer = computed(() => pianoRollStore.audioBufferForSpectrogram);
const isMp3Mode = computed(
  () => mode.value === 'time' && (!!audioBuffer.value || !!pianoRollStore.mp3File),
);
const mp3File = computed(() => pianoRollStore.mp3File);
let mp3Audio: HTMLAudioElement | null = null; // 用于直接播放mp3文件

// 监听主内容区宽度变化
onMounted(() => {
  const modeParam = route.query.mode as 'bar' | 'time';
  const typeParam = route.query.type as 'new' | 'edit' | 'midi' | 'mp3';
  pianoRollStore.setMode(modeParam || 'bar');
  pianoRollStore.setType(typeParam || 'new');
  pianoRollStore.clearAll();
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('wheel', handleWheel, { passive: false });
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('wheel', handleWheel);
});

// 监听barWidth变化，自动调整viewWidth
watch(
  () => barWidth.value,
  (newBarWidth) => {
    viewWidth.value = Math.min(bars.value * newBarWidth, viewWidth.value);
  },
);

// 监听tempo/beatsPerBar/audioBuffer变化，自动调整bars（仅midi/mp3导入模式）
watch(
  [
    () => pianoRollStore.tempo,
    () => pianoRollStore.beatsPerBar,
    () => pianoRollStore.audioBufferForSpectrogram,
    () => type.value === 'midi' || type.value === 'mp3',
    () => pianoRollStore.referenceNotes,
  ],
  ([tempo, beatsPerBar, audioBuffer, isMidiMp3, referenceNotes]: [
    number,
    number,
    AudioBuffer | null,
    boolean,
    PianoRollNote[],
  ]) => {
    if (!isMidiMp3) return; // 只在midi/mp3导入模式下生效
    let duration = 0;
    if (audioBuffer) {
      duration = audioBuffer.duration;
    } else if (referenceNotes && referenceNotes.length > 0) {
      // 用参考音符最大结束时间
      duration = Math.max(...referenceNotes.map((n: PianoRollNote) => n.start + n.duration));
    }
    if (duration > 0) {
      const secondsPerBar = (60 / tempo) * beatsPerBar;
      const bars = Math.ceil(duration / secondsPerBar);
      pianoRollStore.setBars(bars);
    }
  },
  { immediate: true },
);

// convertPitchEventsToPianoRollNotes支持传入tempo
function convertPitchEventsToPianoRollNotes(
  pitchEvents: { note: string; time: number }[],
  tempo: number,
): PianoRollNote[] {
  if (!pitchEvents || pitchEvents.length === 0) {
    return [];
  }

  const notes: PianoRollNote[] = [];
  const noteMergeThresholdBeats = 0.2; // 小于这个节拍数的间隔将被合并
  const minNoteDurationSeconds = 0.05; // 过滤掉时值过短的音符

  let noteIndex = 0;
  let activeNote: {
    pitch: number;
    pitchName: string;
    startTime: number;
  } | null = null;

  // 添加一个终止事件，以确保最后一个音符能被正确处理
  const lastEventTime = pitchEvents[pitchEvents.length - 1]?.time || 0;
  const terminatedEvents = [...pitchEvents, { note: null, time: lastEventTime + 0.2 }];

  for (const event of terminatedEvents) {
    const pitchName = event.note;
    const pitch = pitchName ? SNTransition.General.noteNameToMidi(pitchName) : null;
    const currentTime = event.time;

    // 将判断条件拆解，以帮助 TS 进行正确的类型推断
    let hasChanged = false;
    if (activeNote) {
      // 如果有活动音符，检查音高是否变化
      hasChanged = pitch !== activeNote.pitch;
    } else if (pitch !== null) {
      // 如果没有活动音符，只要有新音高就算"变化"，以便开启第一个音符
      hasChanged = true;
    }

    if (hasChanged) {
      // 如果存在活动音符，说明它刚刚结束
      if (activeNote) {
        const durationInSeconds = currentTime - activeNote.startTime;

        if (durationInSeconds > minNoteDurationSeconds) {
          const startInBeats = (activeNote.startTime * tempo) / 60;
          const durationInBeats = (durationInSeconds * tempo) / 60;

          const lastNote = notes.length > 0 ? notes[notes.length - 1] : null;
          const timeSinceLastNoteEnd = lastNote
            ? startInBeats - (lastNote.start + lastNote.duration)
            : Infinity;

          // 检查此音符是否是前一个音符的延续
          if (
            lastNote &&
            lastNote.pitch === activeNote.pitch &&
            timeSinceLastNoteEnd >= 0 &&
            timeSinceLastNoteEnd < noteMergeThresholdBeats
          ) {
            // 是延续，则延长上一个音符
            lastNote.duration += durationInBeats + timeSinceLastNoteEnd;
          } else {
            // 否则，这是一个新的音符
            notes.push({
              index: noteIndex++,
              pitch: activeNote.pitch,
              pitchName: activeNote.pitchName,
              start: startInBeats,
              duration: durationInBeats,
            });
          }
        }
      }

      // 如果当前音高有效，则开启一个新的活动音符
      if (pitch && pitchName) {
        activeNote = {
          pitch,
          pitchName,
          startTime: currentTime,
        };
      } else {
        // 否则，重置活动音符
        activeNote = null;
      }
    }
  }

  return notes;
}

// 监听pitchEvents和tempo，任一变化时用当前tempo重新生成notes
watch(
  [() => pianoRollStore.pitchEvents, () => pianoRollStore.tempo],
  ([events, t]) => {
    if (events && events.length > 0) {
      const notes = convertPitchEventsToPianoRollNotes(events, t);
      pianoRollStore.setPianoRollNotes(notes);
    }
  },
  { immediate: true },
);

/**
 * 异步将乐谱文本转换为编曲工具的音符列表，并报告进度
 * @param scoreText 乐谱字符串
 * @param beatsPerBar 每小节拍数
 * @param onProgress 进度回调函数
 */
async function convertTextToNotesWithProgress(
  scoreText: string,
  beatsPerBar: number,
  onProgress?: (progress: number) => void,
): Promise<PianoRollNote[]> {
  return new Promise((resolve) => {
    // 预处理：移除和弦和装饰音标记
    const cleanedScoreText = scoreText.replace(/<[^>]*>|{[^}]*}/g, '');
    const measures = cleanedScoreText.replace(/\n/g, '|').split('|');
    const totalMeasures = measures.length;

    // 状态变量
    const notes: PianoRollNote[] = [];
    let currentBeat = 0;
    let noteIndex = 0;
    let lastNote: PianoRollNote | null = null;
    let measureIndex = 0;

    function processChunk() {
      const CHUNK_SIZE = 50; // 每帧处理50个小节
      const loopEnd = Math.min(measureIndex + CHUNK_SIZE, totalMeasures);

      for (; measureIndex < loopEnd; measureIndex++) {
        const measure = measures[measureIndex];
        if (!measure) continue;

        const noteStrings = measure.split(',').filter((n) => n.trim() !== '');
        for (const noteStr of noteStrings) {
          const trimmedNoteStr = noteStr.trim();
          if (trimmedNoteStr === '-') {
            // 这是延音线，增加前一个音符的持续时间
            if (lastNote) {
              lastNote.duration += 1;
            }
            currentBeat += 1;
            continue;
          }
          if (trimmedNoteStr === '0') {
            // 这是休止符，只增加时间
            currentBeat += 1;
            lastNote = null; // 休止符会断开延音
            continue;
          }

          // 解析音符
          const match = trimmedNoteStr.match(/(#?b?)([1-7])(\/(\d+))?([\^_]*)/);
          if (!match) continue;

          const [, accidental, noteValue, , durationNumStr, octaveMarks] = match;

          let upDownCount = 0;
          if (accidental === '#') upDownCount = 1;
          if (accidental === 'b') upDownCount = -1;

          const octaveCount =
            (octaveMarks?.match(/\^/g) || []).length - (octaveMarks?.match(/_/g) || []).length;

          let duration = 1; // 默认为四分音符
          if (durationNumStr) {
            duration = 4 / parseInt(durationNumStr, 10);
          }

          const noteName = SNTransition.General.simpleNoteToNoteName(
            noteValue,
            octaveCount,
            upDownCount,
          );
          if (noteName) {
            const pitch = SNTransition.General.noteNameToMidi(noteName);
            if (pitch !== null) {
              const newNote: PianoRollNote = {
                index: noteIndex++,
                pitch,
                pitchName: SNTransition.General.midiToNoteName(pitch) || '',
                start: currentBeat,
                duration: duration,
              };
              notes.push(newNote);
              lastNote = newNote;
            } else {
              lastNote = null; // 无效音高会断开延音
            }
          } else {
            lastNote = null; // 无效音名会断开延音
          }
          currentBeat += duration;
        }
      }

      onProgress?.((measureIndex / totalMeasures) * 100);

      if (measureIndex < totalMeasures) {
        requestAnimationFrame(processChunk);
      } else {
        resolve(notes);
      }
    }

    requestAnimationFrame(processChunk);
  });
}

/**
 * 加载音符数据并渲染到视图（直接操作 store）
 * @param notesToRender 要渲染的音符列表
 * @param beatsInfo 每小节的拍数
 */
function loadAndRenderNotes(notesToRender: PianoRollNote[], beatsInfo: number) {
  // 1. 计算并设置总小节数
  let maxBeat = 0;
  if (notesToRender.length > 0) {
    maxBeat = Math.max(...notesToRender.map((note) => note.start + note.duration));
  }
  const requiredBars = Math.ceil(maxBeat / beatsInfo);
  bars.value = Math.max(20, requiredBars + 4);

  // 2. 直接赋值到 store
  pianoRollStore.setPianoRollNotes(notesToRender);
  beatsPerBar.value = beatsInfo;
  tempo.value = parseInt(editorStore.formData.info.tempo || '120', 10);
}

onMounted(() => {
  // Case 1: 从乐谱编辑器带数据过来，需要异步转换
  if (
    mode.value === 'bar' &&
    pianoRollStore.scoreToConvert &&
    pianoRollStore.beatsPerBarToConvert
  ) {
    (async () => {
      isLoading.value = true;
      const notes = await convertTextToNotesWithProgress(
        pianoRollStore.scoreToConvert!,
        pianoRollStore.beatsPerBarToConvert!,
      );
      loadAndRenderNotes(notes, pianoRollStore.beatsPerBarToConvert!);
      isLoading.value = false;
      pianoRollStore.clearConversionData(); // 清理临时数据
    })();
  }
  // Case 2: 刷新页面或从其他页面返回，直接加载store中已有的数据
  else if (mode.value === 'bar') {
    const beatsInfo = parseInt(editorStore.formData.info.beat || '4', 10);
    loadAndRenderNotes(pianoRollStore.pianoRollNotes, beatsInfo);
  }
  // Case 3: MIDI 参考模式
  else if (mode.value === 'time') {
    const notes = pianoRollStore.referenceNotes;
    let maxBeat = 0;
    if (notes.length > 0) {
      maxBeat = Math.max(...notes.map((note) => note.start + note.duration));
    }
    // MIDI导入时，默认4/4拍
    const beatsPerBarValue = 4;
    const requiredBars = Math.ceil(maxBeat / beatsPerBarValue);
    bars.value = Math.max(20, requiredBars + 4);
  }
});

/**
 * 播放/停止，mp3模式下同步播放原始音频
 */
async function togglePlayback() {
  await Tone.start();
  if (isPlaying.value) {
    // 停止MIDI
    Tone.Transport.stop();
    Tone.Transport.cancel(0);
    isPlaying.value = false;
    Tone.Transport.position = 0;
    // 停止mp3原始音频
    if (audioSource.value) {
      audioSource.value.stop();
      audioSource.value.disconnect();
      audioSource.value = null;
    }
    if (audioContext.value) {
      audioContext.value.close();
      audioContext.value = null;
    }
    // 停止mp3文件播放
    if (mp3Audio) {
      mp3Audio.pause();
      mp3Audio.currentTime = 0;
      mp3Audio = null;
    }
  } else {
    // 只播放实际绘制的音符（直接用 store）
    const notes = [...pianoRollStore.pianoRollNotes].sort((a, b) => a.start - b.start);
    // mp3模式下，如果没有绘制音符，也要播放完整mp3
    if ((!notes || notes.length === 0) && isMp3Mode.value) {
      if (mp3File.value) {
        if (mp3Audio) {
          mp3Audio.pause();
          mp3Audio = null;
        }
        mp3Audio = new Audio(URL.createObjectURL(mp3File.value));
        mp3Audio.currentTime = pianoRollStore.mp3Offset || 0;
        mp3Audio.onended = () => {
          isPlaying.value = false;
          mp3Audio = null;
        };
        mp3Audio.play();
        isPlaying.value = true;
        return;
      } else if (audioBuffer.value) {
        // 降级方案：用AudioBufferSourceNode播放
        audioContext.value = new window.AudioContext();
        audioSource.value = audioContext.value.createBufferSource();
        audioSource.value.buffer = audioBuffer.value;
        audioSource.value.connect(audioContext.value.destination);
        audioSource.value.start(0);
        isPlaying.value = true;
        audioSource.value.onended = () => {
          isPlaying.value = false;
          if (audioSource.value) {
            audioSource.value.disconnect();
            audioSource.value = null;
          }
          if (audioContext.value) {
            audioContext.value.close();
            audioContext.value = null;
          }
        };
        return;
      }
    }
    // 有实际绘制音符时才播放MIDI音符
    if (!notes || notes.length === 0) return;

    // 确保乐器加载完成再继续
    await setInstrument('piano');
    Tone.Transport.bpm.value = tempo.value;

    notes.forEach((note) => {
      const pitchName = midiToNoteName(note.pitch);
      const secondsPerBeat = 60 / tempo.value;
      const startTimeInSeconds = note.start * secondsPerBeat;
      const durationInSeconds = note.duration * secondsPerBeat;
      if (pitchName) {
        Tone.Transport.scheduleOnce((time) => {
          playNote(pitchName, durationInSeconds, time);
        }, startTimeInSeconds);
      }
    });

    const lastNote = notes.sort((a, b) => a.start + a.duration - (b.start + b.duration)).pop();
    if (!lastNote) return;
    const endTimeInSeconds = (lastNote.start + lastNote.duration) * (60 / tempo.value);

    Tone.Transport.scheduleOnce((time) => {
      Tone.Draw.schedule(() => {
        isPlaying.value = false;
        Tone.Transport.stop();
        Tone.Transport.position = 0;
        // 停止mp3原始音频
        if (audioSource.value) {
          audioSource.value.stop();
          audioSource.value.disconnect();
          audioSource.value = null;
        }
        if (audioContext.value) {
          audioContext.value.close();
          audioContext.value = null;
        }
        if (mp3Audio) {
          mp3Audio.pause();
          mp3Audio = null;
        }
      }, time);
    }, endTimeInSeconds);

    // mp3模式下同步播放原始音频（如果有notes则同步播放）
    if (isMp3Mode.value) {
      if (mp3File.value) {
        if (mp3Audio) {
          mp3Audio.pause();
          mp3Audio = null;
        }
        mp3Audio = new Audio(URL.createObjectURL(mp3File.value));
        mp3Audio.currentTime = pianoRollStore.mp3Offset || 0;
        mp3Audio.onended = () => {
          isPlaying.value = false;
          Tone.Transport.stop();
          Tone.Transport.position = 0;
          mp3Audio = null;
        };
        mp3Audio.play();
      } else if (audioBuffer.value) {
        audioContext.value = new window.AudioContext();
        audioSource.value = audioContext.value.createBufferSource();
        audioSource.value.buffer = audioBuffer.value;
        audioSource.value.connect(audioContext.value.destination);
        audioSource.value.start(0);
        audioSource.value.onended = () => {
          isPlaying.value = false;
          Tone.Transport.stop();
          Tone.Transport.position = 0;
          if (audioSource.value) {
            audioSource.value.disconnect();
            audioSource.value = null;
          }
          if (audioContext.value) {
            audioContext.value.close();
            audioContext.value = null;
          }
        };
      }
    }

    Tone.Transport.start();
    isPlaying.value = true;
  }
}

// 快捷键和滚轮缩放逻辑
function handleKeydown(e: KeyboardEvent) {
  // 空格键播放/暂停
  if (e.code === 'Space') {
    e.preventDefault();
    togglePlayback();
  }
}

function handleWheel(e: WheelEvent) {
  // Ctrl+滚轮缩放选区
  if (e.ctrlKey) {
    e.preventDefault();
    // 以Minimap选区为中心缩放，比例10%
    const scaleStep = 0.1;
    let newWidth = pianoRollStore.minimapViewWidth;
    if (e.deltaY < 0) {
      // 向上滚动，缩小（选区变窄）
      newWidth = Math.max(minimapWidth.value * 0.1, newWidth * (1 - scaleStep));
    } else {
      // 向下滚动，放大（选区变宽）
      newWidth = Math.min(minimapWidth.value, newWidth * (1 + scaleStep));
    }
    // 保持选区中心不变
    const center = pianoRollStore.minimapViewLeft + pianoRollStore.minimapViewWidth / 2;
    let newLeft = center - newWidth / 2;
    // 边界处理
    newLeft = Math.max(0, Math.min(newLeft, minimapWidth.value - newWidth));
    pianoRollStore.setMinimapView(newLeft, newWidth);
  }
}
</script>
