import { defineStore } from 'pinia';

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
    pianoRollNotes: [] as PianoRollNote[],
    scoreToConvert: null as string | null,
    beatsPerBarToConvert: null as number | null,
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
    setIsEditingFromScoreEditor(isEditing: boolean) {
      this.isEditingFromScoreEditor = isEditing;
    },
  },
});
