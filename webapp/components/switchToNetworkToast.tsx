import { useSwitchChain as useSwitchBtcChain } from 'btc-wallet/hooks/useSwitchChain'
import { useChain } from 'hooks/useChain'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { type RemoteChain } from 'types/chain'
import { CloseIcon } from 'ui-common/components/closeIcon'
import { isEvmNetwork } from 'utils/chain'
import { useSwitchChain as useSwitchEvmChain } from 'wagmi'

const WarningIcon = () => (
  <svg
    className="flex-shrink-0"
    fill="none"
    height={16}
    width={16}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M6.788 1.996a1.399 1.399 0 0 1 2.424 0l5.024 8.7a1.4 1.4 0 0 1-1.213 2.1H2.976a1.4 1.4 0 0 1-1.212-2.1l5.024-8.7ZM8 4a.6.6 0 0 1 .6.6v2.8a.6.6 0 1 1-1.2 0V4.6A.6.6 0 0 1 8 4Zm0 7.2a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Z"
      fill="#F43F5E"
      fillRule="evenodd"
    />
  </svg>
)

type Props = {
  chainId: RemoteChain['id']
}

export const SwitchToNetworkToast = function ({ chainId }: Props) {
  const [closedToast, setClosedToast] = useState(false)
  const { switchChain: switchBtcChain } = useSwitchBtcChain()
  const { switchChain: switchEvmChain } = useSwitchEvmChain()

  const t = useTranslations('common')

  const walletTargetNetwork = useChain(chainId)

  if (closedToast) {
    return null
  }

  const expectedWalletIsEvm =
    !!walletTargetNetwork && isEvmNetwork(walletTargetNetwork)

  const switchToNetwork = function () {
    if (expectedWalletIsEvm) {
      switchEvmChain({ chainId: walletTargetNetwork.id })
    } else {
      // We need to use viem's Chain definition instead of rainbow-kit's definition of Chain
      // for this to work. But we still need to use rainbow-kit's Chain for showing the proper logos
      // when switching the chain when the feature toggle is off. Once we drop rainbow-kit for switching chains
      // and we use Chain from viem's in network.tsx, this will work automatically.
      // @ts-expect-error once we drop rainbow kit for switching chains, this will work automatically
      switchBtcChain({ chainId: walletTargetNetwork.id })
    }
  }

  return (
    <div
      className="text-ms shadow-soft fixed bottom-20 left-4 right-4 z-10 flex justify-between gap-x-3 rounded-xl
    border border-solid border-black/85 bg-neutral-800 p-3.5 font-medium leading-5
    text-white md:bottom-auto md:left-auto md:right-8 md:top-20"
    >
      <WarningIcon />
      <div className="flex flex-col items-start gap-y-1.5">
        <h5 className="text-base leading-4">{t('wrong-network')}</h5>
        <p className="text-neutral-400 md:max-w-72">
          {t('network-does-not-match')}
        </p>
        <button
          className="mt-1.5 cursor-pointer underline hover:text-neutral-200"
          onClick={switchToNetwork}
          type="button"
        >
          {t('switch-to-network', { network: walletTargetNetwork?.name })}
        </button>
      </div>
      <button className="h-fit" onClick={() => setClosedToast(true)}>
        <CloseIcon className="[&>path]:hover:stroke-white" />
      </button>
    </div>
  )
}
