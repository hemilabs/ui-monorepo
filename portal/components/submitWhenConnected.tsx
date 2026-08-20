import { ButtonSize } from 'components/button'
import { ButtonLoader } from 'components/buttonLoader'
import { lazy, ReactNode, Suspense } from 'react'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

const ConnectEvmWallet = lazy(() =>
  import('components/connectEvmWallet').then(mod => ({
    default: mod.ConnectEvmWallet,
  })),
)

type Props = {
  connectWalletText?: string
  submitButton: ReactNode
  submitButtonSize?: ButtonSize
}

export const SubmitWhenConnected = function ({
  connectWalletText,
  submitButton,
  submitButtonSize = 'xLarge',
}: Props) {
  const { status } = useAccount()

  if (walletIsConnected(status)) {
    return <>{submitButton}</>
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
