import { useIsMutating } from '@tanstack/react-query'
import { Button } from 'components/button'
import { CheckMark } from 'components/icons/checkMark'
import { PlusIcon } from 'components/icons/plusIcon'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useTranslations } from 'next-intl'
import { type Chain } from 'viem'
import { useAccount } from 'wagmi'

import { useChainAdded } from '../../_hooks/useChainAdded'

type Props = {
  chain: Chain
}

export const AddChainButton = function ({ chain }: Props) {
  const { isConnected } = useAccount()
  const [isChainAdded] = useChainAdded(chain)
  const isConnectedToChain = useIsConnectedToExpectedNetwork(chain.id)
  const isMutating =
    useIsMutating({
      mutationKey: ['add-chain-mutation', chain.id],
    }) > 0

  const t = useTranslations('get-started')
  const tCommon = useTranslations('common')

  if (isConnected && (isChainAdded || isConnectedToChain)) {
    return (
      <div className="flex h-7 items-center gap-x-1">
        <span className="text-neutral-500">{tCommon('added')}</span>
        <CheckMark className="[&>path]:stroke-emerald-500" />
      </div>
    )
  }

  const label = isMutating
    ? t('adding-chain')
    : isConnected
      ? t('add-to-wallet')
      : tCommon('connect-wallet')

  return (
    <div className="flex h-7 shrink-0 items-center">
      <Button
        disabled={isMutating}
        size="xSmall"
        type="button"
        variant="secondary"
      >
        <PlusIcon className="[&>path]:fill-neutral-500" />
        <span className="whitespace-nowrap text-xs font-semibold text-neutral-950">
          {label}
        </span>
      </Button>
    </div>
  )
}
