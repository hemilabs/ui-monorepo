import { Button } from 'components/button'
import { ButtonLoader } from 'components/buttonLoader'
import { useChain } from 'hooks/useChain'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useSwitchChain } from 'hooks/useSwitchChain'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { RemoteChain } from 'types/chain'
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
  chainId: RemoteChain['id']
  connectWalletText?: string
  submitButton: React.ReactNode
}

export const SubmitWhenConnectedToChain = function ({
  chainId,
  connectWalletText,
  submitButton,
}: Props) {
  const t = useTranslations()
  const { status } = useAccount()
  const { switchChain } = useSwitchChain()
  const connectedToChain = useIsConnectedToExpectedNetwork(chainId)
  const targetChain = useChain(chainId)

  if (walletIsConnected(status)) {
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

  return <ConnectEvmWallet text={connectWalletText} />
}
