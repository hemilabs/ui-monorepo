import {
  getCooldownEnabled,
  getInstantWithdrawWhitelist,
} from '@vetro-protocol/earn/actions'
import { type Address, type Client } from 'viem'
import { describe, expect, it, vi } from 'vitest'

import { resolveIsInstant } from '../../../src/actions/public/resolveIsInstant'

vi.mock('@vetro-protocol/earn/actions', () => ({
  getCooldownEnabled: vi.fn(),
  getInstantWithdrawWhitelist: vi.fn(),
}))

const client = {} as Client
const stakingVault = '0x000000000000000000000000000000000000bEEf' as Address
const caller = '0x000000000000000000000000000000000000dEaD' as Address

describe('resolveIsInstant', function () {
  it('returns true when cooldown is disabled regardless of whitelist', async function () {
    vi.mocked(getCooldownEnabled).mockResolvedValue(false)
    vi.mocked(getInstantWithdrawWhitelist).mockResolvedValue(false)

    const result = await resolveIsInstant({ caller, client, stakingVault })

    expect(result).toBe(true)
  })

  it('returns true when cooldown is disabled and caller is whitelisted', async function () {
    vi.mocked(getCooldownEnabled).mockResolvedValue(false)
    vi.mocked(getInstantWithdrawWhitelist).mockResolvedValue(true)

    const result = await resolveIsInstant({ caller, client, stakingVault })

    expect(result).toBe(true)
  })

  it('returns true when caller is whitelisted even with cooldown enabled', async function () {
    vi.mocked(getCooldownEnabled).mockResolvedValue(true)
    vi.mocked(getInstantWithdrawWhitelist).mockResolvedValue(true)

    const result = await resolveIsInstant({ caller, client, stakingVault })

    expect(result).toBe(true)
  })

  it('returns false for the default cooldown path (enabled + not whitelisted)', async function () {
    vi.mocked(getCooldownEnabled).mockResolvedValue(true)
    vi.mocked(getInstantWithdrawWhitelist).mockResolvedValue(false)

    const result = await resolveIsInstant({ caller, client, stakingVault })

    expect(result).toBe(false)
  })
})
