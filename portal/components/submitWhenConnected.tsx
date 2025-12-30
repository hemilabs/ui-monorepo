import { ButtonSize } from 'components/button'
import { ButtonLoader } from 'components/buttonLoader'
import dynamic from 'next/dynamic'
import { ReactNode } from 'react'
import { walletIsConnected } from 'utils/wallet'
import { useAccount } from 'wagmi'

const ConnectEvmWallet = dynamic(
  () => import('components/connectEvmWallet').then(mod => mod.ConnectEvmWallet),
  {
    loading: () => <ButtonLoader />,
    ssr: false,
  },
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
    <ConnectEvmWallet buttonSize={submitButtonSize} text={connectWalletText} />
  )
}
