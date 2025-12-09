import { ExternalLink } from 'components/externalLink'
import hemiSocials from 'hemi-socials'
import { useTranslations } from 'next-intl'
import { absintheUrl } from 'utils/absinthe'

import { EligibilityStatus } from './eligibilityStatus'

const { discordUrl } = hemiSocials

export const NotEligible = function () {
  const t = useTranslations('genesis-drop')
  return (
    <>
      <EligibilityStatus status="not-eligible" />
      <p className="mt-3 max-w-48 text-center text-xs font-medium text-neutral-500 sm:max-w-80 md:max-w-72 lg:max-w-72 xl:max-w-96">
        {t.rich('have-questions', {
          absintheLink: chunk => (
            <ExternalLink className="hoverable-text" href={absintheUrl}>
              {chunk}
            </ExternalLink>
          ),
          discordLink: chunk => (
            <ExternalLink className="hoverable-text" href={discordUrl}>
              {chunk}
            </ExternalLink>
          ),
        })}
      </p>
    </>
  )
}
