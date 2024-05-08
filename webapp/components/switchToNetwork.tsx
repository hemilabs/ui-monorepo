import { useChain } from 'hooks/useChain'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useTranslations } from 'next-intl'
import { Chain } from 'viem'
import { useAccount, useSwitchChain } from 'wagmi'

import { NotificationBox } from './notificationBox'

type Props = {
  selectedNetwork: Chain['id']
}

export const SwitchToNetwork = function ({ selectedNetwork }: Props) {
  const { status } = useAccount()
  const { switchChain } = useSwitchChain()
  const isConnectedToExpectedNetwork =
    useIsConnectedToExpectedNetwork(selectedNetwork)

  const t = useTranslations('common')

  const walletTargetNetwork = useChain(selectedNetwork)

  if (isConnectedToExpectedNetwork || status !== 'connected') {
    return null
  }

  const switchToNetwork = () => switchChain({ chainId: selectedNetwork })
  return (
    <NotificationBox
      action={
        <button
          className="ml-auto cursor-pointer underline"
          onClick={switchToNetwork}
          type="button"
        >
          {t('connect-to-network', { network: walletTargetNetwork.name })}
        </button>
      }
      text={t('wrong-network')}
    />
  )
}
