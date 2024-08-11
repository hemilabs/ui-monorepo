import sinon from 'sinon'
import { describe, expect, it } from 'vitest'

import { createSlidingBlockWindow } from '../src'

const createArgs = (onChange = sinon.spy()) => ({
  lastBlock: 10,
  onChange,
  windowSize: 3,
})

describe('Block Sliding Window', function () {
  it('should create an object with the default values', function () {
    const slidingWindow = createSlidingBlockWindow(createArgs())

    expect(slidingWindow.getState()).toEqual({
      from: 10,
      to: 8,
      windowIndex: 0,
    })
  })

  it('should create an object with the specified initialBlock', function () {
    const slidingWindow = createSlidingBlockWindow({
      ...createArgs(),
      initialBlock: 5,
    })

    expect(slidingWindow.getState()).toEqual({
      from: 10,
      to: 8,
      windowIndex: 0,
    })
  })

  it('should create an object with the specified windowIndex', function () {
    const slidingWindow = createSlidingBlockWindow({
      ...createArgs(),
      windowIndex: 1,
    })

    expect(slidingWindow.getState()).toEqual({
      from: 7,
      to: 5,
      windowIndex: 1,
    })
  })

  it('should throw if the last block is less than the initial block', function () {
    expect(() =>
      createSlidingBlockWindow({
        initialBlock: 2,
        lastBlock: 1,
        onChange: sinon.spy(),
        windowSize: 1,
      }),
    ).toThrowError('Invalid Range')
  })

  it('should throw if the last block equals the initial block', function () {
    expect(() =>
      createSlidingBlockWindow({
        initialBlock: 1,
        lastBlock: 1,
        onChange: sinon.spy(),
        windowSize: 1,
      }),
    ).toThrowError('Invalid Range')
  })

  it('should throw an error if the windowIndex is out of range', function () {
    expect(() =>
      createSlidingBlockWindow({
        ...createArgs(),
        windowIndex: 4,
      }),
    ).toThrowError('Window index is out of range')
  })

  it('should not overflow if the windowSize is bigger than the range', function () {
    const slidingWindow = createSlidingBlockWindow({
      ...createArgs(),
      lastBlock: 3,
      windowSize: 5,
    })

    expect(slidingWindow.getState()).toEqual({
      from: 3,
      to: 0,
      windowIndex: 0,
    })
  })

  it('should walkthrough all the block range', async function () {
    const onChange = sinon.stub().resolves()
    const slidingWindow = createSlidingBlockWindow(createArgs(onChange))

    expect(slidingWindow.canMove()).toBe(true)

    await slidingWindow.run()

    expect(slidingWindow.canMove()).toBe(false)

    expect(slidingWindow.getState()).toEqual({
      from: 1,
      to: 0,
      windowIndex: 3,
    })

    const calls = [
      {
        canMove: true,
        nextState: { from: 7, to: 5, windowIndex: 1 },
        state: { from: 10, to: 8, windowIndex: 0 },
      },
      {
        canMove: true,
        nextState: { from: 4, to: 2, windowIndex: 2 },
        state: { from: 7, to: 5, windowIndex: 1 },
      },
      {
        canMove: true,
        nextState: { from: 1, to: 0, windowIndex: 3 },
        state: { from: 4, to: 2, windowIndex: 2 },
      },
    ]

    expect(onChange.callCount).toBe(calls.length)
    calls.forEach((params, index) =>
      expect(onChange.getCall(index).args[0]).toEqual(params),
    )
  })

  it('should walkthrough all the block range, starting on an index different than the first one', async function () {
    const onChange = sinon.stub().resolves()
    const slidingWindow = createSlidingBlockWindow({
      ...createArgs(onChange),
      windowIndex: 2,
    })

    expect(slidingWindow.canMove()).toBe(true)

    await slidingWindow.run()

    expect(slidingWindow.getState()).toEqual({
      from: 1,
      to: 0,
      windowIndex: 3,
    })

    expect(slidingWindow.canMove()).toBe(false)

    expect(onChange.callCount).toBe(1)
  })

  it('should call the function at least once even though it can not move', async function () {
    const onChange = sinon.stub().resolves()
    const slidingWindow = createSlidingBlockWindow({
      ...createArgs(),
      onChange,
      windowIndex: 3,
    })

    expect(slidingWindow.canMove()).toBe(false)
    const previousState = slidingWindow.getState()

    await slidingWindow.run()

    expect(slidingWindow.getState()).toEqual(previousState)
    expect(onChange.callCount).toBe(1)
  })
})
