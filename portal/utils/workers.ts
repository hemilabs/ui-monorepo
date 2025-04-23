// See https://github.com/Microsoft/TypeScript/issues/20595#issuecomment-587297818
export const typeWorker = <T>(worker: Window & typeof globalThis) =>
  worker as unknown as T
