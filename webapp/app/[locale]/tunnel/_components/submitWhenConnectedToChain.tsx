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

  const connectedToL1 = useIsConnectedToExpectedNetwork(chainId)
  const targetChain = useChain(chainId)

  return (
    <>
      {connectedToL1 && submitButton}
      {!connectedToL1 && (
        <div className="flex flex-col gap-y-2">
          <Button onClick={() => switchChain({ chainId })} type="button">
            {t('common.connect-to-network', { network: targetChain?.name })}
          </Button>
        </div>
      )}
    </>
  )
}
