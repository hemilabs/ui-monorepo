declare module 'startinterval2' {
  function startInterval<A extends unknown[]>(
    fn: (...args: A) => void,
    delay: number,
    ...params: A
  ): ReturnType<typeof setInterval>

  export = startInterval
}
