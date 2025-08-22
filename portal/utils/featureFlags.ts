import { hemi } from 'hemi-viem'
import { Chain } from 'viem'

const isTimestampEnabled = function (envValue: string | undefined) {
  const env = parseInt(envValue)

  if (!env || isNaN(env)) {
    return false
  }
  const now = Date.now()
  return now >= env
}

export const isGenesisDropEnabled = function (chainId: Chain['id']) {
  // next does not support dynamically accessing env variables
  // See https://nextjs.org/docs/pages/guides/environment-variables#bundling-environment-variables-for-the-browser
  const env =
    chainId === hemi.id
      ? process.env.NEXT_PUBLIC_GENESIS_DROP_ENABLE_HEMI_TIMESTAMP
      : process.env.NEXT_PUBLIC_GENESIS_DROP_ENABLE_HEMI_SEPOLIA_TIMESTAMP
  return isTimestampEnabled(env)
}

export const isStakeGovernanceEnabled = function (chainId: Chain['id']) {
  // Staking governance goes live (with the new nav bar) at TGE time
  // so here the feature flag time should match what TGE_TIME was defined
  // in the portal backend per chain, because that time is used for TGE
  // for the claim checker
  const env =
    chainId === hemi.id
      ? process.env.NEXT_PUBLIC_STAKE_GOVERNANCE_ENABLE_HEMI_TIMESTAMP
      : process.env.NEXT_PUBLIC_STAKE_GOVERNANCE_ENABLE_HEMI_SEPOLIA_TIMESTAMP
  return isTimestampEnabled(env)
}
