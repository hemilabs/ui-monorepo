import { ExternalLink } from 'components/externalLink'
import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import { useTranslations } from 'next-intl'
import { StakeToken } from 'types/stake'

type Props = {
  token: StakeToken
}

export const Website = function ({ token }: Props) {
  const t = useTranslations('common')
  return (
    <>
      {token.extensions.website ? (
        <ExternalLink
          className="group/link flex cursor-pointer items-center gap-x-1 text-sm font-medium text-neutral-500"
          href={token.extensions.website}
        >
          <span className="group-hover/link:text-neutral-700">{t('open')}</span>
          <ArrowDownLeftIcon className="[&>path]:fill-neutral-500 [&>path]:group-hover/link:fill-neutral-700" />
        </ExternalLink>
      ) : (
        <span className="text-neutral-500">-</span>
      )}
    </>
  )
}
