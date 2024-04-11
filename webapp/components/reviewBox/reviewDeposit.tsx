import { useTranslations } from 'next-intl'
import { Card } from 'ui-common/components/card'

import { Heading, SubSection } from './index'

type Props = {
  canDeposit: boolean
  deposit: string
  depositSymbol: string
  gas: string
  gasSymbol: string
  total: string
}
export const ReviewDeposit = function ({
  canDeposit,
  deposit,
  depositSymbol,
  gas,
  gasSymbol,
  total,
}: Props) {
  const t = useTranslations('tunnel-page.review-deposit')
  const tCommon = useTranslations('common')
  return (
    <Card>
      <Heading text={t('heading')} />
      <SubSection
        symbol={depositSymbol}
        text={t('you-are-depositing')}
        value={canDeposit ? deposit : '0'}
      />
      <SubSection
        symbol={gasSymbol}
        text={tCommon('network-gas-fee', { network: 'Ethereum' })}
        value={canDeposit ? gas : '0'}
      />
      <div className="absolute left-0 right-0 h-px border-t border-zinc-400"></div>
      {/* When implementing ERC20, we need to allow different tokens in total 
        See https://github.com/BVM-priv/ui-monorepo/issues/20
    */}
      <SubSection
        symbol={depositSymbol}
        text={tCommon('total')}
        value={canDeposit ? total : '0'}
      />
    </Card>
  )
}
