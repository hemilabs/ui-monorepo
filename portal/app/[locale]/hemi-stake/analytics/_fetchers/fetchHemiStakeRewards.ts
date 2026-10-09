import fetchPlusPlus from 'fetch-plus-plus'

import { type RewardsEpoch, type RewardsPeriod } from '../_utils/rewardsHistory'

const stakeRewardsUrl = `${import.meta.env.VITE_PORTAL_API_URL}/hemi-stake/rewards`

export const fetchHemiStakeRewards = (period: RewardsPeriod) =>
  fetchPlusPlus(`${stakeRewardsUrl}/${period}`, {
    method: 'GET',
  }) as Promise<RewardsEpoch[]>
