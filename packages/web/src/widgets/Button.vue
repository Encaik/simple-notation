<template>
  <button :class="buttonClasses" :disabled="disabled">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/**
 * @props
 */
interface Props {
  /**
   * 是否禁用按钮
   */
  disabled?: boolean;
  /**
   * 按钮类型：默认为 default，可选 ghost
   */
  type?: 'default' | 'ghost';
  /**
   * 按钮颜色：可以是 Tailwind CSS 颜色名称（如 'blue', 'red'）或十六进制颜色值（如 '#000', '#ffffff'）
   */
  color?: string;
  /**
   * 按钮尺寸：默认为 default，可选 large 或 small
   */
  size?: 'large' | 'default' | 'small';
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  type: 'default',
  color: '',
  size: 'default',
});

/**
 * @computed
 * 按钮的 CSS 类
 */
const buttonClasses = computed(() => {
  let baseClasses =
    'cursor-pointer min-h-auto box-border transition-colors duration-200 ease-in-out'; // 移除通用 padding 和 rounded，因为它们会根据 size 变化
  let typeClasses = '';
  let disabledClasses = '';
  let sizeClasses = '';

  // 根据 size 属性添加尺寸相关的类
  if (props.size === 'large') {
    sizeClasses = 'py-3 px-4 text-base rounded';
  } else if (props.size === 'small') {
    sizeClasses = 'py-1 px-2 text-xs rounded';
  } else {
    // default size
    sizeClasses = 'py-2 px-3 text-sm rounded';
  }

  const isHexColor = (value: string) => value.startsWith('#');

  if (props.type === 'default') {
    if (!props.color) {
      typeClasses =
        'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:border-primary-500 focus:outline-none focus:ring focus:ring-primary-300';
    } else if (isHexColor(props.color!)) {
      typeClasses = `bg-[${props.color}] border border-[${props.color}] text-white hover:bg-transparent hover:text-gray-600`;
    } else {
      typeClasses = `bg-${props.color}-500 text-white hover:bg-${props.color}-600`;
    }
  } else if (props.type === 'ghost') {
    if (!props.color) {
      typeClasses = `bg-transparent border border-[#ddd] hover:border[#aaa] hover:bg-[#aaa] hover:text-white`;
    } else if (isHexColor(props.color!)) {
      typeClasses = `bg-transparent text-[${props.color}] border border-[${props.color}] hover:bg-[${props.color}] hover:text-white`;
    } else {
      typeClasses = `bg-transparent text-${props.color}-500 border border-${props.color}-500 hover:bg-${props.color}-500 hover:text-white`;
    }
  }

  if (props.disabled) {
    disabledClasses = 'opacity-50 cursor-not-allowed';
  }

  return [baseClasses, sizeClasses, typeClasses, disabledClasses].join(' ');
});
</script>
