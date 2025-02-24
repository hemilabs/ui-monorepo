import { DisplayAmount } from 'components/displayAmount'
import { useBitcoin } from 'hooks/useBitcoin'
import { useTranslations } from 'next-intl'
import { getNativeToken } from 'utils/nativeToken'

export const BtcFees = function ({ fees }: { fees: string }) {
  const bitcoin = useBitcoin()
  const t = useTranslations('common')

  const token = getNativeToken(bitcoin.id)

  return (
    <div className="flex flex-col gap-y-1 px-8 py-4 text-sm md:px-10">
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">{t('fees')}</span>
        <div className="text-neutral-950">
          <DisplayAmount
            amount={fees}
            showTokenLogo={false}
            // Btc fees are displayed in the special unit
            token={{
              ...token,
              symbol: 'sat/vB',
            }}
          />
        </div>
      </div>
    </div>
  )
}
