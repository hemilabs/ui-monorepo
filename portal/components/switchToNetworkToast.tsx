import { CloseIcon } from 'components/icons/closeIcon'
import { useChain } from 'hooks/useChain'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { type RemoteChain } from 'types/chain'

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
  const { switchChain } = useSwitchChain()

  const t = useTranslations('common')

  const walletTargetNetwork = useChain(chainId)

  if (closedToast) {
    return null
  }

  return (
    <div
      className="shadow-soft fixed bottom-20 left-4 right-4 z-10 flex justify-between
      gap-x-3 rounded-xl border border-solid border-black/85 bg-neutral-800 p-3.5
    text-sm font-medium text-white md:bottom-auto md:left-auto md:right-8 md:top-20"
    >
      <div className="mt-[5px]">
        <WarningIcon />
      </div>
      <div className="flex flex-col items-start gap-y-1.5">
        <h5 className="text-base">{t('wrong-network')}</h5>
        <p className="text-neutral-400 md:max-w-72">
          {t('network-does-not-match')}
        </p>
        <button
          className="mt-1.5 cursor-pointer underline hover:text-neutral-200"
          onClick={() => switchChain({ chainId })}
          type="button"
        >
          {t('switch-to-network', { network: walletTargetNetwork?.name })}
        </button>
      </div>
      <button className="h-5 w-5" onClick={() => setClosedToast(true)}>
        <CloseIcon className="h-full w-full [&>path]:hover:stroke-white" />
      </button>
    </div>
  )
}
