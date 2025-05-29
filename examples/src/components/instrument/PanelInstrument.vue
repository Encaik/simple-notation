<template>
  <div
    v-if="isMIDIConnected"
    class="px-4 py-2 mx-auto mt-5 text-center text-white transition-colors duration-300 rounded-lg max-w-[1200px] bg-green-500"
  >
    MIDI 设备: 已连接
  </div>
  <PanelPiano v-if="currentInstrumentType === 'piano'" />
  <PanelGuitar v-if="currentInstrumentType === 'guitar-acoustic'" />
</template>

<script lang="ts" setup>
import { ref, watch, onUnmounted } from 'vue';
import { useTone } from '../../use/useTone';
import PanelPiano from './PanelPiano.vue';
import PanelGuitar from './PanelGuitar.vue';
import { usePianoStore } from '../../stores/piano';
import { useGuitarStore } from '../../stores/guitar';

const { currentInstrumentType, playNote, midiToNoteName } = useTone();
const pianoStore = usePianoStore();
const guitarStore = useGuitarStore();
const isMIDIConnected = ref(false);

// 存储当前按下的键 (MIDI 值)
const activeNotes = ref<Set<number>>(new Set());
// 存储当前正在播放的音符的 Tone.js Synth 实例
const activeSynths = ref<Map<number, any>>(new Map());

// 监听当前播放的音符并设置高亮
watch(
  () => currentInstrumentType.value,
  () => {
    // 切换乐器时清除所有高亮和停止所有音符
    pianoStore.clearMelodyHighlightMidis();
    pianoStore.clearChordHighlightMidis();
    guitarStore.clearMelodyHighlightMidis();
    guitarStore.clearChordHighlightMidis();
    activeNotes.value.clear();
    // 停止所有正在播放的音符
    activeSynths.value.forEach((synth) => {
      if (synth && typeof synth.stop === 'function') {
        synth.stop();
      }
    });
    activeSynths.value.clear();
  },
);

// 处理音符播放和高亮
async function handleNotePlay(noteName: string, midiNote: number) {
  try {
    // 如果音符已经在播放，先停止它
    if (activeSynths.value.has(midiNote)) {
      const oldSynth = activeSynths.value.get(midiNote);
      if (oldSynth && typeof oldSynth.stop === 'function') {
        oldSynth.stop();
      }
      activeSynths.value.delete(midiNote);
    }

    // 开始播放新音符
    await playNote(noteName, '1n'); // 使用一个较长的音符持续时间

    // 根据当前乐器类型设置高亮
    if (currentInstrumentType.value === 'piano') {
      // 对于钢琴，MIDI输入直接对应键高亮
      const currentHighlights = new Set(pianoStore.melodyHighlightMidis); // Use melody highlights for MIDI input
      currentHighlights.add(midiNote);
      pianoStore.setHighlightMidis(Array.from(currentHighlights), 'melody');
    } else if (currentInstrumentType.value === 'guitar-acoustic') {
      // 对于吉他，MIDI输入需要转换为品位位置来高亮
      const currentHighlights = new Set(activeNotes.value); // activeNotes stores MIDI values
      currentHighlights.add(midiNote);
      guitarStore.setHighlightMidis(Array.from(currentHighlights)); // guitarStore.setHighlightMidis handles MIDI to position mapping for melody
    }
  } catch (error) {
    console.error('Error playing note:', error);
  }
}

// 处理音符释放
function handleNoteRelease(midiNote: number) {
  // 停止音符播放
  if (activeSynths.value.has(midiNote)) {
    const synth = activeSynths.value.get(midiNote);
    if (synth && typeof synth.stop === 'function') {
      synth.stop();
    }
    activeSynths.value.delete(midiNote);
  }

  if (currentInstrumentType.value === 'piano') {
    // 移除钢琴键高亮
    const currentHighlights = new Set(pianoStore.melodyHighlightMidis); // Use melody highlights for MIDI input
    currentHighlights.delete(midiNote);
    pianoStore.setHighlightMidis(Array.from(currentHighlights), 'melody');
  } else if (currentInstrumentType.value === 'guitar-acoustic') {
    // 获取当前所有高亮的MIDI音符
    const currentHighlights = new Set(activeNotes.value);
    // 移除释放的音符
    currentHighlights.delete(midiNote);
    // 更新高亮
    guitarStore.setHighlightMidis(Array.from(currentHighlights)); // guitarStore.setHighlightMidis handles MIDI to position mapping for melody
  }
}

let midi: MIDIAccess | null = null;

// 检查 MIDI 设备连接状态
function checkMIDIConnection() {
  if (!midi) {
    isMIDIConnected.value = false;
    return;
  }

  // 检查是否有活动的输入设备
  const hasActiveInputs = Array.from(midi.inputs.values()).some(
    (input) => input.state === 'connected',
  );
  isMIDIConnected.value = hasActiveInputs;
}

function onMIDISuccess(midiAccess: MIDIAccess) {
  console.log('MIDI ready!');
  midi = midiAccess;

  // 监听 MIDI 设备连接状态变化
  midiAccess.addEventListener('statechange', () => {
    checkMIDIConnection();
  });

  // 初始检查连接状态
  checkMIDIConnection();

  if (isMIDIConnected.value) {
    startLoggingMIDIInput(midi);
  }
}

function onMIDIFailure(msg: string) {
  console.error(`Failed to get MIDI access - ${msg}`);
  isMIDIConnected.value = false;
}

function onMIDIMessage(event: MIDIMessageEvent) {
  // 处理 MIDI 消息
  const data = event.data;
  if (data && data.length >= 3) {
    const status = data[0];
    const note = data[1];
    const velocity = data[2];

    if (status === 144) {
      // Note On
      if (velocity > 0) {
        const noteName = midiToNoteName(note);
        if (noteName) {
          activeNotes.value.add(note);
          handleNotePlay(noteName, note);
        }
      } else {
        // Note Off (velocity = 0)
        activeNotes.value.delete(note);
        handleNoteRelease(note);
      }
    } else if (status === 128) {
      // Note Off
      activeNotes.value.delete(note);
      handleNoteRelease(note);
    }
  }
}

function startLoggingMIDIInput(midiAccess: MIDIAccess) {
  midiAccess.inputs.forEach((entry) => {
    entry.onmidimessage = onMIDIMessage;
  });
}

// 组件卸载时清理
onUnmounted(() => {
  if (midi) {
    midi.removeEventListener('statechange', checkMIDIConnection);
  }
  // 停止所有正在播放的音符
  activeSynths.value.forEach((synth) => {
    if (synth && typeof synth.stop === 'function') {
      synth.stop();
    }
  });
  activeSynths.value.clear();
  // 清除所有高亮
  pianoStore.clearMelodyHighlightMidis();
  pianoStore.clearChordHighlightMidis();
  guitarStore.clearMelodyHighlightMidis();
  guitarStore.clearChordHighlightMidis();
});

navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
</script>
