import { SNDebugOptions } from '@types';

export default {
  borderbox: {
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
      outer: false,
    },
    measure: {
      inner: false,
      outer: false,
    },
    note: {
      inner: true,
      outer: true,
    },
  },
} as SNDebugOptions;
