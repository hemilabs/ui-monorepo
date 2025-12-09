import { ExternalLink } from 'components/externalLink'
import { WarningBox } from 'components/warningBox'
import { useTranslations } from 'next-intl'
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
    <div className="px-4 py-3 md:px-6">
      <WarningBox
        heading={t('add-this-pair')}
        onClose={() => setHideWarning(true)}
        subheading={t.rich('make-a-request-to-add', {
          link: chunk => (
            <ExternalLink
              className="hoverable-text"
              href="https://github.com/hemilabs/token-list/issues/new"
            >
              {chunk}
            </ExternalLink>
          ),
        })}
      />
    </div>
  )
}
