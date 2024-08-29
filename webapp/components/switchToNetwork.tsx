import { useSwitchChain as useSwitchBtcChain } from 'btc-wallet/hooks/useSwitchChain'
import { useAccounts } from 'hooks/useAccounts'
import { useChain } from 'hooks/useChain'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useTranslations } from 'next-intl'
import { type RemoteChain } from 'types/chain'
import { isEvmNetwork } from 'utils/chain'
import { useSwitchChain as useSwitchEvmChain } from 'wagmi'

import { NotificationBox } from './notificationBox'

type Props = {
  selectedNetworkId: RemoteChain['id']
}

export const SwitchToNetwork = function ({ selectedNetworkId }: Props) {
  const { btcChainId, btcWalletStatus, evmChainId, evmWalletStatus } =
    useAccounts()
  const { switchChain: switchBtcChain } = useSwitchBtcChain()
  const { switchChain: switchEvmChain } = useSwitchEvmChain()

  const isConnectedToExpectedNetwork =
    useIsConnectedToExpectedNetwork(selectedNetworkId)

  const t = useTranslations('common')

  const walletTargetNetwork = useChain(selectedNetworkId)

  // status has different internal status to account for. If "chainId" is undefined, it is disconnected.
  // If defined, it is connected to anything (status may go through to reconnecting, which would briefly
  // show the notification box)
  const disconnected = btcChainId === undefined && evmChainId === undefined
  if (isConnectedToExpectedNetwork || disconnected) {
    return null
  }

  const expectedWalletIsEvm =
    !!walletTargetNetwork && isEvmNetwork(walletTargetNetwork)

  const isWalletConnected = () =>
    expectedWalletIsEvm
      ? evmWalletStatus === 'connected'
      : btcWalletStatus === 'connected'

  // In order to switch, users must first connect their wallet
  if (!isWalletConnected()) {
    return null
  }

  const switchToNetwork = function () {
    if (expectedWalletIsEvm) {
      switchEvmChain({ chainId: walletTargetNetwork.id })
    } else {
      // We need to use viem's Chain definition instead of rainbow-kit's definition of Chain
      // for this to work. But we still need to use rainbow-kit's Chain for showing the proper logos
      // when switching the chain when the feature toggle is off. Once we drop rainbow-kit for switching chains
      // and we use Chain from viem's in network.tsx, this will work automatically.
      // @ts-expect-error once we drop rainbow kit for switching chains, this will work automatically
      switchBtcChain({ chainId: walletTargetNetwork.id })
    }
  }

  return (
    <NotificationBox
      action={
        <button
          className="ml-auto cursor-pointer underline"
          onClick={switchToNetwork}
          type="button"
        >
          {t('connect-to-network', { network: walletTargetNetwork?.name })}
        </button>
      }
      text={t('wrong-network')}
    />
  )
}
