import { Button, ButtonSize } from 'components/button'
import { ButtonLoader } from 'components/buttonLoader'
import { useChain } from 'hooks/useChain'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { useTranslations } from 'next-intl'
import { lazy, Suspense } from 'react'
import { RemoteChain } from 'types/chain'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

const ConnectEvmWallet = lazy(() =>
  import('components/connectEvmWallet').then(mod => ({
    default: mod.ConnectEvmWallet,
  })),
)

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
    <Suspense fallback={<ButtonLoader />}>
      <ConnectEvmWallet
        buttonSize={submitButtonSize}
        text={connectWalletText}
      />
    </Suspense>
  )
}
