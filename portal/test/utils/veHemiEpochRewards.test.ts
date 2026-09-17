import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import {
  getEpochRewardsAddress,
  getEpochRewardsLensAddress,
  getRewardsGeneration,
  isAprSupported,
} from 'utils/veHemiEpochRewards'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const devnetAddress = '0x37AE825CB7267cE639F98ba6906ba1Ba50dDeD47'
const variable = 'VITE_VE_HEMI_EPOCH_REWARDS'
const lensVariable = 'VITE_VE_HEMI_EPOCH_REWARDS_LENS'
const lensAddress = '0xAB4B56FbF32FA8bed0f46E18E57C33390F320d16'

describe('getEpochRewardsAddress', function () {
  // Every case stubs the variable rather than inheriting it. Vite loads `.env.local`
  // into tests too, so a developer pointing their Portal at a devnet would otherwise
  // turn the no-override case red on their machine and green in CI.
  beforeEach(function () {
    vi.stubEnv(variable, undefined)
    vi.stubEnv(lensVariable, undefined)
  })

  afterEach(function () {
    vi.unstubAllEnvs()
  })

  // Nothing is deployed yet, so with no override every chain is still on the original
  // continuous-accrual contract. This is what a production build looks like.
  it('is undefined with no override', function () {
    expect(getEpochRewardsAddress(hemiTestnet.id)).toBeUndefined()
    expect(getEpochRewardsAddress(hemiMainnet.id)).toBeUndefined()
  })

  it('uses a developer override on testnet', function () {
    vi.stubEnv(variable, devnetAddress)

    expect(getEpochRewardsAddress(hemiTestnet.id)).toBe(devnetAddress)
  })

  // The override exists to point at a scenario devnet. Letting one reach mainnet would
  // not break the page - it would quietly price real positions against a mock.
  it('refuses an override on mainnet', function () {
    vi.stubEnv(variable, devnetAddress)

    expect(getEpochRewardsAddress(hemiMainnet.id)).toBeUndefined()
  })
})

describe('getEpochRewardsLensAddress', function () {
  beforeEach(function () {
    vi.stubEnv(lensVariable, undefined)
  })

  afterEach(function () {
    vi.unstubAllEnvs()
  })

  it('is undefined with no override', function () {
    expect(getEpochRewardsLensAddress(hemiTestnet.id)).toBeUndefined()
  })

  it('uses a developer override on testnet', function () {
    vi.stubEnv(lensVariable, lensAddress)

    expect(getEpochRewardsLensAddress(hemiTestnet.id)).toBe(lensAddress)
  })

  it('refuses an override on mainnet', function () {
    vi.stubEnv(lensVariable, lensAddress)

    expect(getEpochRewardsLensAddress(hemiMainnet.id)).toBeUndefined()
  })
})

describe('getRewardsGeneration', function () {
  beforeEach(function () {
    vi.stubEnv(variable, undefined)
    vi.stubEnv(lensVariable, undefined)
  })

  afterEach(function () {
    vi.unstubAllEnvs()
  })

  it('is continuous with nothing configured', function () {
    expect(getRewardsGeneration(hemiTestnet.id)).toBe('continuous')
  })

  it('is epoch once both the rewards contract and its Lens resolve', function () {
    vi.stubEnv(variable, devnetAddress)
    vi.stubEnv(lensVariable, lensAddress)

    expect(getRewardsGeneration(hemiTestnet.id)).toBe('epoch')
  })

  // Every epoch read goes through the Lens. Reporting `epoch` without one disables the
  // legacy reads and enables reads that can never run - and a disabled query stays
  // pending for ever, which renders as a skeleton that never resolves rather than as an
  // error. A half-configured chain must fall back to the path that works.
  it('stays continuous when only the rewards contract is configured', function () {
    vi.stubEnv(variable, devnetAddress)

    expect(getRewardsGeneration(hemiTestnet.id)).toBe('continuous')
  })

  it('stays continuous when only the Lens is configured', function () {
    vi.stubEnv(lensVariable, lensAddress)

    expect(getRewardsGeneration(hemiTestnet.id)).toBe('continuous')
  })

  it('is continuous on mainnet even with both overrides set', function () {
    vi.stubEnv(variable, devnetAddress)
    vi.stubEnv(lensVariable, lensAddress)

    expect(getRewardsGeneration(hemiMainnet.id)).toBe('continuous')
  })
})

describe('blank overrides', function () {
  beforeEach(function () {
    vi.stubEnv(variable, undefined)
    vi.stubEnv(lensVariable, undefined)
  })

  afterEach(function () {
    vi.unstubAllEnvs()
  })

  // A line left behind while switching devnets. Read naively it is non-nullish, so the
  // generation would resolve to `epoch` and aim every read at a zero-length address.
  it('treats a declared-but-empty variable as not configured', function () {
    vi.stubEnv(variable, '')
    vi.stubEnv(lensVariable, '')

    expect(getEpochRewardsAddress(hemiTestnet.id)).toBeUndefined()
    expect(getEpochRewardsLensAddress(hemiTestnet.id)).toBeUndefined()
    expect(getRewardsGeneration(hemiTestnet.id)).toBe('continuous')
    expect(isAprSupported(hemiTestnet.id)).toBe(true)
  })

  it('treats a whitespace-only variable as not configured', function () {
    vi.stubEnv(variable, '   ')
    vi.stubEnv(lensVariable, '   ')

    expect(getRewardsGeneration(hemiTestnet.id)).toBe('continuous')
  })

  // A typo'd value used to be cast straight to `Address`, switching the dashboard to
  // the epoch generation and aiming every read and write at something that is not a
  // contract.
  it('treats a malformed override as not configured', function () {
    vi.stubEnv(variable, '0xnot-an-address')
    vi.stubEnv(lensVariable, devnetAddress.slice(0, 20))

    expect(getEpochRewardsAddress(hemiTestnet.id)).toBeUndefined()
    expect(getEpochRewardsLensAddress(hemiTestnet.id)).toBeUndefined()
    expect(getRewardsGeneration(hemiTestnet.id)).toBe('continuous')
  })

  it('trims a padded address rather than refusing it', function () {
    vi.stubEnv(variable, ` ${devnetAddress} `)
    vi.stubEnv(lensVariable, ` ${lensAddress} `)

    expect(getEpochRewardsAddress(hemiTestnet.id)).toBe(devnetAddress)
    expect(getEpochRewardsLensAddress(hemiTestnet.id)).toBe(lensAddress)
    expect(getRewardsGeneration(hemiTestnet.id)).toBe('epoch')
  })
})

describe('isAprSupported', function () {
  beforeEach(function () {
    vi.stubEnv(variable, undefined)
    vi.stubEnv(lensVariable, undefined)
  })

  afterEach(function () {
    vi.unstubAllEnvs()
  })

  it('supports the original contract, which the figure describes', function () {
    expect(isAprSupported(hemiTestnet.id)).toBe(true)
    expect(isAprSupported(hemiMainnet.id)).toBe(true)
  })

  // The APR arithmetic assumes one continuously accruing pot shared by every position.
  // The epoch contract has per-epoch, per-class pots, so the same series produces a
  // confident wrong percentage rather than an approximation.
  it('does not support the epoch contract', function () {
    vi.stubEnv(variable, devnetAddress)
    vi.stubEnv(lensVariable, lensAddress)

    expect(isAprSupported(hemiTestnet.id)).toBe(false)
  })

  it('still supports a half-configured chain, which stays on the original', function () {
    vi.stubEnv(variable, devnetAddress)

    expect(isAprSupported(hemiTestnet.id)).toBe(true)
  })

  // Mainnet ignores the overrides entirely, so a developer running a scenario devnet
  // can never blank the real APR figure.
  it('supports mainnet whatever the overrides say', function () {
    vi.stubEnv(variable, devnetAddress)
    vi.stubEnv(lensVariable, lensAddress)

    expect(isAprSupported(hemiMainnet.id)).toBe(true)
  })

  it('agrees with the generation it is derived from', function () {
    vi.stubEnv(variable, devnetAddress)
    vi.stubEnv(lensVariable, lensAddress)

    expect(isAprSupported(hemiTestnet.id)).toBe(
      getRewardsGeneration(hemiTestnet.id) === 'continuous',
    )
  })
})
