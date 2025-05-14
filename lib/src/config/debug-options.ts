import { SNDebugOptions } from '@types';

export default {
  borderbox: {
    content: {
      inner: false,
      outer: false,
    },
    info: {
      inner: false,
      outer: false,
    },
    score: {
      inner: true,
      outer: false,
    },
    stave: {
      inner: false,
      outer: true,
    },
    measure: {
      inner: false,
      outer: false,
    },
    note: {
      inner: false,
      outer: false,
    },
  },
} as SNDebugOptions;
