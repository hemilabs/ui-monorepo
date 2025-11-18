import {
  calculateApr,
  calculateRewardWeightDecay,
} from 'app/[locale]/staking-dashboard/_utils/aprCalculations'
import { secondsPerEpoch } from 'app/[locale]/staking-dashboard/_utils/lockCreationTimes'
import { describe, expect, it } from 'vitest'

describe('calculateRewardWeightDecay', function () {
  it('should return 61 values', function () {
    const result = calculateRewardWeightDecay({
      currentBalance: BigInt('100000000000000000000'), // 100 veHEMI
      currentTimestamp: BigInt(1731772800),
      lockEndTimestamp: BigInt(1731772800 + 30 * secondsPerEpoch), // 30 epochs from now
    })

    expect(result).toHaveLength(61)
  })

  it('should start with current balance at epoch 0', function () {
    const currentBalance = BigInt('100000000000000000000') // 100 veHEMI

    const result = calculateRewardWeightDecay({
      currentBalance,
      currentTimestamp: BigInt(1731772800),
      lockEndTimestamp: BigInt(1731772800 + 30 * secondsPerEpoch),
    })

    // First epoch should equal current balance
    expect(result[0]).toBe(currentBalance)
  })

  it('should decay linearly to zero at unlock', function () {
    const currentBalance = BigInt('100000000000000000000') // 100 veHEMI
    const epochsUntilUnlock = 30

    const result = calculateRewardWeightDecay({
      currentBalance,
      currentTimestamp: BigInt(1731772800),
      lockEndTimestamp: BigInt(
        1731772800 + epochsUntilUnlock * secondsPerEpoch,
      ),
    })

    // Check linear decay
    expect(result[0]).toBe(currentBalance) // 100% at epoch 0
    expect(result[10]).toBe((currentBalance * BigInt(20)) / BigInt(30)) // 66.67% at epoch 10
    expect(result[20]).toBe((currentBalance * BigInt(10)) / BigInt(30)) // 33.33% at epoch 20
    expect(result[29]).toBe((currentBalance * BigInt(1)) / BigInt(30)) // 3.33% at epoch 29
    expect(result[30]).toBe(BigInt(0)) // 0% at unlock (epoch 30)
  })

  it('should have zeros after unlock date until end of 61 elements', function () {
    const epochsUntilUnlock = 20

    const result = calculateRewardWeightDecay({
      currentBalance: BigInt('100000000000000000000'),
      currentTimestamp: BigInt(1731772800),
      lockEndTimestamp: BigInt(
        1731772800 + epochsUntilUnlock * secondsPerEpoch,
      ),
    })

    // All epochs from unlock onwards should be zero
    for (let i = epochsUntilUnlock; i < 61; i++) {
      expect(result[i]).toBe(BigInt(0))
    }
  })

  it('should handle position that unlocks before 1 year (366 days)', function () {
    const epochsUntilUnlock = 15 // Unlocks at epoch 15 (90 days)

    const result = calculateRewardWeightDecay({
      currentBalance: BigInt('50000000000000000000'), // 50 veHEMI
      currentTimestamp: BigInt(1731772800),
      lockEndTimestamp: BigInt(
        1731772800 + epochsUntilUnlock * secondsPerEpoch,
      ),
    })

    // Should have values for epochs 0-14, zeros for 15-60
    expect(result[0]).toBeGreaterThan(BigInt(0))
    expect(result[14]).toBeGreaterThan(BigInt(0))
    expect(result[15]).toBe(BigInt(0))
    expect(result[60]).toBe(BigInt(0))

    // Count zeros - should be 46 (61 - 15)
    const zeroCount = result.filter(weight => weight === BigInt(0)).length
    expect(zeroCount).toBe(46)
  })

  it('should handle position that unlocks after 1 year (no zeros)', function () {
    const epochsUntilUnlock = 100 // Unlocks after 600 days (beyond 366)

    const result = calculateRewardWeightDecay({
      currentBalance: BigInt('100000000000000000000'),
      currentTimestamp: BigInt(1731772800),
      lockEndTimestamp: BigInt(
        1731772800 + epochsUntilUnlock * secondsPerEpoch,
      ),
    })

    // All 61 epochs should have positive reward weight
    for (let i = 0; i < 61; i++) {
      expect(result[i]).toBeGreaterThan(BigInt(0))
    }

    // Should decay gradually but never reach zero in the 61 epochs
    expect(result[0]).toBeGreaterThan(result[30])
    expect(result[30]).toBeGreaterThan(result[60])
    expect(result[60]).toBeGreaterThan(BigInt(0))
  })

  it('should handle position already unlocked (all zeros)', function () {
    const result = calculateRewardWeightDecay({
      currentBalance: BigInt('100000000000000000000'),
      currentTimestamp: BigInt(1731772800),
      lockEndTimestamp: BigInt(1731772800 - 1000), // Already unlocked
    })

    // All epochs should be zero
    for (let i = 0; i < 61; i++) {
      expect(result[i]).toBe(BigInt(0))
    }
  })

  it('should handle very small balance without precision loss', function () {
    const smallBalance = BigInt('1000') // Very small amount

    const result = calculateRewardWeightDecay({
      currentBalance: smallBalance,
      currentTimestamp: BigInt(1731772800),
      lockEndTimestamp: BigInt(1731772800 + 30 * secondsPerEpoch),
    })

    // Should still calculate values (not all zeros due to rounding)
    expect(result[0]).toBe(smallBalance)
    expect(result[15]).toBeGreaterThan(BigInt(0))
  })

  it('should handle position unlocking exactly at epoch boundary', function () {
    const epochsUntilUnlock = 10

    const result = calculateRewardWeightDecay({
      currentBalance: BigInt('100000000000000000000'),
      currentTimestamp: BigInt(1731772800),
      lockEndTimestamp: BigInt(
        1731772800 + epochsUntilUnlock * secondsPerEpoch,
      ), // Exactly 10 epochs
    })

    // Epoch 9 should have value, epoch 10 should be zero
    expect(result[9]).toBeGreaterThan(BigInt(0))
    expect(result[10]).toBe(BigInt(0))
  })
})

describe('calculateApr', function () {
  const DAILY_REWARDS = 8333

  const totalSupplyPerEpoch = [
    11322220, 11115402, 10908662, 10702202, 10497204, 10293065, 10088943,
    9884831, 9680801, 9480645, 9282703, 9084989, 8887363, 8689749, 8492143,
    8294577, 8097046, 7899532, 7699575, 7708176, 7652489, 7598632, 7546765,
    7497867, 7451352, 7404896, 7359364, 7315207, 7271102, 7227094, 7183332,
    7139786, 7096240, 7052695, 7009150, 6965606, 6922063, 6878520, 6834978,
    6791437, 6747898, 6704359, 6660819, 6617280, 6573741, 6530202, 6486663,
    6443126, 6399591, 6356066, 6312541, 6269020, 6225499, 6181977, 6138456,
    6094935, 6051415, 6007894, 5964374, 5920852, 5877330,
  ]

  // Convert to rewards per veHEMI (dailyRewards / totalSupply)
  const MOCK_REWARDS_PER_VEHEMI = totalSupplyPerEpoch.map(
    supply => DAILY_REWARDS / supply,
  )

  it('should calculate APR correctly for position unlocking after 1 year', function () {
    const currentBalance = BigInt('100000000000000000000') // 100 veHEMI
    const lockedAmount = BigInt('100000000000000000000') // 100 HEMI
    const epochsUntilUnlock = 100 // Unlocks after 61 epochs

    const rewardWeightDecay = calculateRewardWeightDecay({
      currentBalance,
      currentTimestamp: BigInt(1731772800),
      lockEndTimestamp: BigInt(
        1731772800 + epochsUntilUnlock * secondsPerEpoch,
      ),
    })

    const apr = calculateApr({
      lockedAmount,
      rewardsPerVeHEMI: MOCK_REWARDS_PER_VEHEMI,
      rewardWeightDecay,
    })

    // APR should be > 0
    expect(apr).toBeGreaterThan(0)
    // Should be a reasonable percentage (not NaN or Infinity)
    expect(apr).toBeLessThan(1000)
  })

  it('should calculate APR correctly for position unlocking before 1 year', function () {
    const currentBalance = BigInt('50000000000000000000') // 50 veHEMI
    const lockedAmount = BigInt('50000000000000000000') // 50 HEMI
    const epochsUntilUnlock = 30 // Unlocks at epoch 30 (180 days)

    const rewardWeightDecay = calculateRewardWeightDecay({
      currentBalance,
      currentTimestamp: BigInt(1731772800),
      lockEndTimestamp: BigInt(
        1731772800 + epochsUntilUnlock * secondsPerEpoch,
      ),
    })

    const apr = calculateApr({
      lockedAmount,
      rewardsPerVeHEMI: MOCK_REWARDS_PER_VEHEMI,
      rewardWeightDecay,
    })

    // Should still calculate valid APR
    expect(apr).toBeGreaterThan(0)
    // APR should be lower than full-year lock due to shorter duration
    expect(apr).toBeLessThan(100)
  })

  it('should return 0 when locked amount is 0', function () {
    const rewardWeightDecay = Array(61).fill(BigInt(0))

    const apr = calculateApr({
      lockedAmount: BigInt(0),
      rewardsPerVeHEMI: MOCK_REWARDS_PER_VEHEMI,
      rewardWeightDecay,
    })

    expect(apr).toBe(0)
  })

  it('should return 0 when reward weight is all zeros', function () {
    const rewardWeightDecay = Array(61).fill(BigInt(0))
    const lockedAmount = BigInt('100000000000000000000')

    const apr = calculateApr({
      lockedAmount,
      rewardsPerVeHEMI: MOCK_REWARDS_PER_VEHEMI,
      rewardWeightDecay,
    })

    expect(apr).toBe(0)
  })

  it('should throw error if rewardsPerVeHEMI does not have 61 values', function () {
    const rewardWeightDecay = Array(61).fill(BigInt('100000000000000000000'))
    const lockedAmount = BigInt('100000000000000000000')

    expect(() =>
      calculateApr({
        lockedAmount,
        rewardsPerVeHEMI: Array(50).fill(0.001), // Only 50 values
        rewardWeightDecay,
      }),
    ).toThrow('Expected 61 rewards values, got 50')
  })

  it('should throw error if rewardWeightDecay does not have 61 values', function () {
    const lockedAmount = BigInt('100000000000000000000')

    expect(() =>
      calculateApr({
        lockedAmount,
        rewardsPerVeHEMI: MOCK_REWARDS_PER_VEHEMI,
        rewardWeightDecay: Array(30).fill(BigInt('100000000000000000000')), // Only 30 values
      }),
    ).toThrow('Expected 61 reward weight values, got 30')
  })

  it('should handle position with decreasing rewards per epoch', function () {
    // Already using decreasing rewards from MOCK_REWARDS_PER_VEHEMI
    const currentBalance = BigInt('100000000000000000000')
    const lockedAmount = BigInt('100000000000000000000')

    const rewardWeightDecay = calculateRewardWeightDecay({
      currentBalance,
      currentTimestamp: BigInt(1731772800),
      lockEndTimestamp: BigInt(1731772800 + 100 * secondsPerEpoch),
    })

    const apr = calculateApr({
      lockedAmount,
      rewardsPerVeHEMI: MOCK_REWARDS_PER_VEHEMI,
      rewardWeightDecay,
    })

    expect(apr).toBeGreaterThan(0)
    expect(apr).toBeLessThan(1000)
  })

  it('should calculate correct dot product', function () {
    // Simple test case: constant rewards and reward weight
    const constantRewards = Array(61).fill(0.001) // 0.001 per veHEMI
    const rewardWeightDecay = Array(61).fill(BigInt('1000000000000000000')) // 1 veHEMI constant
    const lockedAmount = BigInt('1000000000000000000') // 1 HEMI locked

    const apr = calculateApr({
      lockedAmount,
      rewardsPerVeHEMI: constantRewards,
      rewardWeightDecay,
    })

    // Expected: 61 epochs × 1 veHEMI × 0.001 reward/veHEMI = 0.061 rewards
    // APR = (0.061 / 1) × 100 = 6.1%
    expect(apr).toBeCloseTo(6.1, 1)
  })

  it('should handle very small amounts without precision loss', function () {
    const smallBalance = BigInt('1000000000000000') // 0.001 veHEMI
    const smallLocked = BigInt('1000000000000000') // 0.001 HEMI

    const rewardWeightDecay = calculateRewardWeightDecay({
      currentBalance: smallBalance,
      currentTimestamp: BigInt(1731772800),
      lockEndTimestamp: BigInt(1731772800 + 30 * secondsPerEpoch),
    })

    const apr = calculateApr({
      lockedAmount: smallLocked,
      rewardsPerVeHEMI: MOCK_REWARDS_PER_VEHEMI,
      rewardWeightDecay,
    })

    // Should calculate valid APR even for small amounts
    expect(apr).toBeGreaterThanOrEqual(0)
    expect(Number.isFinite(apr)).toBe(true)
  })

  it('should handle realistic data from mainnet', function () {
    // Real data from tokenId 514
    const currentBalance = BigInt('9245189085900942600') // 9.24 veHEMI
    const lockedAmount = BigInt('9674533770000000000') // 9.67 HEMI
    const epochsUntilUnlock = 291 // ~4 years

    const rewardWeightDecay = calculateRewardWeightDecay({
      currentBalance,
      currentTimestamp: BigInt(1731772800),
      lockEndTimestamp: BigInt(
        1731772800 + epochsUntilUnlock * secondsPerEpoch,
      ),
    })

    const apr = calculateApr({
      lockedAmount,
      rewardsPerVeHEMI: MOCK_REWARDS_PER_VEHEMI,
      rewardWeightDecay,
    })

    // Should calculate a reasonable APR (between 0-100%)
    expect(apr).toBeGreaterThan(0)
    expect(apr).toBeLessThan(100)
  })
})
