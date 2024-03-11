import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useTranslations } from 'next-intl'
import { useAccount, useConfig, useSwitchChain } from 'wagmi'

import { NotificationBox } from './notificationBox'

type Props = {
  selectedNetwork: number
}

export const SwitchToNetwork = function ({ selectedNetwork }: Props) {
  const { chain } = useAccount()
  const { chains } = useConfig()
  const { switchChain } = useSwitchChain()
  const isConnectedToExpectedNetwork =
    useIsConnectedToExpectedNetwork(selectedNetwork)

  const t = useTranslations('common')

  if (!chain || isConnectedToExpectedNetwork) {
    return null
  }

  const walletTargetNetwork = chains.find(c => c.id === selectedNetwork)
  const switchToNetwork = () => switchChain({ chainId: selectedNetwork })
  return (
    <NotificationBox
      action={
        <button
          className="ml-auto cursor-pointer underline"
          onClick={switchToNetwork}
          type="button"
        >
          {t('switch-to-network', { network: walletTargetNetwork.name })}
        </button>
      }
      text={t('wrong-network')}
    />
  )
}
