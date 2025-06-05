<template>
  <div
    class="max-w-[1200px] w-full mt-5 mx-auto p-[2.5px] rounded-xl bg-gradient-to-br from-[#ff6b3d] to-[#7b5aff] shadow-md flex flex-row gap-4 overflow-hidden box-border hover:shadow-lg hover:-translate-y-0.5 transition duration-300"
  >
    <div
      class="relative h-[120px] w-full select-none bg-white bg-opacity-95 rounded-[11px] overflow-hidden"
    >
      <!-- 类型切换开关组 -->
      <div class="absolute top-1.5 right-2 z-20 flex items-center gap-1.5">
        <button
          class="relative px-3 py-1 rounded text-[11px] transition-all duration-200 shadow-sm"
          :class="[
            harmonicaStore.type === 'tremolo'
              ? 'bg-gradient-to-b from-[#666] to-[#444] text-white transform scale-105'
              : 'bg-gradient-to-b from-[#DDD] to-[#BBB] text-gray-600 hover:from-[#CCC] hover:to-[#AAA]',
          ]"
          @click="harmonicaStore.setType('tremolo')"
        >
          <span class="relative z-10">复音</span>
        </button>
        <button
          class="relative px-3 py-1 rounded text-[11px] transition-all duration-200 shadow-sm"
          :class="[
            harmonicaStore.type === 'chromatic'
              ? 'bg-gradient-to-b from-[#666] to-[#444] text-white transform scale-105'
              : 'bg-gradient-to-b from-[#DDD] to-[#BBB] text-gray-600 hover:from-[#CCC] hover:to-[#AAA]',
          ]"
          @click="harmonicaStore.setType('chromatic')"
        >
          <span class="relative z-10">半音阶</span>
        </button>
      </div>

      <!-- 口琴主体 -->
      <div
        class="relative w-full h-full bg-gradient-to-b from-[#E0E0E0] to-[#B0B0B0] pt-10 pb-4 px-4"
        @mousedown="startDrag"
        @mouseup="endDrag"
        @mouseleave="endDrag"
        @touchstart.prevent="startDrag"
        @touchend="endDrag"
        @touchcancel="endDrag"
      >
        <!-- 金属装饰纹理 -->
        <div
          class="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#DDD] to-[#BBB]"
        >
          <div
            class="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_25%,transparent_50%,rgba(255,255,255,0.1)_75%,transparent_100%)]"
          ></div>
        </div>

        <!-- 半音阶口琴滑钮 -->
        <div v-if="isChromatic" class="absolute top-0.5 left-1.5 z-30">
          <button
            class="relative w-6 h-6 rounded-full text-[10px] transition-all duration-100"
            :class="[
              isSlidePressed
                ? 'bg-gradient-to-b from-[#555] to-[#333] text-white transform translate-y-[1px]'
                : 'bg-gradient-to-b from-[#EEE] to-[#CCC] text-gray-700 shadow-sm',
            ]"
            @mousedown="isSlidePressed = true"
            @mouseup="isSlidePressed = false"
            @mouseleave="isSlidePressed = false"
            @touchstart.prevent="isSlidePressed = true"
            @touchend="isSlidePressed = false"
          >
            <span class="relative z-10">{{ isSlidePressed ? '↑' : '↓' }}</span>
          </button>
        </div>

        <!-- 吹奏孔区域 -->
        <div
          class="relative h-full bg-gradient-to-b from-[#333] to-[#222] rounded-md shadow-inner overflow-hidden"
        >
          <!-- 半音阶口琴：每个孔上下布局 -->
          <div
            v-if="isChromatic"
            class="flex flex-col gap-0.5 p-1 h-full justify-center"
          >
            <!-- 在外层添加一个居中容器 -->
            <div class="flex-1 w-1/2 mx-auto">
              <div class="flex flex-row h-full gap-0.5 justify-center">
                <div
                  v-for="(_hole, index) in harmonicaStore.chromaticHoles"
                  :key="index"
                  class="flex flex-col w-[calc(100%/12-2px)]"
                >
                  <!-- 上半部分：吸音 -->
                  <button
                    class="relative w-full h-1/2 rounded-t-[1px] text-[8px] transition-all duration-100 border-b border-gray-300"
                    :class="[
                      'bg-gradient-to-b from-[#f5f5f5] to-[#e0e0e0] hover:from-[#e0e0e0] hover:to-[#d0d0d0]',
                      'active:from-[#d0d0d0] active:to-[#c0c0c0] active:transform active:scale-95',
                      {
                        'bg-[#ffd54f] from-[#ffd54f] to-[#ffb300] hover:from-[#ffb300] hover:to-[#ffa000]':
                          harmonicaStore.highlightNotes.includes(
                            `${index}-draw`,
                          ) || tempHighlightedNotes[`${index}-draw`],
                      },
                    ]"
                    @click="handleChromaticPlay(index, 'draw')"
                    @mouseover="handleKeyMouseOver(index, 'draw')"
                  >
                    <div
                      class="absolute inset-0 rounded-t-[1px] bg-gradient-to-t from-transparent to-[rgba(255,255,255,0.4)] group-hover:to-[rgba(255,255,255,0.5)]"
                    ></div>
                    <div
                      class="absolute inset-0 flex items-center justify-center text-gray-600 font-medium"
                    >
                      吸
                    </div>
                  </button>
                  <!-- 下半部分：吹音 -->
                  <button
                    class="relative w-full h-1/2 rounded-b-[1px] text-[8px] transition-all duration-100"
                    :class="[
                      'bg-gradient-to-b from-[#e8e8e8] to-[#d8d8d8] hover:from-[#d8d8d8] hover:to-[#c8c8c8]',
                      'active:from-[#c8c8c8] active:to-[#b8b8b8] active:transform active:scale-95',
                      {
                        'bg-[#ffd54f] from-[#ffd54f] to-[#ffb300] hover:from-[#ffb300] hover:to-[#ffa000]':
                          harmonicaStore.highlightNotes.includes(
                            `${index}-blow`,
                          ) || tempHighlightedNotes[`${index}-blow`],
                      },
                    ]"
                    @click="handleChromaticPlay(index, 'blow')"
                    @mouseover="handleKeyMouseOver(index, 'blow')"
                  >
                    <div
                      class="absolute inset-0 rounded-b-[1px] bg-gradient-to-t from-transparent to-[rgba(255,255,255,0.4)] group-hover:to-[rgba(255,255,255,0.5)]"
                    ></div>
                    <div
                      class="absolute inset-0 flex items-center justify-center text-gray-600 font-medium"
                    >
                      吹
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 复音口琴：24个孔按顺序排列 -->
          <div
            v-if="!isChromatic"
            class="flex flex-row gap-0.5 p-1 h-full items-center"
          >
            <template
              v-for="(hole, index) in harmonicaStore.tremoloHoles"
              :key="index"
            >
              <!-- 吹音孔 -->
              <button
                v-if="hole.blow"
                class="relative w-[calc(100%/24-2px)] h-full rounded-[1px] text-[8px] transition-all duration-100"
                :class="[
                  'bg-gradient-to-b from-[#f0f0f0] to-[#e0e0e0] hover:from-[#e0e0e0] hover:to-[#d0d0d0]',
                  'active:from-[#d0d0d0] active:to-[#c0c0c0] active:transform active:scale-95',
                  {
                    'bg-[#ffd54f] from-[#ffd54f] to-[#ffb300] hover:from-[#ffb300] hover:to-[#ffa000]':
                      harmonicaStore.highlightNotes.includes(`${index}-blow`) ||
                      tempHighlightedNotes[`${index}-blow`],
                  },
                ]"
                @click="handleTremoloPlay(index, 'blow')"
                @mouseover="handleKeyMouseOver(index, 'blow')"
              >
                <div
                  class="absolute inset-0 rounded-[1px] bg-gradient-to-t from-transparent to-[rgba(255,255,255,0.4)] group-hover:to-[rgba(255,255,255,0.5)]"
                ></div>
                <div
                  class="absolute inset-0 flex items-center justify-center text-gray-600 font-medium"
                >
                  吹
                </div>
              </button>
              <!-- 吸音孔 -->
              <button
                v-if="hole.draw"
                class="relative w-[calc(100%/24-2px)] h-full rounded-[1px] text-[8px] transition-all duration-100"
                :class="[
                  'bg-gradient-to-b from-[#e8e8e8] to-[#d8d8d8] hover:from-[#d8d8d8] hover:to-[#c8c8c8]',
                  'active:from-[#c8c8c8] active:to-[#b8b8b8] active:transform active:scale-95',
                  {
                    'bg-[#ffd54f] from-[#ffd54f] to-[#ffb300] hover:from-[#ffb300] hover:to-[#ffa000]':
                      harmonicaStore.highlightNotes.includes(`${index}-draw`) ||
                      tempHighlightedNotes[`${index}-draw`],
                  },
                ]"
                @click="handleTremoloPlay(index, 'draw')"
                @mouseover="handleKeyMouseOver(index, 'draw')"
              >
                <div
                  class="absolute inset-0 rounded-[1px] bg-gradient-to-t from-transparent to-[rgba(255,255,255,0.4)] group-hover:to-[rgba(255,255,255,0.5)]"
                ></div>
                <div
                  class="absolute inset-0 flex items-center justify-center text-gray-600 font-medium"
                >
                  吸
                </div>
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTone } from '../../use/useTone';
import { useHarmonicaStore } from '../../stores';

const harmonicaStore = useHarmonicaStore();

// 是否为半音阶口琴
const isChromatic = computed(() => harmonicaStore.type === 'chromatic');
// 半音阶口琴滑钮状态
const isSlidePressed = ref(false);
const isDragging = ref(false);
const tempHighlightedNotes = ref<Record<string, boolean>>({});

const { playNote } = useTone();

/**
 * 复音口琴发声处理
 * @param i 组索引
 * @param type 'blow' | 'draw'
 */
function handleTremoloPlay(i: number, type: 'blow' | 'draw') {
  const noteName = harmonicaStore.tremoloHoles[i][type];
  if (noteName) {
    playNote(noteName, 0.6);
    const noteKey = `${i}-${type}`;
    // 如果不是拖动状态，设置持久高亮
    if (!isDragging.value) {
      harmonicaStore.setHighlightNotes([noteKey], 'melody');
      setTimeout(() => {
        harmonicaStore.clearMelodyHighlightMidis();
      }, 600);
    } else {
      // 拖动状态设置临时高亮
      tempHighlightedNotes.value[noteKey] = true;
      setTimeout(() => {
        delete tempHighlightedNotes.value[noteKey];
      }, 200);
    }
  }
}

/**
 * 半音阶口琴发声处理
 * @param i 孔索引
 * @param type 'blow' | 'draw'
 */
function handleChromaticPlay(i: number, type: 'blow' | 'draw') {
  const noteName = getChromaticNoteName(i, type);
  if (noteName) {
    playNote(noteName, 0.6);
    const noteKey = `${i}-${type}-${isSlidePressed.value ? 1 : 0}`;
    if (!isDragging.value) {
      harmonicaStore.setHighlightNotes([noteKey], 'melody');
      setTimeout(() => {
        harmonicaStore.clearMelodyHighlightMidis();
      }, 600);
    } else {
      tempHighlightedNotes.value[noteKey] = true;
      setTimeout(() => {
        delete tempHighlightedNotes.value[noteKey];
      }, 200);
    }
  }
}

/**
 * 获取半音阶口琴的音符名称
 * @param i 孔索引
 * @param type 'blow' | 'draw'
 * @returns 音符名称
 */
function getChromaticNoteName(i: number, type: 'blow' | 'draw'): string | null {
  const hole = harmonicaStore.chromaticHoles[i];
  if (!hole) return null;
  // 根据滑钮状态返回主音或升半音
  return hole[type][isSlidePressed.value ? 1 : 0];
}

/**
 * 开始拖动模式
 */
function startDrag(event: MouseEvent | TouchEvent) {
  if (event.type.startsWith('touch')) {
    event.preventDefault();
  }
  isDragging.value = true;
  tempHighlightedNotes.value = {};
}

/**
 * 结束拖动模式
 */
function endDrag() {
  isDragging.value = false;
  tempHighlightedNotes.value = {};
  harmonicaStore.clearMelodyHighlightMidis();
  harmonicaStore.clearChordHighlightMidis();
}

/**
 * 处理键位悬停
 */
function handleKeyMouseOver(i: number, type: 'blow' | 'draw') {
  if (isDragging.value) {
    if (type === 'blow' || type === 'draw') {
      handleTremoloPlay(i, type);
    }
  }
}
</script>
