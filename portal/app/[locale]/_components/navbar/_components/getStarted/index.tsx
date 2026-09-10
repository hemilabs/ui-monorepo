import { ButtonLink, type ButtonSize } from 'components/button'
import { Chevron } from 'components/icons/chevron'
import { type Link } from 'components/link'
import { useUmami } from 'hooks/useUmami'
import { type ComponentProps, Suspense } from 'react'
import { useTranslations } from 'use-intl'

type Props = Pick<ComponentProps<typeof Link>, 'href' | 'onClick'> & {
  size?: ButtonSize
  t: ReturnType<typeof useTranslations<'navbar'>>
}

const UI = ({ href, onClick, size = 'small', t }: Props) => (
  <ButtonLink href={href} onClick={onClick} size={size} variant="secondary">
    <span>{t('get-started')}</span>
    <Chevron.Right className="[&>path]:fill-neutral-500" />
  </ButtonLink>
)

const GetStartedImpl = function (props: Omit<Props, 'onClick'>) {
  const { enabled, track } = useUmami()

  const onClick = enabled ? () => track('nav - get started') : undefined

  return <UI {...props} onClick={onClick} />
}

export const GetStarted = function ({ size }: { size?: ButtonSize } = {}) {
  const props = {
    href: '/get-started',
    size,
    t: useTranslations('navbar'),
  }

  // The UI for the get started is the same for mainnet|testnet
  // the only change is how we track on analytics.
  return (
    <Suspense fallback={<UI {...props} />}>
      <GetStartedImpl {...props} />
    </Suspense>
  )
}
