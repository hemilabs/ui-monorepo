import Big from 'big.js'
import { useTranslations } from 'next-intl'
import { Card } from 'ui-common/components/card'

type SubSectionProps = {
  symbol: string
  text: string
  value: string
}
const SubSection = function ({ symbol, text, value }: SubSectionProps) {
  const getValue = () => (Big(value).lt('0.001') ? '< 0.001' : value)

  return (
    <div className="flex items-center justify-between py-3 text-xs font-normal md:text-sm">
      <p className="text-zinc-400">{text}</p>
      <span>{value === '0' ? '-' : `${getValue()} ${symbol}`}</span>
    </div>
  )
}
const Heading = ({ text }: { text: string }) => (
  <h4 className="pb-3 text-base font-medium text-black md:text-xl">{text}</h4>
)

type DepositProps = {
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
}: DepositProps) {
  const t = useTranslations('bridge-page.review-deposit')
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
type WithdrawProps = {
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
}: WithdrawProps) {
  const t = useTranslations('bridge-page.review-withdraw')
  const tCommon = useTranslations('common')
  return (
    <Card>
      <Heading text={t('heading')} />
      <SubSection
        symbol={withdrawSymbol}
        text={t('you-are-withdrawing')}
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
