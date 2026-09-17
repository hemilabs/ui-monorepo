import {
  finishPosition,
  recordStep,
  settledSteps,
  startPosition,
  walkOutcome,
} from 'app/[locale]/staking-dashboard/_utils/claimWalk'
import type { ClaimWalkPosition } from 'types/stakingDashboard'
import { describe, expect, it } from 'vitest'

const one = BigInt(1)
const two = BigInt(2)
const progress = (chunk: number, chunks = 3) => ({
  chunk,
  chunks,
  from: 3000 + chunk * 48,
  to: 3047 + chunk * 48,
})
const hash = `0x${'a'.repeat(64)}` as const

const walkWith = (...ids: bigint[]): ClaimWalkPosition[] =>
  ids.reduce(
    (walk, tokenId) => startPosition(walk, { amount: BigInt(100), tokenId }),
    [] as ClaimWalkPosition[],
  )

describe('startPosition', function () {
  it('adds a position with no steps yet', function () {
    expect(walkWith(one)).toEqual([
      { amount: BigInt(100), steps: [], tokenId: one },
    ])
  })

  it('keeps positions in the order they were started', function () {
    expect(walkWith(two, one).map(p => p.tokenId)).toEqual([two, one])
  })

  // A retry re-enters the flow, so the same position can be announced twice.
  it('does not add the same position twice', function () {
    const walk = recordStep(walkWith(one), {
      progress: progress(1),
      status: 'confirmed',
      tokenId: one,
    })

    const again = startPosition(walk, { amount: BigInt(100), tokenId: one })

    expect(again).toHaveLength(1)
    expect(again[0].steps).toHaveLength(1)
  })
})

describe('recordStep', function () {
  it('appends a step the first time it is seen', function () {
    const walk = recordStep(walkWith(one), {
      progress: progress(1),
      status: 'signing',
      tokenId: one,
    })

    expect(walk[0].steps).toEqual([
      { chunk: 1, chunks: 3, from: 3048, status: 'signing', to: 3095 },
    ])
  })

  // Steps accumulate. Reporting only the current chunk made a half-finished claim look
  // like a failure.
  it('keeps earlier steps when a later one starts', function () {
    let walk = recordStep(walkWith(one), {
      progress: progress(1),
      status: 'confirmed',
      tokenId: one,
      transactionHash: hash,
    })
    walk = recordStep(walk, {
      progress: progress(2),
      status: 'signing',
      tokenId: one,
    })

    expect(walk[0].steps.map(s => [s.chunk, s.status])).toEqual([
      [1, 'confirmed'],
      [2, 'signing'],
    ])
  })

  it('updates a step in place rather than duplicating it', function () {
    let walk = recordStep(walkWith(one), {
      progress: progress(1),
      status: 'signing',
      tokenId: one,
      transactionHash: hash,
    })
    walk = recordStep(walk, {
      progress: progress(1),
      status: 'confirmed',
      tokenId: one,
    })

    expect(walk[0].steps).toHaveLength(1)
    expect(walk[0].steps[0].status).toBe('confirmed')
  })

  // A confirmation arrives without the hash the signature gave us, and losing it drops
  // the only link to money that was actually received.
  it('keeps a hash a later event does not carry', function () {
    let walk = recordStep(walkWith(one), {
      progress: progress(1),
      status: 'signing',
      tokenId: one,
      transactionHash: hash,
    })
    walk = recordStep(walk, {
      progress: progress(1),
      status: 'confirmed',
      tokenId: one,
    })

    expect(walk[0].steps[0].transactionHash).toBe(hash)
  })

  it('only touches the position it names', function () {
    const walk = recordStep(walkWith(one, two), {
      progress: progress(1),
      status: 'confirmed',
      tokenId: two,
    })

    expect(walk[0].steps).toEqual([])
    expect(walk[1].steps).toHaveLength(1)
  })
})

describe('finishPosition', function () {
  it('settles a step left mid-flight so nothing spins after the claim stopped', function () {
    let walk = recordStep(walkWith(one), {
      progress: progress(1),
      status: 'signing',
      tokenId: one,
    })
    walk = finishPosition(walk, { outcome: 'declined', tokenId: one })

    expect(walk[0].outcome).toBe('declined')
    expect(walk[0].steps[0].status).toBe('declined')
  })

  // A confirmed step stays confirmed - a later failure elsewhere doesn't undo it.
  it('never rewrites a step that already confirmed', function () {
    let walk = recordStep(walkWith(one), {
      progress: progress(1),
      status: 'confirmed',
      tokenId: one,
      transactionHash: hash,
    })
    walk = recordStep(walk, {
      progress: progress(2),
      status: 'signing',
      tokenId: one,
    })
    walk = finishPosition(walk, { outcome: 'failed', tokenId: one })

    expect(walk[0].steps.map(s => s.status)).toEqual(['confirmed', 'failed'])
  })

  it('records that a position owed nothing without inventing a step', function () {
    const walk = finishPosition(walkWith(one), {
      outcome: 'nothing-owed',
      tokenId: one,
    })

    expect(walk[0]).toEqual({
      amount: BigInt(100),
      outcome: 'nothing-owed',
      steps: [],
      tokenId: one,
    })
  })
})

describe('settledSteps', function () {
  it('counts only what actually confirmed, across every position', function () {
    let walk = walkWith(one, two)
    walk = recordStep(walk, {
      progress: progress(1),
      status: 'confirmed',
      tokenId: one,
    })
    walk = recordStep(walk, {
      progress: progress(2),
      status: 'failed',
      tokenId: one,
    })
    walk = recordStep(walk, {
      progress: progress(1),
      status: 'confirmed',
      tokenId: two,
    })

    expect(settledSteps(walk)).toBe(2)
  })

  it('is zero before anything has been signed', function () {
    expect(settledSteps(walkWith(one, two))).toBe(0)
  })
})

describe('walkOutcome', function () {
  it('reports nothing-owed for a walk that settled nothing', function () {
    const walk = finishPosition(walkWith(one), {
      outcome: 'nothing-owed',
      tokenId: one,
    })
    expect(walkOutcome(walk)).toBe('nothing-owed')
  })

  it('reports paid once any step confirmed', function () {
    const walk = finishPosition(
      recordStep(walkWith(one, two), {
        progress: progress(1),
        status: 'confirmed',
        tokenId: one,
      }),
      { outcome: 'paid', tokenId: one },
    )
    expect(walkOutcome(walk)).toBe('paid')
  })

  // Paying two positions and failing on the third is not a success, and the steps that
  // did settle are still on screen.
  it('reports failed even when earlier positions were paid', function () {
    const paid = finishPosition(
      recordStep(walkWith(one, two), {
        progress: progress(1),
        status: 'confirmed',
        tokenId: one,
      }),
      { outcome: 'paid', tokenId: one },
    )
    const walk = finishPosition(paid, { outcome: 'failed', tokenId: two })
    expect(walkOutcome(walk)).toBe('failed')
  })

  // A declined prompt is a choice, not a fault.
  it('reports declined apart from failed', function () {
    const walk = finishPosition(walkWith(one), {
      outcome: 'declined',
      tokenId: one,
    })
    expect(walkOutcome(walk)).toBe('declined')
  })

  // Both happened; the one the holder has to act on wins.
  it('prefers failed over declined', function () {
    const declined = finishPosition(walkWith(one, two), {
      outcome: 'declined',
      tokenId: one,
    })
    const walk = finishPosition(declined, { outcome: 'failed', tokenId: two })
    expect(walkOutcome(walk)).toBe('failed')
  })
})
