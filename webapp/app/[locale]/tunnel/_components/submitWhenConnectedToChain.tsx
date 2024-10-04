import { Button } from 'components/button'
import { useChain } from 'hooks/useChain'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useTranslations } from 'next-intl'
import { type Chain } from 'viem'
import { useSwitchChain } from 'wagmi'

type Props = {
  chainId: Chain['id']
  submitButton: React.ReactNode
}

export const SubmitWhenConnectedToChain = function ({
  chainId,
  submitButton,
}: Props) {
  const { switchChain } = useSwitchChain()

  const t = useTranslations()

  const connectedToChain = useIsConnectedToExpectedNetwork(chainId)
  const targetChain = useChain(chainId)

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
