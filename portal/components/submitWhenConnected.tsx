import { ButtonSize } from 'components/button'
import { LazyConnectEvmWallet } from 'components/lazyConnectEvmWallet'
import { ReactNode } from 'react'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

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
    <LazyConnectEvmWallet
      buttonSize={submitButtonSize}
      text={connectWalletText}
    />
  )
}
