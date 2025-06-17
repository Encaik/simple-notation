import { SNRuntime, SNPlayer } from 'simple-notation';
import { ref } from 'vue';
import { useTone } from './useTone';
import * as Tone from 'tone';

const player = ref<SNPlayer | null>(null);
const playState = ref<'idle' | 'playing' | 'paused'>('idle');

export function usePlayer() {
  const { transport } = useTone();

  const init = async () => {
    if (player.value) return;

    playState.value = 'playing';
    // 根据传入的tempo参数设置播放速度
    Tone.Transport.bpm.value = Number(SNRuntime.info.tempo);

    // 确保 Transport 处于运行状态
    await Tone.start();
    transport.start();

    player.value = new SNPlayer();
    return player.value;
  };

  const play = async () => {
    if (!player.value) {
      await init();
    }
    player.value?.play();
  };

  const pause = () => {
    playState.value = 'paused';
    player.value?.pause();
    transport.pause();
  };

  const resume = () => {
    playState.value = 'playing';
    player.value?.resume();
    transport.start();
  };

  const stop = () => {
    playState.value = 'idle';
    player.value?.stop();
    transport.stop();
    transport.position = 0;
  };

  const setCurrentIndex = (index: number) => {
    player.value?.setCurrentIndex(index);
  };

  const getNotes = () => {
    return player.value?.getNotes() || [];
  };

  return {
    player,
    playState,
    init,
    play,
    pause,
    resume,
    stop,
    setCurrentIndex,
    getNotes,
  };
}
