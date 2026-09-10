import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import Skeleton from 'react-loading-skeleton'
import { type Token } from 'types/token'
import { useTranslations } from 'use-intl'
import { formatNumber } from 'utils/format'

import { ErrorBoundary } from './errorBoundary'
import { ExternalLink } from './externalLink'
import { TokenLogo } from './tokenLogo'

const Price = ({ price }: { price: string }) => <>{`$${formatNumber(price)}`}</>

type Props = {
  href: string
  isLoading: boolean
  onClick?: VoidFunction
  price: string | undefined
  token: Token
}

export const TokenPricePill = function ({
  href,
  isLoading,
  onClick,
  price,
  token,
}: Props) {
  const t = useTranslations('common')

  return (
    <ExternalLink
      className="group/token-price-pill flex h-7 w-fit items-center gap-x-1.5 rounded-md bg-white px-2.5 shadow-sm transition-colors duration-300 hover:bg-neutral-50 focus-visible:shadow-button-secondary-focused focus-visible:outline-none forced-colors:focus-visible:outline"
      href={href}
      onClick={onClick}
    >
      <span aria-hidden>
        <TokenLogo size="xSmall" token={token} />
      </span>
      <span className="sr-only">
        {t('token-price', { symbol: token.symbol })}
      </span>
      {price === undefined && isLoading ? (
        <Skeleton
          borderRadius={3}
          containerClassName="flex items-center"
          height={10}
          width={44}
        />
      ) : (
        <>
          <span className="body-text-medium text-neutral-950">
            <ErrorBoundary fallback="-">
              {price === undefined ? '-' : <Price price={price} />}
            </ErrorBoundary>
          </span>
          <ArrowDownLeftIcon
            aria-hidden
            className="[&>path]:fill-neutral-500 [&>path]:group-hover/token-price-pill:fill-neutral-700"
          />
        </>
      )}
    </ExternalLink>
  )
}
