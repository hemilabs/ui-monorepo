import { useTranslations } from 'next-intl'
import { Card } from 'ui-common/components/card'

import { Heading, SubSection } from './index'

type Props = {
  canWithdraw: boolean
  withdraw: string
  withdrawSymbol: string
  gas: string
  gasSymbol: string
  total: string
}
export const ReviewWithdraw = function ({
  canWithdraw,
  gas,
  gasSymbol,
  total,
  withdraw,
  withdrawSymbol,
}: Props) {
  const t = useTranslations('bridge-page.review-withdraw')
  const tCommon = useTranslations('common')
  return (
    <Card>
      <Heading text={t('heading')} />
      <SubSection
        symbol={withdrawSymbol}
        text={t('total-to-withdraw')}
        value={canWithdraw ? withdraw : '0'}
      />
      <SubSection
        symbol={gasSymbol}
        text={tCommon('network-gas-fee', { network: 'Hemi' })}
        value={canWithdraw ? gas : '0'}
      />
      <div className="absolute left-0 right-0 h-px border-t border-zinc-400"></div>
      {/* When implementing ERC20, we need to allow different tokens in total 
        See https://github.com/BVM-priv/ui-monorepo/issues/20
    */}
      <SubSection
        symbol={withdrawSymbol}
        text={tCommon('total')}
        value={canWithdraw ? total : '0'}
      />
    </Card>
  )
}
