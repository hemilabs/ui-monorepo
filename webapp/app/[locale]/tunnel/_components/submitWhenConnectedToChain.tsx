import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useTranslations } from 'next-intl'
import { Button } from 'ui-common/components/button'
import { type Chain } from 'viem'
import { useConfig, useSwitchChain } from 'wagmi'

type Props = {
  l1ChainId: Chain['id']
  submitButton: React.ReactNode
}

export const SubmitWhenConnectedToChain = function ({
  l1ChainId,
  submitButton,
}: Props) {
  const { chains } = useConfig()
  const { switchChain } = useSwitchChain()

  const t = useTranslations()

  const connectedToL1 = useIsConnectedToExpectedNetwork(l1ChainId)
  const targetChain = chains.find(c => c.id === l1ChainId)

  const switchToL1 = () => switchChain({ chainId: l1ChainId })

  return (
    <>
      {connectedToL1 && submitButton}
      {!connectedToL1 && (
        <div className="flex flex-col gap-y-2">
          <Button onClick={switchToL1} type="button">
            {t('common.connect-to-network', { network: targetChain.name })}
          </Button>
        </div>
      )}
    </>
  )
}
