import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useMutation } from '@tanstack/react-query'
import { useUmami } from 'app/analyticsEvents'
import { ChainLogo } from 'components/chainLogo'
import { CheckMark } from 'components/icons/checkMark'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { sepolia } from 'networks/sepolia'
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
  const { track } = useUmami()

  const { chain: connectedChain, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  const { mutate: addChain, status } = useMutation({
    mutationFn: (c: Chain) => walletClient?.addChain({ chain: c }),
    onSuccess() {
      localStorage.setItem(
        `portal.get-started.configure-networks-added-${chain.id}`,
        'true',
      )
      switch (chain.id) {
        case sepolia.id:
          track?.('add to wallet - sepolia')
          break
        case hemiMainnet.id:
          track?.('add to wallet - hemi mainnet')
          break
        case hemiTestnet.id:
          track?.('add to wallet - hemi sepolia')
          break
      }
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
      className={`border-neutral/55 flex flex-col rounded-xl border border-solid
      p-4 text-sm font-medium ${
        isConnected && (isChainAdded || connectedToChain)
          ? ''
          : 'cursor-pointer hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="flex flex-row gap-x-1">
        <div className="w-5">
          <ChainLogo chainId={chain.id} />
        </div>
        <span className="ml-1 text-neutral-950">{chain.name}</span>
        <span className="text-neutral-500">{t('layer', { layer })}</span>
        <div className="ml-auto">{getButton()}</div>
      </div>
    </div>
  )
}
