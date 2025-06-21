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
    clearAll() {
      this.isEditingFromScoreEditor = false;
      this.isEditingWithMidiReference = false;
      this.pianoRollNotes = [];
      this.referenceNotes = [];
      this.scoreToConvert = null;
      this.beatsPerBarToConvert = null;
      this.audioBufferForSpectrogram = null;
    },
  },
});
