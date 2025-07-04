import { SNRuntime } from '../config/runtime';
import { SNStaveOptions, SNNoteOptions, SNFlattenNoteOptions } from '@types';
import Logger from '../utils/logger';

/**
 * 简谱播放器，实例成员方式，自动从 SNRuntime 获取数据
 * 支持播放、暂停、继续、停止等控制，回调获取当前播放音符
 * 延音线（'-'）合并播放：前一个音符播放时长累加，onPointerMove每个音符都回调
 * onNotePlay 只在非'-'音符时回调，参数为note和合并延音后的总时长（ms）
 */
export class SNPlayer {
  private notes: SNFlattenNoteOptions[] = [];
  private tempo: number;
  private timer: number | null = null;
  private isPlaying = false;
  private isPaused = false;
  private currentIndex = 0;
  private onPointerMoveCallbacks: ((
    note: SNNoteOptions,
    currentTime: number,
  ) => void)[] = [];
  private onEndCallbacks: (() => void)[] = [];
  private onNotePlayCallbacks: ((
    note: SNNoteOptions,
    duration: number,
  ) => void)[] = [];
  private onChordPlayCallbacks: ((
    note: SNNoteOptions,
    duration: number,
  ) => void)[] = [];
  /**
   * 当前循环播放的次数 (从1开始)
   */
  private currentRepeatPass = 1;
  /**
   * 遇到后反复记号，记录当前音符index+1，用于遇到分段直接跳到该index
   */
  private repeatNextIndex = 0;
  private currentTime = 0;

  /**
   * 构造函数，自动从 SNRuntime 获取乐谱和速度
   */
  constructor() {
    const parsedScore = SNRuntime.parsedScore || [];
    this.notes = this.flattenNotes(parsedScore);
    const info = SNRuntime.info || {};
    this.tempo = info.tempo ? parseInt(info.tempo) : 60;
  }

  /**
   * 拍平成音符队列，保留原顺序，并为每个音符附加其所属小节的repeat信息
   */
  private flattenNotes(parsedScore: SNStaveOptions[]): SNFlattenNoteOptions[] {
    return parsedScore.flatMap((stave) =>
      stave.measureOptions.flatMap((measure) =>
        measure.noteOptions.map((note) => ({
          ...note,
          measureIndex: measure.index,
          repeatStart: measure.repeatStart,
          repeatEnd: measure.repeatEnd,
        })),
      ),
    );
  }

  /**
   * 获取当前音符列表
   * @returns 当前音符列表
   */
  public getNotes(): SNFlattenNoteOptions[] {
    return this.notes;
  }

  /**
   * 注册光标移动回调（每个音符都回调，包括'-'）
   * @param cb 回调函数，参数为当前播放的音符数据
   */
  public onPointerMove(
    cb: (note: SNNoteOptions, currentTime: number) => void,
  ): () => void {
    this.onPointerMoveCallbacks.push(cb);
    return () => {
      this.onPointerMoveCallbacks = this.onPointerMoveCallbacks.filter(
        (fn) => fn !== cb,
      );
    };
  }

  /**
   * 注册播放结束回调
   * @param cb 回调函数
   */
  public onEnd(cb: () => void): () => void {
    this.onEndCallbacks.push(cb);
    return () => {
      this.onEndCallbacks = this.onEndCallbacks.filter((fn) => fn !== cb);
    };
  }

  /**
   * 注册实际发声回调（仅非'-'音符，参数为note和合并延音后的总时长ms）
   * @param cb 回调函数 (note, durationMs)
   */
  public onNotePlay(
    cb: (note: SNNoteOptions, duration: number) => void,
  ): () => void {
    this.onNotePlayCallbacks.push(cb);
    return () => {
      this.onNotePlayCallbacks = this.onNotePlayCallbacks.filter(
        (fn) => fn !== cb,
      );
    };
  }

  /**
   * 注册和弦播放回调（每个音符都回调，参数为note和合并延音后的总时长ms）
   * @param cb 回调函数 (note, durationMs)
   */
  public onChordPlay(
    cb: (note: SNNoteOptions, duration: number) => void,
  ): () => void {
    this.onChordPlayCallbacks.push(cb);
    return () => {
      this.onChordPlayCallbacks = this.onChordPlayCallbacks.filter(
        (fn) => fn !== cb,
      );
    };
  }

  /**
   * 跳转到指定音符
   * @param index 设置当前播放index
   */
  public setCurrentIndex(index: number) {
    this.currentIndex = index;
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
    this.currentTime = 0;
  }

  /**
   * 计算当前音符的时值（ms），直接使用parser解析得到的nodeTime（已包含附点和各种时值）
   * @param note 当前音符
   * @returns 时值（毫秒）
   */
  private getNoteDuration(note: SNNoteOptions): number {
    const beatDuration = 60000 / this.tempo; // 一拍多少ms
    return (note.nodeTime || 1) * beatDuration;
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
    if (this.currentIndex >= this.notes.length) {
      return this.finish();
    }
    const note = this.notes[this.currentIndex];

    // 1. 处理分段符逻辑
    const sectionRepeatSymbol = note.chord?.find((symbol) =>
      symbol.match(/^\d+\.$/),
    );

    if (sectionRepeatSymbol) {
      const repeatNumber = parseInt(sectionRepeatSymbol, 10);

      // 如果当前循环遍数不等于分段符指定的数字，则跳过从当前音符到下一个分段符之间的所有音符
      if (this.currentRepeatPass !== repeatNumber) {
        Logger.debug(
          `在第 ${this.currentRepeatPass} 遍循环中遇到分段符"${repeatNumber}."，当前遍数不匹配，开始寻找下一个分段符（如"${repeatNumber + 1}."）`,
          'SNPlayer',
        );
        // 将当前索引直接跳到下一个分段符的位置
        this.currentIndex = this.repeatNextIndex;
        Logger.debug(
          `跳过到索引 ${this.currentIndex} (${this.notes[this.currentIndex].note}) 处继续播放`,
          'SNPlayer',
        );
        this.scheduleNext(); // 立即调度从新的 currentIndex 开始播放
        return;
      }
      // 如果当前循环遍数匹配分段符数字，则不跳过，继续执行后续播放逻辑
    }

    // 每个音符都推进光标，同时传递累计时间
    this.onPointerMoveCallbacks.forEach((cb) => {
      cb(note, this.currentTime);
    });

    const duration = this.getNoteDuration(note);
    this.currentTime += duration;

    // 判断是否需要发声（非"-"，且不是tie的中间/结尾音符）
    if (note.note !== '-') {
      let totalDuration = duration;

      if (!note.isTieEnd) {
        let idx = this.currentIndex + 1;
        while (
          idx < this.notes.length &&
          (this.notes[idx].note === '-' ||
            (this.notes[idx].isTieEnd &&
              this.isNotePitchEqual(note, this.notes[idx])))
        ) {
          totalDuration += this.getNoteDuration(this.notes[idx]);
          idx++;
        }
        // 发声
        this.onNotePlayCallbacks.forEach((cb) => cb(note, totalDuration));
      }
    }

    if (note.chord) {
      this.onChordPlayCallbacks.forEach((cb) => cb(note, duration));
    }

    // 推进到下一个音符
    this.timer = window.setTimeout(() => {
      // 检查当前音符是否是其小节的最后一个音符
      const isLastNoteInMeasure =
        this.currentIndex === this.notes.length - 1 || // 如果是整个乐谱的最后一个音符
        (this.currentIndex + 1 < this.notes.length &&
          this.notes[this.currentIndex + 1].measureIndex !== note.measureIndex); // 或者下一个音符属于不同小节

      Logger.debug(
        `处理索引 ${this.currentIndex}, 音符: ${note.note}, repeatEnd: ${note.repeatEnd}, isLastNoteInMeasure: ${isLastNoteInMeasure}`,
        'SNPlayer',
      );

      // 处理 repeat end 符号 (:|) 逻辑 (决定是否跳回 repeat start)
      // 在播放完带有 repeatEnd 的小节的最后一个音符后触发
      if (note.repeatEnd && isLastNoteInMeasure) {
        this.currentRepeatPass++;

        if (this.repeatNextIndex == this.currentIndex + 1) {
          this.currentIndex++;
          this.scheduleNext();
          return;
        } else {
          this.repeatNextIndex = this.currentIndex + 1;
        }

        // 查找最近的 repeat start 标记所在的音符索引（向前查找）
        let targetIndex = 0; // 默认跳回乐谱开头
        for (let i = this.currentIndex; i >= 0; i--) {
          // 注意：repeatStart 标记是在小节层面的，我们需要找到该小节的第一个音符索引
          const measureIndexOfNote = this.notes[i].measureIndex;
          const measureOptions = SNRuntime.parsedScore
            ?.find((stave) =>
              stave.measureOptions.some((m) => m.index === measureIndexOfNote),
            )
            ?.measureOptions.find((m) => m.index === measureIndexOfNote);

          if (measureOptions?.repeatStart) {
            // 找到该小节的第一个音符索引作为跳回目标
            const firstNoteInRepeatStartMeasure = this.notes.find(
              (n) => n.measureIndex === measureIndexOfNote,
            );
            if (firstNoteInRepeatStartMeasure) {
              targetIndex = this.notes.indexOf(firstNoteInRepeatStartMeasure);
              Logger.debug(
                `在索引 ${this.currentIndex} 处遇到 repeat end，向前找到最近的 repeat start 在小节 ${measureIndexOfNote}，跳回索引 ${targetIndex}`,
                'SNPlayer',
              );
              break; // 找到了，停止查找
            }
          }
          if (i === 0 && targetIndex === 0) {
            Logger.debug(
              `在索引 ${this.currentIndex} 处遇到 repeat end，未找到 repeat start，跳回乐谱开头 (索引 0)`,
              'SNPlayer',
            );
          }
        }

        this.currentIndex = targetIndex;
        Logger.debug(
          `开始第 ${this.currentRepeatPass} 遍循环，从索引 ${this.currentIndex} 处继续`,
          'SNPlayer',
        );
      } else {
        // 如果不是 repeat end 小节的最后一个音符，或者不是 repeat end 小节，正常前进
        this.currentIndex++;
      }

      this.scheduleNext(); // 调度下一个音符 (无论是跳回还是前进)
    }, duration);
  }

  /**
   * 播放结束，重置状态并触发回调
   */
  private finish() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentIndex = 0;
    this.currentRepeatPass = 1; // 重置循环遍数
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.onEndCallbacks.forEach((cb) => cb());
  }
}
