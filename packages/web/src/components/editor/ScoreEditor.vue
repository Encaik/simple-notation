<template>
  <div
    class="border border-[#ddd] rounded-md flex flex-col min-h-0"
    :class="{
      'flex-grow': activePanel === 'score',
      'flex-shrink-0': activePanel !== 'score',
      'h-auto': activePanel !== 'score',
    }"
  >
    <button
      class="w-full text-left py-3 px-4 rounded-md bg-[#f7f7f7] text-[#333] font-medium flex justify-between items-center transition duration-300 hover:bg-[#eee] focus:outline-none flex-shrink-0"
      @click="toggleAccordion"
    >
      <div class="flex items-center gap-4">
        <span>简谱</span>
        <Button size="small" @click.stop="editInPianoRoll">在编曲工具中编辑</Button>
      </div>
      <span>{{ activePanel === 'score' ? '▲' : '▼' }}</span>
    </button>
    <div v-show="activePanel === 'score'" class="flex flex-col flex-grow min-h-0 overflow-auto">
      <div
        ref="scoreEditorRef"
        class="flex text-sm leading-normal resize-none flex-grow min-h-0 bg-white bg-opacity-80"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, ViewUpdate, lineNumbers } from '@codemirror/view';
import { history, defaultKeymap, indentWithTab } from '@codemirror/commands';
import { useEditorStore, type PianoRollNote } from '../../stores';
import { HighlightStyle, syntaxHighlighting, StreamLanguage } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { SNPointerLayer, SNTransition } from 'simple-notation';
import { useRouter } from 'vue-router';
import Button from '../../widgets/Button.vue';

defineProps<{
  activePanel: string;
}>();

const emits = defineEmits(['toggle-accordion']);

const scoreEditorRef = ref<HTMLDivElement | null>(null);
const editorStore = useEditorStore();
const router = useRouter();

/**
 * 将乐谱文本转换为编曲工具的音符列表
 * @param scoreText 乐谱字符串
 * @param beatsPerBar 每小节拍数
 */
function convertTextToNotes(scoreText: string, beatsPerBar: number): PianoRollNote[] {
  const notes: PianoRollNote[] = [];
  let currentBeat = 0;
  let noteIndex = 0;
  let lastNote: PianoRollNote | null = null;

  const measures = scoreText.replace(/\n/g, '|').split('|');

  for (const measure of measures) {
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
      const match = trimmedNoteStr.match(/(#?b?)([1-7])([\^_]*)(\/(\d+))?/);
      if (!match) continue;

      const [, accidental, noteValue, octaveMarks, , durationValue] = match;

      let upDownCount = 0;
      if (accidental === '#') upDownCount = 1;
      if (accidental === 'b') upDownCount = -1;

      const octaveCount =
        (octaveMarks.match(/\^/g) || []).length - (octaveMarks.match(/_/g) || []).length;

      let duration = 1; // 默认为四分音符
      if (durationValue) {
        duration = 4 / parseInt(durationValue, 10);
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

  return notes;
}

/**
 * 点击"在编曲工具中编辑"
 */
function editInPianoRoll() {
  const { score, info } = editorStore.formData;
  const beatsPerBar = parseInt(info.beat || '4', 10);
  const notes = convertTextToNotes(score, beatsPerBar);

  editorStore.pianoRollNotes = notes;
  editorStore.isEditingFromScoreEditor = true;
  router.push('/piano-roll');
}

// 定义简谱语法高亮样式
const scoreHighlightStyle = HighlightStyle.define([
  { tag: tags.bracket, color: '#7b5aff' }, // 括号类符号
  { tag: tags.punctuation, color: '#ff6b3d' }, // 标点符号
]);

// 定义简谱语法高亮规则
const scoreLanguage = StreamLanguage.define({
  token(stream) {
    if (stream.match(/<[^}]*>/)) return 'bracket';
    if (stream.match(/{[^}]*}/)) return 'bracket';
    if (stream.match(/[()[\]()]/)) return 'bracket';
    if (stream.match(/[,|]/)) return 'punctuation';
    stream.next();
    return null;
  },
});

// 创建语法高亮扩展
const scoreHighlight = syntaxHighlighting(scoreHighlightStyle);

onMounted(() => {
  if (scoreEditorRef.value && editorStore.formData) {
    editorStore.setScoreEditorView(
      new EditorView({
        state: EditorState.create({
          doc: editorStore.formData.score,
          extensions: [
            lineNumbers(), // 添加行号
            history(), // 添加历史记录
            keymap.of(defaultKeymap), // 添加默认按键映射
            keymap.of([indentWithTab]),
            scoreLanguage, // 添加语言支持
            scoreHighlight, // 添加语法高亮
            EditorView.updateListener.of((update: ViewUpdate) => {
              if (update.docChanged) {
                const newScore = update.state.doc.toString();
                if (editorStore.formData && editorStore.formData.score !== newScore) {
                  editorStore.updateScore(newScore);
                }
              }
              if (update.selectionSet) {
                const { from, to } = update.state.selection.main;
                editorStore.setSelectionRange(from, to);
              }
            }),
          ],
        }),
        parent: scoreEditorRef.value,
      }),
    );
  }
});

watch(
  () => editorStore.formData?.score,
  (newScore) => {
    const view = editorStore.scoreEditorView;
    if (view && newScore !== undefined && newScore !== view.state.doc.toString()) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: newScore,
        },
      });
    }
  },
);

// Watch for selection range changes and update the pointer layer
watch(
  () => editorStore.selectionRange,
  (newRange) => {
    const indicesToHighlight = SNPointerLayer.getNoteIndicesInTextRange(
      newRange.start !== null ? newRange.start : -1,
      newRange.end !== null ? newRange.end : -1,
    );
    SNPointerLayer.updateSelectionHighlight(indicesToHighlight);
  },
  { deep: true },
);

onBeforeUnmount(() => {
  editorStore.scoreEditorView?.destroy();
});

const toggleAccordion = () => {
  emits('toggle-accordion', 'score');
};
</script>

<style>
.cm-editor {
  flex: 1;
  font-size: 16px;
  line-height: 1.6;
}

.cm-content {
  font-size: 16px;
  line-height: 1.6;
}

.cm-cursor {
  height: 1.6em;
}

.cm-selectionBackground {
  height: 1.6em;
}
</style>
