import { zeroAddress } from 'viem'
import { readContract } from 'viem/actions'
import { describe, expect, it, vi } from 'vitest'

import { getEpochStreams } from '../../../actions/public/getEpochStreams'
import * as constants from '../../../constants'
import { veHemiEpochRewardsLensAbi } from '../../../lensAbi'

vi.mock('viem/actions')

const hemiToken = '0x99e3dE3817F6081B2568208337ef83295b7f591D'
const hemiBtcToken = '0xAA40c0c7644e0b2B224509571e10ad20d9C4ef28'

const baselineLabel =
  '0x626173656c696e65000000000000000000000000000000000000000000000000'
const feesLabel =
  '0x7472616e73616374696f6e2d6665657300000000000000000000000000000000'

const registry = [
  {
    closed: false,
    funded: BigInt('5796366660000000000000000'),
    fundedByClass: [
      BigInt('4166666660000000000000000'),
      BigInt('1370000000000000000000000'),
      BigInt('259700000000000000000000'),
    ],
    label: baselineLabel,
    streamId: BigInt(1),
    token: hemiToken,
  },
  {
    closed: false,
    funded: BigInt(0),
    fundedByClass: [BigInt(0), BigInt(0), BigInt(0)],
    label: feesLabel,
    streamId: BigInt(2),
    token: hemiBtcToken,
  },
  {
    closed: false,
    funded: BigInt('15000000000000000000000'),
    fundedByClass: [BigInt('15000000000000000000000'), BigInt(0), BigInt(0)],
    label: feesLabel,
    streamId: BigInt(3),
    token: hemiToken,
  },
]

describe('getEpochStreams', function () {
  const mockLensAddress = '0x1234567890123456789012345678901234567890'
  const options = { epoch: 3403, token: hemiToken }

  it('should return only the streams funded in the token asked for', async function () {
    const uniqueChainId = 9001
    const mockClient = { chain: { id: uniqueChainId } }

    vi.spyOn(
      constants,
      'getVeHemiEpochRewardsLensContractAddress',
    ).mockReturnValue(mockLensAddress)
    vi.mocked(readContract).mockResolvedValueOnce(registry)

    const result = await getEpochStreams(mockClient, options)

    expect(result).toEqual([registry[0], registry[2]])
    expect(
      constants.getVeHemiEpochRewardsLensContractAddress,
    ).toHaveBeenCalledWith(uniqueChainId)
    expect(readContract).toHaveBeenCalledWith(mockClient, {
      abi: veHemiEpochRewardsLensAbi,
      address: mockLensAddress,
      args: [options.epoch, options.token],
      functionName: 'streamsForEpoch',
    })
  })

  it('should leave out the row another token funded, sharing a label', async function () {
    const mockClient = { chain: { id: 9001 } }

    vi.spyOn(
      constants,
      'getVeHemiEpochRewardsLensContractAddress',
    ).mockReturnValue(mockLensAddress)
    vi.mocked(readContract).mockResolvedValueOnce(registry)

    const result = await getEpochStreams(mockClient, options)
    const fees = result.filter(stream => stream.label === feesLabel)

    expect(fees).toHaveLength(1)
    expect(fees[0].streamId).toBe(BigInt(3))
  })

  it('should come back empty for a token that funded nothing', async function () {
    const mockClient = { chain: { id: 9001 } }

    vi.spyOn(
      constants,
      'getVeHemiEpochRewardsLensContractAddress',
    ).mockReturnValue(mockLensAddress)
    vi.mocked(readContract).mockResolvedValueOnce(registry)

    const result = await getEpochStreams(mockClient, {
      ...options,
      token: '0x0000000000000000000000000000000000000001',
    })

    expect(result).toEqual([])
  })

  it('should throw error when client chain is not defined', async function () {
    await expect(
      getEpochStreams({ chain: undefined }, options),
    ).rejects.toThrow('Client chain is not defined')

    expect(readContract).not.toHaveBeenCalled()
  })

  it('should throw on an invalid token address', async function () {
    const mockClient = { chain: { id: 9001 } }

    await expect(
      getEpochStreams(mockClient, { ...options, token: 'not-an-address' }),
    ).rejects.toThrow('Invalid token address')

    expect(readContract).not.toHaveBeenCalled()
  })

  it('should throw on the zero address', async function () {
    const mockClient = { chain: { id: 9001 } }

    await expect(
      getEpochStreams(mockClient, { ...options, token: zeroAddress }),
    ).rejects.toThrow('Invalid token address')

    expect(readContract).not.toHaveBeenCalled()
  })

  it('should throw on a negative epoch', async function () {
    const mockClient = { chain: { id: 9001 } }

    await expect(
      getEpochStreams(mockClient, { ...options, epoch: -1 }),
    ).rejects.toThrow('Invalid epoch')

    expect(readContract).not.toHaveBeenCalled()
  })

  it('should throw on an epoch that is not a whole number', async function () {
    const mockClient = { chain: { id: 9001 } }

    await expect(
      getEpochStreams(mockClient, { ...options, epoch: 3403.5 }),
    ).rejects.toThrow('Invalid epoch')

    expect(readContract).not.toHaveBeenCalled()
  })
})
