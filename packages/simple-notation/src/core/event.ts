import { EventCallback, EventDetail } from '@types';

/**
 * SNEvent 类 - 事件系统核心实现
 *
 * @class SNEvent
 * @description
 * 这个类负责管理事件系统，包括事件的订阅、取消订阅和触发。
 * 它使用单例模式确保整个应用中只有一个事件系统实例。
 */
export class SNEvent {
  private static instance: SNEvent;
  private eventCallbacks: Map<string, Set<EventCallback>> = new Map();

  private constructor() {}

  /**
   * 获取 SNEvent 单例实例
   */
  static getInstance(): SNEvent {
    if (!SNEvent.instance) {
      SNEvent.instance = new SNEvent();
    }
    return SNEvent.instance;
  }

  /**
   * 订阅事件
   * @param event 事件名称，支持标准 DOM 事件和自定义事件（格式：object:action）
   * @param callback 回调函数
   */
  on(event: string, callback: EventCallback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)?.add(callback);
  }

  /**
   * 取消订阅事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  off(event: string, callback: EventCallback) {
    this.eventCallbacks.get(event)?.delete(callback);
  }

  /**
   * 触发事件
   * @param event 事件名称
   * @param detail 事件详情
   */
  emit(event: string, detail: EventDetail) {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const customEvent = new CustomEvent(event, { detail });
      callbacks.forEach((cb) => cb(customEvent));
    }
  }

  /**
   * 清除所有事件监听
   */
  clear() {
    this.eventCallbacks.clear();
  }

  /**
   * 销毁事件系统
   */
  destroy() {
    this.clear();
  }
}
