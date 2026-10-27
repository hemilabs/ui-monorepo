import { ExternalLink } from 'components/externalLink'
import { useTranslations } from 'use-intl'

import { vetroTermsUrl } from '../_constants/vetro'

type Props = {
  label: string
  text: string
}

const OperatorDisclosure = ({ label, text }: Props) => (
  <div className="body-text-normal flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg border border-solid border-orange-500/25 bg-orange-50 px-4 py-3 text-neutral-950">
    <span>{text}</span>
    <ExternalLink
      className="font-medium text-orange-500 underline hover:text-orange-600"
      href={vetroTermsUrl}
    >
      {label}
    </ExternalLink>
  </div>
)

export const OperatorBanner = function () {
  const t = useTranslations('hemi-earn.operator')
  return <OperatorDisclosure label={t('view-terms')} text={t('banner')} />
}

export const OperatorNote = function () {
  const t = useTranslations('hemi-earn.operator')
  return <OperatorDisclosure label={t('terms')} text={t('note')} />
}
