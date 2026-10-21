import { fetchPositionClasses } from 'app/[locale]/hemi-stake/estimator/_fetchers/fetchPositionClasses'
import { getTransferableAfter } from 've-hemi-actions/actions'
import { describe, expect, it, vi } from 'vitest'

vi.mock('ve-hemi-actions/actions')

const client = {}
const instant = BigInt(1849275360)

const position = (
  tokenId,
  { forfeitable = false, transferable = false } = {},
) => ({
  amount: BigInt(1),
  forfeitable,
  tokenId: BigInt(tokenId),
  transferable,
})

describe('fetchPositionClasses', function () {
  it('reads nothing for a position that is already transferable', async function () {
    const classes = await fetchPositionClasses(client, {
      positions: [position(1, { transferable: true })],
    })

    expect(getTransferableAfter).not.toHaveBeenCalled()
    expect(classes).toEqual({
      '1': { forfeitable: false, transferableAfter: 0 },
    })
  })

  it('keeps the forfeitable flag the subgraph already carries', async function () {
    vi.mocked(getTransferableAfter).mockResolvedValue([instant])

    const classes = await fetchPositionClasses(client, {
      positions: [position(7, { forfeitable: true })],
    })

    expect(classes).toEqual({
      '7': { forfeitable: true, transferableAfter: 1849275360 },
    })
  })

  it('hands the instant over as a number', async function () {
    vi.mocked(getTransferableAfter).mockResolvedValue([instant])

    const classes = await fetchPositionClasses(client, {
      positions: [position(7)],
    })

    expect(typeof classes['7'].transferableAfter).toBe('number')
  })

  it('asks for every pending position in a single call', async function () {
    vi.mocked(getTransferableAfter).mockResolvedValue([instant, instant])

    await fetchPositionClasses(client, {
      positions: [
        position(1, { transferable: true }),
        position(2),
        position(3, { transferable: true }),
        position(4),
      ],
    })

    expect(getTransferableAfter).toHaveBeenCalledTimes(1)
    expect(getTransferableAfter).toHaveBeenCalledWith(client, [
      BigInt(2),
      BigInt(4),
    ])
  })

  it('lines each instant up with the position that asked for it', async function () {
    vi.mocked(getTransferableAfter).mockResolvedValue([
      BigInt(100),
      BigInt(200),
    ])

    const classes = await fetchPositionClasses(client, {
      positions: [
        position(2),
        position(1, { transferable: true }),
        position(4),
      ],
    })

    expect(classes['2'].transferableAfter).toBe(100)
    expect(classes['4'].transferableAfter).toBe(200)
  })
})
