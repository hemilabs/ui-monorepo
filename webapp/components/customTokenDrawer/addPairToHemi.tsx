import { ExternalLink } from 'components/externalLink'
import { useTranslations } from 'next-intl'
import { CloseIcon } from 'ui-common/components/closeIcon'
import useLocalStorageState from 'use-local-storage-state'

const WarningIcon = () => (
  <svg fill="none" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
    <path
      clipRule="evenodd"
      d="M6.788 1.997a1.399 1.399 0 0 1 2.424 0l5.024 8.7a1.4 1.4 0 0 1-1.213 2.1H2.976a1.4 1.4 0 0 1-1.212-2.1l5.024-8.7ZM8 4.001a.6.6 0 0 1 .6.6v2.8a.6.6 0 1 1-1.2 0v-2.8a.6.6 0 0 1 .6-.6Zm0 7.2a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Z"
      fill="#171717"
      fillRule="evenodd"
    />
  </svg>
)

export const AddPairToHemi = function () {
  const t = useTranslations('token-custom-drawer')
  const [hideWarning, setHideWarning] = useLocalStorageState(
    'portal.add-pair-hide-make-request',
    {
      defaultValue: false,
    },
  )

  if (hideWarning) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-1 rounded-lg bg-neutral-50 p-4 text-sm font-medium">
      <div className="flex items-center gap-x-1">
        <WarningIcon />
        <p className="text-neutral-900">{t('add-this-pair')}</p>
        <CloseIcon
          className="cursor-pointer [&>path]:hover:stroke-neutral-950"
          onClick={() => setHideWarning(true)}
        />
      </div>
      <p className="text-neutral-500">
        {t.rich('make-a-request-to-add', {
          link: (chunk: string) => (
            <ExternalLink
              className="text-orange-500 hover:text-orange-700"
              href="https://github.com/hemilabs/token-list/issues/new"
            >
              {chunk}
            </ExternalLink>
          ),
        })}
      </p>
    </div>
  )
}
