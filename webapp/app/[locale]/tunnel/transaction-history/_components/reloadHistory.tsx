import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useTranslations } from 'next-intl'

const ReloadIcon = () => (
  <svg fill="none" height={14} width={14} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2.917 4.667h-.584v.583h.584v-.583ZM3.5 2.334V1.75H2.333v.583H3.5ZM5.25 5.25h.583V4.083H5.25V5.25Zm5.257 6.417v.583h1.167v-.583h-1.167Zm.583-2.333h.584V8.75h-.584v.584ZM8.757 8.75h-.584v1.167h.584V8.75ZM7 11.084A4.083 4.083 0 0 1 2.917 7H1.75c0 2.9 2.35 5.25 5.25 5.25v-1.166Zm0-8.167A4.083 4.083 0 0 1 11.083 7h1.167c0-2.9-2.35-5.25-5.25-5.25v1.167ZM3.422 4.959A4.15 4.15 0 0 1 7 2.917V1.75a5.316 5.316 0 0 0-4.588 2.625l1.01.584ZM2.917 7c0-.173.01-.344.031-.511l-1.157-.144c-.027.215-.041.433-.041.655h1.167Zm8.166 0c0 .174-.01.344-.031.511l1.157.145c.027-.215.04-.434.04-.656h-1.166Zm-.505 2.041A4.15 4.15 0 0 1 7 11.084v1.166a5.316 5.316 0 0 0 4.588-2.624l-1.01-.585ZM2.333 2.333v2.334H3.5V2.334H2.333Zm.584 2.917H5.25V4.083H2.917V5.25Zm8.757 6.417V9.334h-1.167v2.333h1.167ZM11.09 8.75H8.757v1.167h2.333V8.75Z"
      fill="#737373"
    />
  </svg>
)

export const ReloadHistory = function () {
  const t = useTranslations()
  const { resyncHistory } = useTunnelHistory()

  return (
    <button
      className="flex cursor-pointer items-center gap-x-1 rounded-full bg-neutral-100 px-4 py-1"
      onClick={resyncHistory}
      type="button"
    >
      <ReloadIcon />
      <span className="text-sm font-medium text-neutral-600">
        {t('tunnel-page.transaction-history.column-headers.reload')}
      </span>
    </button>
  )
}
