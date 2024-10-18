import { useHemi } from 'hooks/useHemi'
import { useNetworks } from 'hooks/useNetworks'
import { useTranslations } from 'next-intl'
import { RemoteChain } from 'types/chain'

import { type TunnelState } from '../_hooks/useTunnelState'

import { NetworkSelector } from './networkSelector'
import { ToggleButton } from './ToggleButton'

type Props = {
  isRunningOperation: boolean
  toggleInput: () => void
  updateFromNetwork: (network: RemoteChain['id']) => void
  updateToNetwork: (network: RemoteChain['id']) => void
} & Pick<TunnelState, 'fromNetworkId' | 'toNetworkId'>

export const NetworkSelectors = function ({
  fromNetworkId,
  isRunningOperation,
  toggleInput,
  toNetworkId,
  updateFromNetwork,
  updateToNetwork,
}: Props) {
  const hemi = useHemi()
  const { networks } = useNetworks()
  const t = useTranslations('tunnel-page')

  return (
    <div className="flex items-end justify-between gap-x-3">
      <div className="w-[calc(50%-38px-0.75rem)] flex-grow">
        <NetworkSelector
          disabled={isRunningOperation}
          eventName="from network"
          label={t('form.from-network')}
          networkId={fromNetworkId}
          networks={networks.filter(chain => chain.id !== toNetworkId)}
          onSelectNetwork={updateFromNetwork}
          readonly={fromNetworkId === hemi.id}
        />
      </div>
      <ToggleButton disabled={isRunningOperation} toggle={toggleInput} />
      <div className="w-[calc(50%-38px-0.75rem)] flex-grow">
        <NetworkSelector
          disabled={isRunningOperation}
          eventName="to network"
          label={t('form.to-network')}
          networkId={toNetworkId}
          networks={networks.filter(chain => chain.id !== fromNetworkId)}
          onSelectNetwork={updateToNetwork}
          readonly={toNetworkId === hemi.id}
        />
      </div>
    </div>
  )
}
