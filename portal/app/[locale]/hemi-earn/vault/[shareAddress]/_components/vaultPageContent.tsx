import { useNetworkType } from 'hooks/useNetworkType'
import { useRouter } from 'i18n/navigation'
import { useEffect } from 'react'
import Skeleton from 'react-loading-skeleton'
import { queryStringObjectToString } from 'utils/url'
import { type Address } from 'viem'

import { OperatorBanner } from '../../../_components/operatorDisclosure'
import { useEarnVaults } from '../../../_hooks/useEarnVaults'
import { findVaultByShare } from '../../../_utils/vaults'
import { VaultFormProvider } from '../_context/vaultFormContext'

import { Composition } from './composition'
import { HistoricalMetrics } from './historicalMetrics'
import { VaultForm } from './vaultForm'
import { VaultInfoCards } from './vaultInfoCards'
import { VaultNavigation } from './vaultNavigation'

type Props = {
  shareAddress: string
}

export const VaultPageContent = function ({ shareAddress }: Props) {
  const router = useRouter()
  const [networkType] = useNetworkType()
  const { data: vaults } = useEarnVaults()

  const vault = vaults
    ? findVaultByShare(vaults, shareAddress as Address)
    : undefined

  const areVaultsLoaded = vaults !== undefined

  useEffect(
    function redirectIfNotFound() {
      if (areVaultsLoaded && !vault) {
        router.push(`/hemi-earn${queryStringObjectToString({ networkType })}`)
      }
    },
    [areVaultsLoaded, networkType, vault, router],
  )

  return (
    <>
      {vault ? (
        <VaultNavigation vault={vault} />
      ) : (
        <Skeleton className="h-7 w-48 rounded-md" />
      )}
      <div className="mt-6">
        <OperatorBanner />
      </div>
      {vault ? (
        <VaultFormProvider vault={vault}>
          <div className="mt-6 flex flex-col gap-3 md:gap-5 lg:flex-row">
            <div className="order-2 flex flex-col gap-4 md:gap-5 lg:order-1 lg:basis-3/5">
              <VaultInfoCards vault={vault} />
              <HistoricalMetrics
                peggedToken={vault.peggedToken}
                shareToken={vault.shareToken}
                stakingVault={vault.stakingVault}
              />
              <Composition
                chainId={vault.shareToken.chainId}
                shareAddress={vault.shareAddress}
              />
            </div>
            <div className="order-1 lg:sticky lg:top-4 lg:order-2 lg:basis-2/5 lg:self-start">
              <VaultForm />
            </div>
          </div>
        </VaultFormProvider>
      ) : (
        <div className="mt-6 flex gap-4">
          <Skeleton className="h-24 rounded-xl" containerClassName="flex-1" />
          <Skeleton className="h-24 rounded-xl" containerClassName="flex-1" />
        </div>
      )}
    </>
  )
}
