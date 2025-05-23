import { SNRuntime } from '../config/runtime';
import { SNStaveOptions, SNNoteOptions } from '@types';

/**
 * 简谱播放器，实例成员方式，自动从 SNRuntime 获取数据
 * 支持播放、暂停、继续、停止等控制，回调获取当前播放音符
 * 延音线（'-'）合并播放：前一个音符播放时长累加，onPointerMove每个音符都回调
 * onNotePlay 只在非'-'音符时回调，参数为note和合并延音后的总时长（ms）
 */
export class SNPlayer {
  private notes: (SNNoteOptions & {
    measureIndex: number;
    repeatStart?: boolean;
    repeatEnd?: boolean;
  })[] = [];
  private tempo: number;
  private timer: number | null = null;
  private isPlaying = false;
  private isPaused = false;
  private currentIndex = 0;
  private onPointerMoveCallback?: (note: SNNoteOptions) => void;
  private onEndCallback?: () => void;
  private onNotePlayCallback?: (note: SNNoteOptions, duration: number) => void;
  private onChordPlayCallback?: (note: SNNoteOptions, duration: number) => void;
  /**
   * 是否已循环过一次
   */
  private hasRepeated = false;
  /**
   * repeat区间的起止音符索引
   */
  private repeatStartNoteIndex: number | null = null;
  private repeatEndNoteIndex: number | null = null;

  /**
   * 构造函数，自动从 SNRuntime 获取乐谱和速度
   */
  constructor() {
    const parsedScore = SNRuntime.parsedScore || [];
    this.notes = this.flattenNotes(parsedScore);
    const info = SNRuntime.info || {};
    this.tempo = info.tempo ? parseInt(info.tempo) : 60;
    this.initRepeatRange(parsedScore);
  }

  /**
   * 初始化repeat区间的音符索引
   * @param parsedScore 乐谱结构
   */
  private initRepeatRange(parsedScore: SNStaveOptions[]) {
    let startFound = false;
    let noteIndex = 0;
    for (const stave of parsedScore) {
      for (const measure of stave.measureOptions) {
        if (measure.repeatStart && !startFound) {
          this.repeatStartNoteIndex = noteIndex;
          startFound = true;
        }
        noteIndex += measure.noteOptions.length;
        if (measure.repeatEnd && startFound) {
          this.repeatEndNoteIndex = noteIndex - 1;
          return;
        }
      }
    }
  }

  /**
   * 拍平成音符队列，保留原顺序，并为每个音符附加其所属小节的repeat信息
   */
  private flattenNotes(parsedScore: SNStaveOptions[]): (SNNoteOptions & {
    measureIndex: number;
    repeatStart?: boolean;
    repeatEnd?: boolean;
  })[] {
    const notes: (SNNoteOptions & {
      measureIndex: number;
      repeatStart?: boolean;
      repeatEnd?: boolean;
    })[] = [];
    parsedScore.forEach((stave) =>
      stave.measureOptions.forEach((measure) =>
        measure.noteOptions.forEach((note) =>
          notes.push({
            ...note,
            measureIndex: measure.index,
            repeatStart: measure.repeatStart,
            repeatEnd: measure.repeatEnd,
          }),
        ),
      ),
    );
    return notes;
  }

  /**
   * 注册光标移动回调（每个音符都回调，包括'-'）
   * @param cb 回调函数，参数为当前播放的音符数据
   */
  public onPointerMove(cb: (note: SNNoteOptions) => void) {
    this.onPointerMoveCallback = cb;
  }

  /**
   * 注册播放结束回调
   * @param cb 回调函数
   */
  public onEnd(cb: () => void) {
    this.onEndCallback = cb;
  }

  /**
   * 注册实际发声回调（仅非'-'音符，参数为note和合并延音后的总时长ms）
   * @param cb 回调函数 (note, durationMs)
   */
  public onNotePlay(cb: (note: SNNoteOptions, duration: number) => void) {
    this.onNotePlayCallback = cb;
  }

  /**
   * 注册和弦播放回调（每个音符都回调，参数为note和合并延音后的总时长ms）
   * @param cb 回调函数 (note, durationMs)
   */
  public onChordPlay(cb: (note: SNNoteOptions, duration: number) => void) {
    this.onChordPlayCallback = cb;
  }

  /**
   * 开始播放，从头或当前进度播放
   */
  public play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.isPaused = false;
    this.scheduleNext();
  }

  /**
   * 暂停播放，保留当前进度
   */
  public pause() {
    if (!this.isPlaying || this.isPaused) return;
    this.isPaused = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * 继续播放，从暂停处继续
   */
  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.isPlaying = true;
    this.scheduleNext();
  }

  /**
   * 停止播放，重置进度和循环状态
   */
  public stop() {
    this.isPlaying = false;
    this.isPaused = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.currentIndex = 0;
    this.hasRepeated = false;
  }

  /**
   * 计算当前音符的时值（ms），直接使用parser解析得到的nodeTime（已包含附点和各种时值）
   * @param note 当前音符
   * @returns 时值（毫秒）
   */
  private getNoteDuration(note: SNNoteOptions): number {
    const beatDuration = 60000 / this.tempo; // 一拍多少ms
    // nodeTime为该音符占多少拍（如1=四分音符，0.5=八分音符，1.5=附点四分音符等）
    // parser已保证nodeTime正确
    return (note.nodeTime || 1) * beatDuration;
  }

  /**
   * 计算连音线合并后的总时值（ms），从当前音符开始，向后累加所有连音线音符的时值
   * @param startIdx 当前音符索引
   * @returns 合并后的总时值（ms）
   */
  private getTieDuration(startIdx: number): number {
    let duration = this.getNoteDuration(this.notes[startIdx]);
    let idx = startIdx + 1;
    // 连音线：后续音符isTieEnd为true且音高完全一致才合并
    while (
      idx < this.notes.length &&
      this.notes[idx].isTieEnd &&
      this.isNotePitchEqual(this.notes[startIdx], this.notes[idx])
    ) {
      duration += this.getNoteDuration(this.notes[idx]);
      idx++;
    }
    return duration;
  }

  /**
   * 判断两个音高是否完全一致（note、upDownCount、octaveCount）
   */
  private isNotePitchEqual(a: SNNoteOptions, b: SNNoteOptions): boolean {
    return (
      a.note === b.note &&
      a.upDownCount === b.upDownCount &&
      a.octaveCount === b.octaveCount
    );
  }

  /**
   * 调度下一个音符的播放，支持延音线、连音线合并播放和小节循环（repeatStart/repeatEnd）
   * onPointerMove每个音符都回调，onNotePlay只在非'-'且非连音线中间音符时回调
   */
  private scheduleNext(): void {
    if (!this.isPlaying || this.isPaused) return;
    if (this.currentIndex >= this.notes.length) return this.finish();

    const note = this.notes[this.currentIndex];
    // 1. 回调onPointerMove（无论是否延音线/连音线）
    if (this.onPointerMoveCallback) {
      this.onPointerMoveCallback(note);
    }

    let duration = this.getNoteDuration(note);
    const shouldPlay = note.note !== '-';

    // 连音线合并：只在第一个音符（isTieStart为true或无tie）时发声，duration为合并后的总时值
    const isTieHead = note.isTieStart || (!note.isTieStart && !note.isTieEnd);
    if (shouldPlay && isTieHead) {
      duration = this.getTieDuration(this.currentIndex);
      if (this.onNotePlayCallback) {
        this.onNotePlayCallback(note, duration);
      }
    }
    // 新增：每个有chord的音符才回调onChordPlayCallback（用于和弦播放）
    if (note.chord && this.onChordPlayCallback) {
      this.onChordPlayCallback(note, duration);
    }

    // 2. 定时推进到下一个音符（每个音符都单独定时，光标严格依次移动）
    this.timer = window.setTimeout(() => {
      // 只在repeatEnd区间的最后一个音符且未循环时跳回repeatStart
      if (
        this.repeatStartNoteIndex !== null &&
        this.repeatEndNoteIndex !== null &&
        this.currentIndex === this.repeatEndNoteIndex &&
        !this.hasRepeated
      ) {
        this.hasRepeated = true;
        this.currentIndex = this.repeatStartNoteIndex;
        this.scheduleNext();
        return;
      }
      this.currentIndex++;
      this.scheduleNext();
    }, this.getNoteDuration(note));
  }

  /**
   * 播放结束，重置状态并触发回调
   */
  private finish() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentIndex = 0;
    this.hasRepeated = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.onEndCallback) {
      this.onEndCallback();
    }
  }
}
