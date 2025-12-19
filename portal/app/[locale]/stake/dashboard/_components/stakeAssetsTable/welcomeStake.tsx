import { ButtonLink } from 'components/button'
import { useTranslations } from 'next-intl'
import { MouseEvent } from 'react'

import { StarIcon } from '../../../_components/icons/starIcon'

type Props = {
  href: string
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void
}

export function WelcomeStake({ href, onClick }: Props) {
  const t = useTranslations('stake-page')
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8">
      <div className="flex size-8 items-center justify-center rounded-full border border-orange-100 bg-orange-50">
        <StarIcon />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">
          {t('start-staking-earn-points')}
        </h3>
        <p className="max-w-72 font-normal text-neutral-500">
          {t('ready-to-earn')}
        </p>
      </div>
      <div className="mt-2">
        <ButtonLink href={href} onClick={onClick} size="small">
          {t('stake.title')}
        </ButtonLink>
      </div>
    </div>
  )
}
