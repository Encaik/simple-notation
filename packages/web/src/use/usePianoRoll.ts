import { ref } from 'vue';

let scrollTop = ref(0);

export function usePianoRoll() {
  function setScrollTop(params: number) {
    scrollTop.value = params;
  }

  return {
    scrollTop,
    setScrollTop,
  };
}
