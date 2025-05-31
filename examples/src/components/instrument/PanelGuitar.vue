<template>
  <div
    class="max-w-[1200px] w-full mt-5 mx-auto p-[2.5px] rounded-xl bg-gradient-to-br from-[#ff6b3d] to-[#7b5aff] shadow-md flex flex-row gap-4 overflow-hidden box-border hover:shadow-lg hover:-translate-y-0.5 transition duration-300"
    style="background-color: #f0f0f0"
  >
    <div
      class="relative h-[120px] w-full select-none bg-white bg-opacity-95 rounded-[11px] overflow-hidden flex flex-col"
      @mousedown="startDrag"
      @mouseup="endDrag"
      @mouseleave="endDrag"
      @touchstart.passive="startDrag"
      @touchend="endDrag"
      @touchcancel="endDrag"
    >
      <div class="flex-1 grid grid-cols-layout h-full">
        <div
          class="col-start-1 col-end-2 grid grid-rows-6 h-full border-r border-[#bbb] bg-[#eee]"
        >
          <div
            v-for="stringIndex in 6"
            :key="`open-${stringIndex}`"
            :data-string-index="stringIndex"
            data-fret-index="0"
            class="flex items-center justify-center text-xs font-bold text-[#333] h-full cursor-pointer open-string"
            @click="handleGuitarPositionClick(stringIndex, 0)"
            @mouseover="handleGuitarPositionMouseOver(stringIndex, 0)"
          >
            |
          </div>
        </div>

        <div
          ref="guitarFretboard"
          class="flex-1 col-start-2 col-end-end h-full relative bg-[#a0866e]"
        >
          <div class="grid grid-rows-6 h-full" :style="gridTemplateColumns">
            <template v-for="fret in numFrets" :key="`fret-dot-row-${fret}`">
              <div
                v-if="[3, 5, 7, 9, 15].includes(fret)"
                class="w-2 h-2 bg-gray-200 rounded-full absolute z-10"
                :style="getFretDotStyle(fret, 'single')"
              ></div>
              <template v-if="fret === 12">
                <div
                  class="w-2 h-2 bg-gray-200 rounded-full absolute z-10"
                  :style="getFretDotStyle(fret, 'double-top')"
                ></div>
                <div
                  class="w-2 h-2 bg-gray-200 rounded-full absolute z-10"
                  :style="getFretDotStyle(fret, 'double-bottom')"
                ></div>
              </template>
            </template>

            <div
              v-for="fret in numFrets + 1"
              :key="`fret-line-${fret}`"
              class="h-full bg-gray-300 col-start-auto col-end-auto row-start-1 row-end-7 z-15"
              :style="getFretStyle(fret - 1)"
            ></div>

            <template
              v-for="stringIndex in 6"
              :key="`string-row-${stringIndex}`"
            >
              <div
                v-for="fret in numFrets"
                :key="`string-${stringIndex}-fret-${fret}`"
                :data-string-index="stringIndex"
                :data-fret-index="fret"
                :style="{ 'grid-column': fret, 'grid-row': stringIndex }"
                class="relative flex items-center justify-center cursor-pointer z-35 guitar-position"
                @click="handleGuitarPositionClick(stringIndex, fret)"
                @mouseover="handleGuitarPositionMouseOver(stringIndex, fret)"
              >
                <div
                  class="bg-[#c0c0c0] shadow-sm rounded-full"
                  :style="getStringSegmentStyle(stringIndex)"
                ></div>
              </div>
            </template>
          </div>

          <div
            v-if="transpose > 0"
            class="absolute top-0 bottom-0 bg-gray-700 bg-opacity-50 z-40 pointer-events-none rounded-sm bg-gradient-to-b from-gray-600 to-gray-800"
            :style="capoStyle"
          ></div>

          <div
            class="absolute top-0 left-0 w-full h-full pointer-events-none z-50"
          >
            <div
              v-for="highlight in allHighlightPositions"
              :key="`highlight-${highlight.string}-${highlight.fret}`"
              class="absolute w-4 h-4 rounded-full bg-yellow-400 bg-opacity-75"
              :style="getHighlightDotStyle(highlight.string, highlight.fret)"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, type CSSProperties } from 'vue';
import { useTone } from '../../use/useTone';
import { useGuitarStore } from '../../stores/guitar';
import { GuitarPosition } from '../../model';
import { guitarTuning } from '@types';

const guitarStore = useGuitarStore();
const guitarFretboard = ref<HTMLElement | null>(null);

const numFrets = 17;
const fretPositions = computed(() => {
  const positions = [0]; // 从位置 0 开始 (弦枕)
  const scaleLength = 650; // 近似有效弦长 (毫米)
  for (let i = 1; i <= numFrets; i++) {
    // 使用17.817规则计算品丝位置 (近似)
    const fretDistance = scaleLength - positions[i - 1];
    positions.push(positions[i - 1] + fretDistance / 17.817); // 使用 17.817 以获得稍高的精度
  }
  // 将位置归一化为相对于品格区域总长度的百分比 (从弦枕到最后一个品的距离)
  const totalFrettedLength = positions[numFrets] - positions[0]; // 从弦枕到最后一个品的长度
  return positions.map((pos) => (pos / totalFrettedLength) * 100); // Normalize relative to the entire fretted area length
});

const gridTemplateColumns = computed(() => {
  const fretSpaceWidths = [];
  const totalFrettedLength =
    fretPositions.value[numFrets] - fretPositions.value[0];
  for (let i = 0; i < numFrets; i++) {
    const spaceWidth = fretPositions.value[i + 1] - fretPositions.value[i];
    const spaceWidthPercentage = (spaceWidth / totalFrettedLength) * 100;
    fretSpaceWidths.push(`${spaceWidthPercentage}%`);
  }
  return `grid-template-columns: ${fretSpaceWidths.join(' ')};`;
});

const allHighlightPositions = computed(() => {
  const combined: Record<string, GuitarPosition> = {};
  guitarStore.highlightPositions.forEach((pos) => {
    combined[`${pos.string}-${pos.fret}`] = pos;
  });
  return [
    ...Object.values(combined),
    ...Object.values(tempHighlightedPositions.value),
  ];
});

/**
 * 计算变调夹的样式，根据 transpose 值确定位置和宽度
 * @returns {CSSProperties}
 */
const capoStyle = computed<CSSProperties>(() => {
  const fretIndex = transpose.value; // transpose的值即为品位索引 (0-based)
  if (fretIndex <= 0 || fretIndex > numFrets) {
    // 如果 transpose 小于等于 0 或超出范围，不显示变调夹
    return { display: 'none' };
  }

  // 变调夹位于 fretIndex 品位"后面"的空间，即 fretIndex-1 品丝到 fretIndex 品丝之间
  // 修改：将变调夹的宽度设置为固定值，并居中于该品位空间
  const capoWidthPercentage = 4; // 变调夹宽度占总指板宽度的百分比，已调整为稍微宽一点

  const spaceLeftPercentage = fretPositions.value[fretIndex - 1]; // 空间左边缘百分比
  const spaceRightPercentage = fretPositions.value[fretIndex]; // 空间右边缘百分比
  const spaceCenterPercentage =
    (spaceLeftPercentage + spaceRightPercentage) / 2; // 空间中心百分比

  // 计算变调夹的左侧位置，使其中心对齐到空间中心
  const leftPositionPercentage =
    spaceCenterPercentage - capoWidthPercentage / 2;

  return {
    left: `${leftPositionPercentage}%`,
    width: `${capoWidthPercentage}%`,
  };
});

/**
 * 获取品丝的样式 (垂直线) - Positioned within the grid
 * @param {number} fretIndex - 品丝索引 (0-based, 0 是弦枕)
 * @returns {object}
 */
function getFretStyle(fretIndex: number) {
  const gridColumn = fretIndex;

  if (fretIndex === 0) {
    // 弦枕的样式 (较粗的线)
    return {
      gridColumn: `${gridColumn} / span 1`,
      width: '5px', // 较粗的弦枕
      backgroundColor: '#555',
    };
  }
  return {
    gridColumn: `${gridColumn} / span 1`,
    width: '2px', // 标准品丝厚度
    backgroundColor: '#bbb',
  };
}

/**
 * 获取品位点样式 - Positioned using absolute position within the container
 * @param {number} fret - 品位索引 (1-based)
 * @param {'single' | 'double-top' | 'double-bottom'} type - 品位点类型
 * @returns {object}
 */
function getFretDotStyle(
  fret: number,
  type: 'single' | 'double-top' | 'double-bottom',
) {
  // 品位点应该居中在品丝 'fret - 1' 和 'fret' 之间的空间中。
  // 空间的左边缘在 fretPositions.value[fret - 1]，右边缘在 fretPositions.value[fret]。

  const spaceLeftPercentage = fretPositions.value[fret - 1]; // 空间左边缘百分比
  const spaceRightPercentage = fretPositions.value[fret]; // 空间右边缘百分比
  const spaceWidthPercentage = spaceRightPercentage - spaceLeftPercentage; // 空间宽度百分比

  // 计算点在空间内的水平中心位置
  const dotLeftPercentage = spaceLeftPercentage + spaceWidthPercentage / 2;

  let topPosition = 'calc(50% - 4px)'; // Default centered vertically
  if (type === 'double-top') {
    topPosition = 'calc(30% - 4px)'; // Top dot for double dots
  } else if (type === 'double-bottom') {
    topPosition = 'calc(70% - 4px)'; // Bottom dot for double dots
  }

  return {
    top: topPosition,
    left: `${dotLeftPercentage}%`,
  };
}

/**
 * 获取弦段样式
 * @param {number} stringIndex - 弦索引 (1-6)
 * @returns {CSSProperties}
 */
function getStringSegmentStyle(stringIndex: number): CSSProperties {
  return {
    width: '100%',
    // 弦的粗细和颜色金属质感
    height: `${stringIndex / 3}px`,
    backgroundColor: stringIndex >= 4 ? '#d1b574' : '#e4e4e4',
  };
}

/**
 * 获取指定弦和品位的音名
 * @param {number} stringIndex - 弦索引 (1-6)
 * @param {number} fret - 品位 (0-based)
 * @returns {string | null} - 音名，如果无效则返回 null
 */
function getStringFretNote(stringIndex: number, fret: number): string | null {
  const openNote = guitarTuning[stringIndex];
  if (!openNote) return null;
  const openMidi = noteNameToMidi(openNote);
  const playedMidi = openMidi + fret;
  return midiToNoteName(playedMidi);
}

/**
 * 计算高亮圆点的位置样式
 * @param {number} stringIndex - 弦索引 (1-6)
 * @param {number} fret - 品位 (0-based)
 * @returns {CSSProperties}
 */
function getHighlightDotStyle(
  stringIndex: number,
  fret: number,
): CSSProperties {
  if (fret === 0) {
    const stringHeight = 100 / 6;
    const topPosition = (stringIndex - 0.5) * stringHeight;
    const openStringAreaWidth = 60;
    const leftPositionPx = -openStringAreaWidth / 2;

    return {
      left: `${leftPositionPx}px`, // 使用像素值设置左侧位置
      top: `${topPosition}%`,
      transform: 'translate(-50%, -50%)', // 使用transform精确居中
    };
  } else {
    const spaceLeftPercentage = fretPositions.value[fret - 1];
    const spaceRightPercentage = fretPositions.value[fret];
    const spaceCenterPercentage =
      (spaceLeftPercentage + spaceRightPercentage) / 2;

    const stringHeight = 100 / 6; // 每根弦的高度百分比
    // 修改：移除垂直偏移，依赖 transform 进行垂直居中
    const topPosition = (stringIndex - 1) * stringHeight + stringHeight / 2; // 垂直居中

    return {
      left: `${spaceCenterPercentage}%`,
      top: `${topPosition}%`,
      transform: 'translate(-50%, -50%)', // 使用transform精确居中
    };
  }
}

const { transpose, playNote, noteNameToMidi, midiToNoteName } = useTone();

const isDragging = ref(false); // State to track if mouse or touch is down
const tempHighlightedPositions = ref<Record<string, GuitarPosition>>({}); // To track positions temporarily highlighted during drag

// Add touchmove listener to window when component is mounted
onMounted(() => {
  window.addEventListener(
    'touchmove',
    handleTouchMove as unknown as EventListener,
    { passive: false },
  );
});

// Remove touchmove listener from window when component is unmounted
onUnmounted(() => {
  window.removeEventListener(
    'touchmove',
    handleTouchMove as unknown as EventListener,
  );
});

/**
 * Handles click event on a guitar position (open string or fretted note).
 * @param {number} stringIndex - The index of the string (1-6).
 * @param {number} fret - The fret number (0 for open string).
 * @returns {Promise<void>}
 */
async function handleGuitarPositionClick(stringIndex: number, fret: number) {
  // 当存在变调夹时，变调夹左边的音无法触发
  if (transpose.value > 0 && fret < transpose.value) {
    return; // 如果品位在变调夹左侧，则不执行后续操作
  }

  // If dragging (mouse or touch), the mouseover/touchmove event handles playback, so do nothing on click
  if (isDragging.value) {
    return;
  }
  const noteName = getStringFretNote(stringIndex, fret);
  if (noteName) {
    await playNote(noteName, '2n');
    // 不再在元素内部设置高亮，而是更新store或临时高亮
    guitarStore.setHighlightPositions(
      [{ string: stringIndex, fret: fret }],
      'melody',
    );
    setTimeout(() => {
      guitarStore.clearMelodyHighlightMidis();
    }, 1000);
  }
}

/**
 * Handles mouseover event on a guitar position when dragging (for desktop).
 * Plays the note and sets a temporary highlight.
 * @param {number} stringIndex - The index of the string (1-6).
 * @param {number} fret - The fret number (0 for open string).
 * @returns {void}
 */
async function handleGuitarPositionMouseOver(
  stringIndex: number,
  fret: number,
) {
  if (isDragging.value && transpose.value > 0 && fret < transpose.value) {
    return;
  }

  if (isDragging.value) {
    const positionKey = `${stringIndex}-${fret}`;
    const noteName = getStringFretNote(stringIndex, fret);
    if (noteName) {
      try {
        playNote(noteName, '8n');
        tempHighlightedPositions.value[positionKey] = {
          string: stringIndex,
          fret: fret,
        };
        setTimeout(() => {
          delete tempHighlightedPositions.value[positionKey];
        }, 200);
      } catch (error) {
        console.error('Error handling guitar mouseover:', error);
      }
    }
  }
}

/**
 * Handles touchmove event on the window when dragging (for mobile).
 * Determines the element being touched and triggers playback/highlight if it's a guitar position.
 * @param {TouchEvent} event - The touch event.
 * @returns {void}
 */
async function handleTouchMove(event: TouchEvent) {
  if (isDragging.value && event.touches.length > 0) {
    const touch = event.touches[0];
    const targetElement = document.elementFromPoint(
      touch.clientX,
      touch.clientY,
    );

    // Check if the touched element is a guitar position element
    if (
      (targetElement && targetElement.classList.contains('guitar-position')) ||
      targetElement?.classList.contains('open-string')
    ) {
      const stringIndex = parseInt(
        targetElement.getAttribute('data-string-index') || '-1',
        10,
      );
      const fret = parseInt(
        targetElement.getAttribute('data-fret-index') || '-1',
        10,
      );

      if (stringIndex !== -1 && fret !== -1) {
        const positionKey = `${stringIndex}-${fret}`;
        // Check if this position is already temporarily highlighted to avoid rapid re-triggering
        if (!tempHighlightedPositions.value[positionKey]) {
          const noteName = getStringFretNote(stringIndex, fret);
          if (noteName) {
            try {
              playNote(noteName, '8n'); // Play with a shorter duration

              // Set temporary highlight
              tempHighlightedPositions.value[positionKey] = {
                string: stringIndex,
                fret: fret,
              };

              // Remove highlight after a short duration
              setTimeout(() => {
                delete tempHighlightedPositions.value[positionKey];
              }, 200);
            } catch (error) {
              console.error('Error handling guitar touchmove:', error);
            }
          }
        }
      }
    }
  }
}

/**
 * Starts the dragging mode.
 * @param {MouseEvent | TouchEvent} event - The mouse or touch event.
 * @returns {void}
 */
function startDrag(event: MouseEvent | TouchEvent) {
  if (event.type.startsWith('touch')) {
    event.preventDefault();
  }
  isDragging.value = true;
  tempHighlightedPositions.value = {};
}

/**
 * Ends the dragging mode.
 * @param {MouseEvent | TouchEvent} event - The mouse or touch event.
 * @returns {void}
 */
function endDrag() {
  isDragging.value = false;
  tempHighlightedPositions.value = {};
  guitarStore.clearMelodyHighlightMidis();
  guitarStore.clearChordHighlightMidis();
}
</script>

<style scoped>
.grid-cols-layout {
  display: grid;
  grid-template-columns: 60px 1fr;
}
</style>
