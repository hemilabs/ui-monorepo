import pDoWhilst from 'p-do-whilst'

type BlockWindowState = {
  from: number
  to: number
  windowIndex: number
}

type OnChangeState = {
  canMove: boolean
  nextState: BlockWindowState
  state: BlockWindowState
}

export type CreateSlidingBlockWindow = {
  initialBlock?: number
  lastBlock: number
  onChange: (args: OnChangeState) => Promise<void>
  windowIndex?: number
  windowSize: number
}

/**
 * The Sliding Block Window is a package used to walk through a list of consecutive-numbered blocks backwards
 * (from a specified block, to another block, where the latter comes before the former), which allows to call a function
 * on every chunk of blocks.
 * The implementation is not tied to blockchain specifics, but to a list of descending consecutive numbers
 * (defined by {@link options.initialBlock} and * {@link options.lastBlock}).
 *
 * Example usage: Let's assume the blockchain has the following blocks, being 10 the newest block, and 0 the genesis block.
 *
 * 10 9 8 7 6 5 4 3 2 1 0
 *
 * If we set a {@link options.windowSize} of 3, the window will slide through the blocks as follows:
 *
 * - First Chunk: 10 9 8 (from: 10, to: 8, windowIndex: 0)
 * - Second Chunk: 7 6 5 (from: 7, to: 5, windowIndex: 1)
 * - Third Chunk: 4 3 2 (from: 4, to: 2, windowIndex: 2)
 * - Fourth Chunk: 1 0 (from: 1, to: 0, windowIndex: 3)
 *
 * As the state can be interrupted at any time, the window can be resumed from the desired chunk
 *
 * @param {object} options Options needed to configure the sliding block window.
 * @param {number} [options.initialBlock=0] The smallest block to walk through. Default is 0.
 * @param {number} options.lastBlock The block to end the window at.
 * @param {function} options.onChange Function to run on every block change.
 * @param {number} [options.windowIndex=0] The index of the window to start at. Zero indexed. Default is 0.
 * @returns {object} The sliding block window object.
 */
export const createSlidingBlockWindow = function ({
  initialBlock = 0,
  lastBlock,
  onChange,
  windowIndex = 0,
  windowSize,
}: CreateSlidingBlockWindow) {
  const innerState = {
    initialBlock,
    lastBlock,
    windowIndex,
    windowSize,
  }

  if (lastBlock <= initialBlock) {
    throw new Error('Invalid Range')
  }

  // calculate how many windows are needed to cover the whole range.
  // If windowIndex is out of range, throw an error
  const neededWindows = Math.ceil((lastBlock - initialBlock) / windowSize)
  if (windowIndex >= neededWindows) {
    throw new Error('Window index is out of range')
  }

  const canMove = () => innerState.windowIndex + 1 < neededWindows

  const getState = (index: number = innerState.windowIndex) => ({
    from: lastBlock - windowSize * index,
    to: Math.max(lastBlock - windowSize * (index + 1) + 1, 0),
    windowIndex: index,
  })

  const moveWindow = function () {
    if (!canMove()) {
      return false
    }
    // move the index
    innerState.windowIndex += 1
    return true
  }

  const nextState = () => getState(innerState.windowIndex + 1)

  const run = () =>
    pDoWhilst(
      () =>
        onChange({
          canMove: canMove(),
          nextState: nextState(),
          state: getState(),
        }).then(moveWindow),
      canMove,
    )

  return {
    canMove,
    getState,
    nextState,
    run,
  }
}

export type SlidingBlockWindow = ReturnType<typeof createSlidingBlockWindow>
