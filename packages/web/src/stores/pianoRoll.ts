import { defineStore } from 'pinia';
import { shallowRef } from 'vue';

// 编曲工具音符数据接口
export interface PianoRollNote {
  index: number;
  pitch: number;
  pitchName: string;
  start: number;
  duration: number;
}

export const usePianoRollStore = defineStore('pianoRoll', {
  state: () => ({
    isEditingFromScoreEditor: false,
    isEditingWithMidiReference: false,
    pianoRollNotes: [] as PianoRollNote[],
    referenceNotes: [] as PianoRollNote[],
    scoreToConvert: null as string | null,
    beatsPerBarToConvert: null as number | null,
    audioBufferForSpectrogram: shallowRef<AudioBuffer | null>(null),
    // Minimap选区状态
    minimapViewLeft: 0,
    minimapViewWidth: 0,
    isMinimapDragging: false,
  }),
  actions: {
    setConversionData(score: string, beatsPerBar: number) {
      this.scoreToConvert = score;
      this.beatsPerBarToConvert = beatsPerBar;
    },
    clearConversionData() {
      this.scoreToConvert = null;
      this.beatsPerBarToConvert = null;
    },
    setPianoRollNotes(notes: PianoRollNote[]) {
      this.pianoRollNotes = notes;
    },
    setReferenceNotes(notes: PianoRollNote[]) {
      this.referenceNotes = notes;
    },
    setAudioBufferForSpectrogram(buffer: AudioBuffer | null) {
      this.audioBufferForSpectrogram = buffer;
    },
    setIsEditingFromScoreEditor(isEditing: boolean) {
      this.isEditingFromScoreEditor = isEditing;
    },
    setIsEditingWithMidiReference(isEditing: boolean) {
      this.isEditingWithMidiReference = isEditing;
    },
    // 设置Minimap选区
    setMinimapView(left: number, width: number) {
      this.minimapViewLeft = left;
      this.minimapViewWidth = width;
    },
    // 设置Minimap拖动状态
    setIsMinimapDragging(isDragging: boolean) {
      this.isMinimapDragging = isDragging;
    },
    clearAll() {
      this.isEditingFromScoreEditor = false;
      this.isEditingWithMidiReference = false;
      this.pianoRollNotes = [];
      this.referenceNotes = [];
      this.scoreToConvert = null;
      this.beatsPerBarToConvert = null;
      this.audioBufferForSpectrogram = null;
      this.minimapViewLeft = 0;
      this.minimapViewWidth = 0;
      this.isMinimapDragging = false;
    },
  },
});
