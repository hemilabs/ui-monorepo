import { Button, ButtonSize } from 'components/button'
import { LazyConnectEvmWallet } from 'components/lazyConnectEvmWallet'
import { useChain } from 'hooks/useChain'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { RemoteChain } from 'types/chain'
import { useTranslations } from 'use-intl'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

type Props = {
  chainId: RemoteChain['id']
  connectWalletText?: string
  submitButton: React.ReactNode
  submitButtonSize?: ButtonSize
}

export const SubmitWhenConnectedToChain = function ({
  chainId,
  connectWalletText,
  submitButton,
  submitButtonSize = 'xLarge',
}: Props) {
  const t = useTranslations()
  const { status } = useAccount()
  const { switchChain } = useSwitchChain()
  const connectedToChain = useIsConnectedToExpectedNetwork(chainId)
  // we're setting the target chain, so it's a chain known to us and defined
  const targetChain = useChain(chainId)!

  if (walletIsConnected(status)) {
    return (
      <>
        {connectedToChain && submitButton}
        {!connectedToChain && (
          <Button
            onClick={() => switchChain({ chainId })}
            size={submitButtonSize}
            type="button"
          >
            {t('common.connect-to-network', { network: targetChain.name })}
          </Button>
        )}
      </>
    )
  }

  return (
    <LazyConnectEvmWallet
      buttonSize={submitButtonSize}
      text={connectWalletText}
    />
  )
}
