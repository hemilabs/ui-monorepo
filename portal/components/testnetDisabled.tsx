import { ButtonLink } from 'components/button'
import { LiveIcon } from 'components/icons/liveIcon'
import { useNetworkType } from 'hooks/useNetworkType'
import { usePathname } from 'i18n/navigation'
import { MouseEvent } from 'react'
import { useTranslations } from 'use-intl'

const variants = {
  card: 'mt-8 rounded-xl bg-white py-48 shadow-md',
  overlay: 'absolute inset-0',
} as const

type Props = {
  subtitle: string
  variant?: keyof typeof variants
}

export const TestnetDisabled = function ({
  subtitle,
  variant = 'card',
}: Props) {
  const [, setNetworkType] = useNetworkType()
  const pathname = usePathname()
  const t = useTranslations('common')

  const onClick = function (e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    setNetworkType('mainnet')
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-y-1 ${variants[variant]}`}
    >
      <LiveIcon />
      <h2>{t('only-live-on-mainnet')}</h2>
      <p className="mb-3 max-w-44 text-center font-medium text-neutral-500 sm:max-w-64 md:max-w-72 lg:max-w-72 xl:max-w-full">
        {subtitle}
      </p>
      <ButtonLink
        href={{ pathname, query: { networkType: 'mainnet' } }}
        onClick={onClick}
      >
        {t('switch-to-mainnet')}
      </ButtonLink>
    </div>
  )
}
