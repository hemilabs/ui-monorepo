import { ButtonLink } from 'components/button'
import { useTunnelOperationByConnectedWallet } from 'hooks/useTunnelOperationByConnectedWallet'
import { useTranslations } from 'next-intl'

import { EmptyState } from './emptyState'

const InboxIcon = () => (
  <svg
    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    fill="none"
    height={20}
    width={20}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#inbox_filter)">
      <path
        clipRule="evenodd"
        d="M.999 11.27c0-.246.033-.492.099-.73l1.523-5.521A2.75 2.75 0 0 1 5.272 3h9.454a2.75 2.75 0 0 1 2.651 2.019l1.523 5.52c.066.239.099.485.099.732V15a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2v-3.73Zm3.068-5.852A1.25 1.25 0 0 1 5.272 4.5h9.454a1.25 1.25 0 0 1 1.205.918l1.523 5.52c.006.02.01.041.015.062h-3.47a1 1 0 0 0-.86.49l-.606 1.02a1 1 0 0 1-.86.49H8.235a1 1 0 0 1-.894-.553l-.448-.894A1 1 0 0 0 5.999 11h-3.47l.015-.062 1.523-5.52Z"
        fill="#FF6C15"
        fillRule="evenodd"
      />
    </g>
    <defs>
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height={14}
        id="inbox_filter"
        width={18}
        x={0.999}
        y={3}
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset />
        <feGaussianBlur stdDeviation={0.5} />
        <feComposite in2="hardAlpha" k2={-1} k3={1} operator="arithmetic" />
        <feColorMatrix values="0 0 0 0 0.270588 0 0 0 0 0.0666667 0 0 0 0 0.0196078 0 0 0 0.24 0" />
        <feBlend in2="shape" result="effect1_innerShadow_5078_38753" />
      </filter>
    </defs>
  </svg>
)

export const NoTransactions = function () {
  const t = useTranslations('tunnel-page.transaction-history')
  const href = useTunnelOperationByConnectedWallet()
  return (
    <EmptyState
      action={<ButtonLink href={href}>{t('tunnel-assets')}</ButtonLink>}
      icon={<InboxIcon />}
      subtitle={t('no-transactions-get-started')}
      title={t('no-transactions')}
    />
  )
}
