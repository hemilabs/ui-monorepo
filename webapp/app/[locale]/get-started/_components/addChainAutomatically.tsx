import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useMutation } from '@tanstack/react-query'
import { ChainLogo } from 'components/chainLogo'
import { CheckMark } from 'components/icons/checkMark'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { type Chain } from 'viem'
import { useAccount, useWalletClient } from 'wagmi'

type Props = {
  chain: Chain
  layer: number
}

export const AddChainAutomatically = function ({ chain, layer }: Props) {
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

  const getButton = function () {
    if (!isConnected) {
      return (
        <button
          className="cursor-pointer text-orange-500 hover:text-orange-700"
          type="button"
        >
          {tCommon('connect-wallet')}
        </button>
      )
    }
    if (isChainAdded || connectedToChain) {
      return (
        <div className="flex items-center gap-x-1">
          <span className="text-neutral-500">{tCommon('added')}</span>
          <CheckMark className="[&>path]:stroke-emerald-500" />
        </div>
      )
    }
    return (
      <button
        className="cursor-pointer text-orange-500 hover:text-orange-700"
        disabled={status === 'pending'}
        type="button"
      >
        {t('add-to-wallet')}
      </button>
    )
  }

  const onClick = function () {
    if (!isConnected) {
      openConnectModal()
      return
    }
    if (!isChainAdded && !connectedToChain) {
      addChain(chain)
    }
  }

  return (
    <div
      className={`border-neutral/55 text-ms flex flex-col rounded-xl border
      border-solid p-4 font-medium leading-5 ${
        isConnected && (isChainAdded || connectedToChain)
          ? ''
          : 'cursor-pointer hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="flex flex-row gap-x-1">
        <ChainLogo chainId={chain.id} />
        <span className="ml-1 text-neutral-950">{chain.name}</span>
        <span className="text-neutral-500">{t('layer', { layer })}</span>
        <div className="ml-auto">{getButton()}</div>
      </div>
    </div>
  )
}
