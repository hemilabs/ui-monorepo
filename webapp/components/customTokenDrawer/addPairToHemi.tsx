import { ExternalLink } from 'components/externalLink'
import { WarningIcon } from 'components/icons/warningIcon'
import { useTranslations } from 'next-intl'
import { CloseIcon } from 'ui-common/components/closeIcon'
import useLocalStorageState from 'use-local-storage-state'

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
