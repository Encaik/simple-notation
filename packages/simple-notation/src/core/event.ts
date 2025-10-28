import { EventCallback, EventDetail } from '@types';

/**
 * 事件系统：支持单例与实例两种用法。
 * - 现有代码仍可通过 SNEvent.getInstance() 使用全局事件总线。
 * - 新代码可通过 new SNEvent() 为每个 SimpleNotation 实例创建独立事件总线。
 */
export class SNEvent {
  private static instance: SNEvent;
  private eventCallbacks: Map<string, Set<EventCallback>> = new Map();

  constructor() {}

  /**
   * 获取（或创建）全局单例事件总线（向后兼容）。
   */
  static getInstance(): SNEvent {
    if (!SNEvent.instance) {
      SNEvent.instance = new SNEvent();
    }
    return SNEvent.instance;
  }

  /** 订阅事件 */
  on(event: string, callback: EventCallback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)?.add(callback);
  }

  /** 取消订阅事件 */
  off(event: string, callback: EventCallback) {
    this.eventCallbacks.get(event)?.delete(callback);
  }

  /** 触发事件 */
  emit(event: string, detail: EventDetail) {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const customEvent = new CustomEvent(event, { detail });
      callbacks.forEach((cb) => cb(customEvent));
    }
  }

  /** 清除所有事件监听 */
  clear() {
    this.eventCallbacks.clear();
  }

  /** 销毁 */
  destroy() {
    this.clear();
  }
}
