import Big from 'big.js'
import { TokenLogo } from 'components/tokenLogo'
import { TokenSelector } from 'components/tokenSelector'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'
import { tokenList } from 'tokenList'
import { RemoteChain } from 'types/chain'
import { Token } from 'types/token'
import { AllOrNone } from 'utils/typeUtilities'

const Balance = dynamic(
  () => import('components/balance').then(mod => mod.Balance),
  {
    loading: () => (
      <Skeleton className="h-full" containerClassName="basis-1/3" />
    ),
    ssr: false,
  },
)

type Props = {
  isRunningOperation: boolean
  label: string
  maxBalanceButton?: ReactNode
  onChange: (value: string) => void
  token: Token
  value: string
} & AllOrNone<{
  fromNetworkId: RemoteChain['id']
  onSelectToken: (token: Token) => void
}>

export const TokenInput = function ({
  isRunningOperation,
  label,
  maxBalanceButton,
  token,
  value,
  ...props
}: Props) {
  const readOnly = !('fromNetworkId' in props)

  const t = useTranslations('tunnel-page')
  return (
    <div
      className="h-[120px] rounded-lg border border-solid border-transparent bg-neutral-50
      p-4 font-medium text-neutral-500 hover:border-neutral-300/55"
    >
      <div className="flex h-full items-center justify-between">
        <div className="flex flex-shrink flex-grow flex-col items-start">
          <span className="text-sm">{label}</span>
          <input
            className={`
            text-3.25xl max-w-1/2 w-full bg-transparent ${
              Big(value).gt(0) ? 'text-neutral-950' : 'text-neutral-600'
            }
            outline-none focus:text-neutral-950`}
            disabled={isRunningOperation}
            onChange={e => props.onChange(e.target.value)}
            type="text"
            value={value}
          />
        </div>
        <div className="flex h-full flex-col items-end justify-end gap-y-3 text-sm">
          {readOnly ? (
            <div className="flex items-center justify-between gap-x-2">
              <TokenLogo size="small" token={token} />
              <span className="font-medium text-neutral-950">
                {token.symbol}
              </span>
            </div>
          ) : (
            <TokenSelector
              disabled={isRunningOperation}
              onSelectToken={props.onSelectToken}
              selectedToken={token}
              tokens={tokenList.tokens.filter(
                ({ chainId }) => chainId === props.fromNetworkId,
              )}
            />
          )}
          <div className="flex items-center justify-end gap-x-2 text-sm">
            <span className="text-neutral-500">{t('form.balance')}:</span>
            <span className="text-neutral-950">
              <Balance token={token} />
            </span>
            {maxBalanceButton}
          </div>
        </div>
      </div>
    </div>
  )
}
