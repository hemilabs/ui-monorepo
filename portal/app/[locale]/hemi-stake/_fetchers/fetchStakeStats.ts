import fetchPlusPlus from 'fetch-plus-plus'

export type StakeStats = {
  averageLock?: number
  locksCount: number
  totalStaked: string
  walletsStaking: number
}

const stakeStatsUrl = `${import.meta.env.VITE_PORTAL_API_URL}/hemi-stake`

export const fetchStakeStats = () =>
  fetchPlusPlus(stakeStatsUrl, { method: 'GET' }) as Promise<StakeStats>
