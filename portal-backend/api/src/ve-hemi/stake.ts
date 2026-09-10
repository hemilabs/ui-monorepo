import fetchJson from 'tiny-fetch-json'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { getTotalLocked } from 've-hemi-actions/actions'
import { hemi } from 'viem/chains'
// Disabled until we bump the eslint-plugin-node version
// See https://github.com/bloq/eslint-config-bloq/issues/64
// eslint-disable-next-line node/no-missing-import
import { totalSupply } from 'viem-erc20/actions'

import { getHemiClient } from '../hemiClient.ts'

const client = getHemiClient(hemi.id)

const veHemiAddress = getVeHemiContractAddress(hemi.id)

const holdersUrl = `https://explorer.hemi.xyz/api/v2/tokens/${veHemiAddress}/counters`

async function getWalletsStaking() {
  const { token_holders_count: tokenHoldersCount } = (await fetchJson(
    holdersUrl,
  )) as { token_holders_count: string }
  return Number(tokenHoldersCount)
}

export const getHemiStake = async function () {
  const [locksCount, totalLocked, walletsStaking] = await Promise.all([
    totalSupply(client, { address: veHemiAddress }),
    getTotalLocked(client),
    getWalletsStaking(),
  ])
  // TODO implement rewards and average lock
  // See https://github.com/hemilabs/ui-monorepo/issues/2244
  return {
    locksCount: Number(locksCount),
    rewards: [],
    totalStaked: totalLocked.toString(),
    walletsStaking,
  }
}
