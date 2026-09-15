import fetchPlusPlus from 'fetch-plus-plus'
import { type Address, type Chain } from 'viem'

// TODO(#2244): the endpoint does not compute the average lockup yet, and it
// answers with an empty reward list until rewards paid to date is implemented.
export type StakeStats = {
  averageLock?: number
  locksCount: number
  rewards: {
    address: Address
    amount: string
    chainId: Chain['id']
  }[]
  totalStaked: string
  walletsStaking: number
}

const stakeStatsUrl = `${import.meta.env.VITE_PORTAL_API_URL}/hemi-stake`

export const fetchStakeStats = () =>
  fetchPlusPlus(stakeStatsUrl, { method: 'GET' }) as Promise<StakeStats>
