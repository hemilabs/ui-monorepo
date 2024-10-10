import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useMutation } from '@tanstack/react-query'
import { CheckMark } from 'components/icons/checkMark'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { type Chain } from 'viem'
import { useAccount, useWalletClient } from 'wagmi'

type Props = {
  chain: Chain
}

export const AddChainAutomatically = function ({ chain }: Props) {
  const { openConnectModal } = useConnectModal()
  const tCommon = useTranslations('common')
  const t = useTranslations('get-started')

  const { chain: connectedChain, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  const { status, mutate: addChain } = useMutation({
    mutationFn: (c: Chain) => walletClient?.addChain({ chain: c }),
    onSuccess() {
      localStorage.setItem(
        `portal.get-started.configure-networks-added-${chain.id}`,
        'true',
      )
    },
  })

  const connectedToChain = connectedChain?.id === chain.id
  const isChainAdded =
    localStorage.getItem(
      `portal.get-started.configure-networks-added-${chain.id}`,
    ) === 'true'

  useEffect(
    function () {
      if (connectedChain) {
        localStorage.setItem(
          `portal.get-started.configure-networks-added-${connectedChain.id}`,
          'true',
        )
      }
    },
    [connectedChain],
  )

  if (!isConnected) {
    return (
      <button
        className="cursor-pointer text-orange-500 hover:text-orange-700"
        onClick={openConnectModal}
        type="button"
      >
        {tCommon('connect-wallet')}
      </button>
    )
  }

  return isChainAdded || connectedToChain ? (
    <div className="flex items-center gap-x-1">
      <span className="text-neutral-500">{tCommon('added')}</span>
      <CheckMark className="[&>path]:stroke-emerald-500" />
    </div>
  ) : (
    <button
      className="cursor-pointer text-orange-500 hover:text-orange-700"
      disabled={status === 'pending'}
      onClick={() => addChain(chain)}
      type="button"
    >
      {t('add-to-wallet')}
    </button>
  )
}
