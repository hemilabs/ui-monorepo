import fetchJson from 'tiny-fetch-json'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { getTotalLocked } from 've-hemi-actions/actions'
import { hemi } from 'viem/chains'
// Disabled until we bump the eslint-plugin-node version
// See https://github.com/bloq/eslint-config-bloq/issues/64
// eslint-disable-next-line node/no-missing-import
import { totalSupply } from 'viem-erc20/actions'

import { getHemiClient } from '../hemiClient.ts'
import { getLockStats } from '../subgraphs/subgraph.ts'

const client = getHemiClient(hemi.id)

const veHemiAddress = getVeHemiContractAddress(hemi.id)

const holdersUrl = `https://explorer.hemi.xyz/api/v2/tokens/${veHemiAddress}/counters`

async function getWalletsStaking() {
  const { token_holders_count: tokenHoldersCount } = (await fetchJson(
    holdersUrl,
  )) as { token_holders_count: string }
  return Number(tokenHoldersCount)
}

async function getAverageLock() {
  const lockStats = await getLockStats()
  if (!lockStats?.activeLocks) {
    return 0
  }
  return Math.round(Number(lockStats.totalLockDuration) / lockStats.activeLocks)
}

export const getHemiStake = async function () {
  const [averageLock, locksCount, totalLocked, walletsStaking] =
    await Promise.all([
      getAverageLock(),
      totalSupply(client, { address: veHemiAddress }),
      getTotalLocked(client),
      getWalletsStaking(),
    ])
  // TODO implement rewards
  // See https://github.com/hemilabs/ui-monorepo/issues/2244
  return {
    averageLock,
    locksCount: Number(locksCount),
    rewards: [],
    totalStaked: totalLocked.toString(),
    walletsStaking,
  }
}
