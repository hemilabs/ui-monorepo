import { useQuery } from '@tanstack/react-query'
import { getBtcStakingVaultContractAddress } from 'hemi-btc-staking-actions'
import {
  getStrategies,
  getStrategyConfig,
} from 'hemi-btc-staking-actions/actions'
import { useHemi } from 'hooks/useHemi'
import { useHemiClient } from 'hooks/useHemiClient'
import { useTranslations } from 'next-intl'
import { getStrategyName } from 'vault-strategies/actions'
import { zeroAddress } from 'viem'

import type { Strategy, Vault } from '../_types'
import { calculatePoolBufferWeight } from '../_utils'

export const useTableData = function () {
  const hemi = useHemi()
  const hemiClient = useHemiClient()
  const t = useTranslations('bitcoin-yield')

  const poolBufferStrategyName = t('pool-buffer-strategy')

  const vaultAddress = getBtcStakingVaultContractAddress(hemi.id)

  return useQuery({
    // purposefully define strategies as undefined, allowing us to check if it loaded or not
    // but allowing the pool address to render immediately
    initialData: [{ address: vaultAddress, strategies: undefined }] as Vault[],
    async queryFn() {
      const queryStrategies = async function () {
        const strategyAddresses = await getStrategies(hemiClient)

        return Promise.all(
          strategyAddresses.map(async function (strategyAddress) {
            const [weight, name] = await Promise.all([
              getStrategyConfig(hemiClient, {
                address: strategyAddress,
              }).then(({ debtRatio }) => debtRatio),
              getStrategyName(hemiClient, { address: strategyAddress }),
            ])

            return {
              address: strategyAddress,
              name,
              weight,
            }
          }),
        )
      }

      const strategies = await queryStrategies()
        // if any error, return an empty list of strategies
        // The entire pool allocation goes to the buffer pool
        .catch(() => [] as Strategy[])

      // Add the pool buffer to the list of strategies
      strategies.push({
        address: zeroAddress,
        name: poolBufferStrategyName,
        weight: calculatePoolBufferWeight(strategies),
      })
      return [{ address: vaultAddress, strategies }] satisfies Vault[]
    },
    queryKey: ['bitcoin-yield', 'table-data', hemi.id, poolBufferStrategyName],
  })
}
