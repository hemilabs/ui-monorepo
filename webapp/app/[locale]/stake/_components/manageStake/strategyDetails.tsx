import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'
import { StakeToken } from 'types/stake'

import { TokenRewards } from '../tokenRewards'

import { Tvl } from './tvl'
import { Website } from './website'

type Props = {
  token: StakeToken
}

const Container = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center justify-between border-b border-solid border-neutral-300/55 py-4">
    {children}
  </div>
)

const Subtitle = ({ text }: { text: string }) => (
  <h6 className="text-sm font-medium text-neutral-500">{text}</h6>
)

export const StrategyDetails = function ({ token }: Props) {
  const t = useTranslations('stake-page.drawer.strategy-details')
  return (
    <div className="flex flex-col">
      <Container>
        <h5 className="font-medium">{t('heading')}</h5>
      </Container>
      <Container>
        <Subtitle text={t('rewards')} />
        <div className="flex h-6 flex-wrap gap-x-1">
          <TokenRewards rewards={token.extensions.rewards} />
        </div>
      </Container>
      <Container>
        <Subtitle text={t('tvl')} />
        <div className="flex items-center gap-x-1 text-base font-semibold text-neutral-950">
          <span>$</span>
          <span className="min-w-8">
            <Tvl token={token} />
          </span>
        </div>
      </Container>
      <Container>
        <Subtitle text={t('website')} />
        <Website token={token} />
      </Container>
    </div>
  )
}
