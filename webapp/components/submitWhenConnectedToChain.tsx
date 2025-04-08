import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Button } from 'components/button'
import { useChain } from 'hooks/useChain'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { useTranslations } from 'next-intl'
import { RemoteChain } from 'types/chain'
import { useAccount } from 'wagmi'

type Props = {
  chainId: RemoteChain['id']
  submitButton: React.ReactNode
}

export const SubmitWhenConnectedToChain = function ({
  chainId,
  submitButton,
}: Props) {
  const t = useTranslations()
  const { status } = useAccount()
  const { switchChain } = useSwitchChain()
  const { openConnectModal } = useConnectModal()
  const connectedToChain = useIsConnectedToExpectedNetwork(chainId)
  const targetChain = useChain(chainId)

  if (status === 'connected') {
    return (
      <>
        {connectedToChain && submitButton}
        {!connectedToChain && (
          <Button onClick={() => switchChain({ chainId })} type="button">
            {t('common.connect-to-network', { network: targetChain?.name })}
          </Button>
        )}
      </>
    )
  }

  return (
    <Button onClick={openConnectModal} type="button">
      {t('connect-wallets.connect-evm-wallet')}
    </Button>
  )
}
