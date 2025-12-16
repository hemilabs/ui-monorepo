import { StakeIcon } from 'components/icons/stakeIcon'
import { Link } from 'components/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { IconContainer } from './iconContainer'
import { ItemAccordion } from './itemAccordion'
import { ItemContainer, ItemText, Row } from './navItem'

const stakeLinks = (t: ReturnType<typeof useTranslations<'navbar'>>) => [
  {
    event: 'nav - staking dashboard' as const,
    href: '/staking-dashboard',
    text: t('governance-staking'),
    urlToBeSelected: '/staking-dashboard',
  },
  {
    event: 'nav - stake' as const,
    href: '/stake/dashboard',
    text: t('boost-staking'),
    urlToBeSelected: '/stake',
  },
]

export const StakeDesktop = function () {
  const t = useTranslations('navbar')

  return (
    <li>
      <ItemAccordion
        icon={<StakeIcon />}
        items={stakeLinks(t)}
        text={t('stake')}
      />
    </li>
  )
}

export const StakeMobile = function () {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations('navbar')
  return (
    <ItemContainer onClick={() => setIsOpen(true)}>
      {isOpen ? (
        <div className="flex size-[calc(100%-4px)] flex-col items-center justify-center gap-y-0.5">
          {stakeLinks(t).map(link => (
            <Link
              className="flex size-full justify-center rounded-md bg-white py-3.5"
              href={link.href}
              key={link.event}
            >
              <ItemText text={link.text} />
            </Link>
          ))}
        </div>
      ) : (
        <Row>
          <IconContainer>
            <div className="w-8 md:w-3">
              <StakeIcon />
            </div>
          </IconContainer>
          <ItemText text={t('stake')} />
        </Row>
      )}
    </ItemContainer>
  )
}
