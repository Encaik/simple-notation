import { ref } from 'vue';

let scrollTop = ref(0);
let scrollLeft = ref(0);

/**
 * 钢琴卷帘滚动状态管理
 * @returns {object} scrollTop, setScrollTop, scrollLeft, setScrollLeft
 */
export function usePianoRoll() {
  function setScrollTop(params: number) {
    scrollTop.value = params;
  }
  /**
   * 设置横向滚动
   * @param {number} params 横向滚动距离
   */
  function setScrollLeft(params: number) {
    scrollLeft.value = params;
  }

  return {
    scrollTop,
    setScrollTop,
    scrollLeft,
    setScrollLeft,
  };
}
