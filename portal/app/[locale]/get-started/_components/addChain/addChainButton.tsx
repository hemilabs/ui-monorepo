import { useIsMutating } from '@tanstack/react-query'
import { CheckMark } from 'components/icons/checkMark'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useTranslations } from 'next-intl'
import { type Chain } from 'viem'
import { useAccount } from 'wagmi'

import { useChainAdded } from '../../_hooks/useChainAdded'

type Props = {
  chain: Chain
}

export const AddChainButton = function ({ chain }: Props) {
  const { status: accountStatus } = useAccount()
  const [isChainAdded] = useChainAdded(chain)
  const isConnectedToChain = useIsConnectedToExpectedNetwork(chain.id)
  const isMutating =
    useIsMutating({
      mutationKey: ['add-chain-mutation', chain.id],
    }) > 0

  const t = useTranslations('get-started')
  const tCommon = useTranslations('common')

  if (isChainAdded || isConnectedToChain) {
    return (
      <div className="flex items-center gap-x-1">
        <span className="text-neutral-500">{tCommon('added')}</span>
        <CheckMark className="[&>path]:stroke-emerald-500" />
      </div>
    )
  }

  const getText = function () {
    if (isMutating) {
      return t('adding-chain')
    }

    if (accountStatus === 'disconnected') {
      return tCommon('connect-wallet')
    }

    return t('add-to-wallet')
  }

  return (
    <button
      className="cursor-pointer text-orange-500 hover:text-orange-700"
      type="button"
    >
      {getText()}
    </button>
  )
}
