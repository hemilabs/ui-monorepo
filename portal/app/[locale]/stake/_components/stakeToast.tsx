import { ExternalLink } from 'components/externalLink'
import { CheckMark } from 'components/icons/checkMark'
import { Link } from 'components/link'
import { useChain } from 'hooks/useChain'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { RemoteChain } from 'types/chain'
import { CloseIcon } from 'ui-common/components/closeIcon'
import { formatEvmHash } from 'utils/format'
import { type Hash } from 'viem'

type ToastType = 'stake' | 'unstake'

type Props = {
  autoCloseMs?: number
  chainId: RemoteChain['id']
  txHash: Hash
  type: ToastType
}

export const StakeToast = function ({
  autoCloseMs = 5000,
  chainId,
  txHash,
  type,
}: Props) {
  const [closedToast, setClosedToast] = useState(false)
  const blockExplorer = useChain(chainId).blockExplorers.default

  const t = useTranslations('stake-page.toast')

  useEffect(
    function autoCloseToast() {
      if (autoCloseMs) {
        const timer = setTimeout(function closeToastAfterDelay() {
          setClosedToast(true)
        }, autoCloseMs)

        return () => clearTimeout(timer)
      }
      return undefined
    },
    [autoCloseMs],
  )

  if (closedToast) {
    return null
  }

  return (
    <div
      className="shadow-soft fixed bottom-20 left-4 right-4 z-40 flex justify-between
      gap-x-3 rounded-xl border border-solid border-black/85 bg-neutral-800 p-3.5
    text-sm font-medium text-white md:bottom-auto md:left-auto md:right-8 md:top-20"
    >
      <div className="mt-1.5">
        <CheckMark className="[&>path]:stroke-emerald-500" />
      </div>
      <div className="flex flex-col items-start gap-y-1.5">
        <h5 className="text-base">
          {type === 'stake'
            ? t('staking-successful')
            : t('unstaking-successful')}
        </h5>
        <p className="text-neutral-400 md:max-w-96">
          {t('here-your-stake-tx', {
            type: t(type === 'stake' ? 'staking' : 'unstaking'),
          })}
          <ExternalLink href={`${blockExplorer.url}/tx/${txHash}`}>
            <span className="ml-1 text-orange-500 hover:text-orange-700">
              {formatEvmHash(txHash)}
            </span>
          </ExternalLink>
        </p>
        {type === 'stake' && (
          <Link
            className="mt-1.5 cursor-pointer underline hover:text-neutral-200 hover:opacity-80"
            href="/stake/dashboard"
          >
            {t('go-staking-dashboard')}
          </Link>
        )}
      </div>
      <button className="h-fit" onClick={() => setClosedToast(true)}>
        <CloseIcon className="[&>path]:hover:stroke-white" />
      </button>
    </div>
  )
}
