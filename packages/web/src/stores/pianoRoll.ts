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
    pianoRollNotes: [] as PianoRollNote[],
    referenceNotes: [] as PianoRollNote[],
    scoreToConvert: null as string | null,
    beatsPerBarToConvert: null as number | null,
    audioBufferForSpectrogram: shallowRef<AudioBuffer | null>(null),
    // Minimap选区状态
    minimapViewLeft: 0,
    minimapViewWidth: 0,
    isMinimapDragging: false,
    // MP3导入后的原始音高事件
    pitchEvents: [] as { note: string; time: number }[],
    // MP3原始文件对象
    mp3File: null as File | null,
    // MP3起始偏移（秒）
    mp3Offset: 0,
    // ===== 全局参数 =====
    tempo: 120, // 当前速度
    beatsPerBar: 4, // 每小节拍数
    quantization: 1, // 量化单位（每格代表的拍数）
    // ===== 全局UI参数 =====
    barWidth: 160, // 每小节宽度
    viewWidth: 960, // 主编辑区可视宽度
    scrollLeft: 0, // 主编辑区横向滚动
    scrollTop: 0, // 主编辑区纵向滚动
    bars: 20, // 总小节数
    rowHeight: 24, // 行高
    minimapWidth: 960, // minimap宽度
    mode: 'bar' as 'bar' | 'time', // 页面模式
    type: 'new' as 'new' | 'edit' | 'midi' | 'mp3', // 页面类型
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
    // 设置Minimap选区
    setMinimapView(left: number, width: number) {
      this.minimapViewLeft = left;
      this.minimapViewWidth = width;
    },
    // 设置Minimap拖动状态
    setIsMinimapDragging(isDragging: boolean) {
      this.isMinimapDragging = isDragging;
    },
    // 设置MP3音高事件
    setPitchEvents(events: { note: string; time: number }[]) {
      this.pitchEvents = events;
    },
    // 设置MP3文件对象
    setMp3File(file: File | null) {
      this.mp3File = file;
    },
    // 设置MP3起始偏移
    setMp3Offset(offset: number) {
      this.mp3Offset = offset;
    },
    // ===== 全局参数的set方法 =====
    setTempo(tempo: number) {
      this.tempo = tempo;
    },
    setBeatsPerBar(beats: number) {
      this.beatsPerBar = beats;
    },
    setQuantization(q: number) {
      this.quantization = q;
    },
    clearAll() {
      // 只重置真正需要初始化的全局UI参数、临时变量、音符数据等
      this.pianoRollNotes = [];
      if (this.mode !== 'time') {
        this.referenceNotes = [];
      }
      if (this.type !== 'edit') {
        this.scoreToConvert = null;
        this.beatsPerBarToConvert = null;
      }
      if (this.type !== 'mp3') {
        this.audioBufferForSpectrogram = null;
        this.pitchEvents = [];
        this.mp3File = null;
      }
      this.minimapViewLeft = 0;
      this.minimapViewWidth = 0;
      this.isMinimapDragging = false;
      this.mp3Offset = 0;
      this.tempo = 120;
      this.beatsPerBar = 4;
      this.quantization = 1;
      this.barWidth = 160;
      this.viewWidth = 960;
      this.scrollLeft = 0;
      this.scrollTop = 0;
    },
    // ===== 全局UI参数set方法 =====
    setBarWidth(v: number) {
      this.barWidth = v;
    },
    setViewWidth(v: number) {
      this.viewWidth = v;
    },
    setScrollLeft(v: number) {
      this.scrollLeft = v;
    },
    setScrollTop(v: number) {
      this.scrollTop = v;
    },
    setBars(v: number) {
      this.bars = v;
    },
    setRowHeight(v: number) {
      this.rowHeight = v;
    },
    setMinimapWidth(v: number) {
      this.minimapWidth = v;
    },
    setMode(mode: 'bar' | 'time') {
      this.mode = mode;
    },
    setType(type: 'new' | 'edit' | 'midi' | 'mp3') {
      this.type = type;
    },
  },
});
