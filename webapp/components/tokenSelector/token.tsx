import { CustomTokenLogo } from 'components/customTokenLogo'
import Skeleton from 'react-loading-skeleton'
import { Token as TokenType } from 'types/token'
import { formatEvmAddress } from 'utils/format'

import { Balance } from '../balance'
import { TokenLogo } from '../tokenLogo'

export const CustomToken = ({ token }: { token: TokenType }) => (
  <div className="flex items-center gap-x-3 p-2 px-1.5 text-sm font-medium text-neutral-950">
    <div className="flex-shrink-0 flex-grow-0">
      {token ? (
        <div className="relative">
          <CustomTokenLogo size="medium" token={token} />
        </div>
      ) : (
        <Skeleton className="h-8 w-8 rounded-full" />
      )}
    </div>
    <div className="flex w-full flex-col">
      <div className="flex items-center justify-between">
        {token ? <span>{token.name}</span> : <Skeleton className="w-26 h-4" />}
      </div>
      <div className="flex items-center justify-between">
        {token ? (
          <>
            <span className="text-neutral-500">{token.symbol}</span>
            <span className="text-neutral-400">
              {/* @ts-expect-error address is 0x${string} */}
              {formatEvmAddress(token.address)}
            </span>
          </>
        ) : (
          <>
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-10" />
          </>
        )}
      </div>
    </div>
  </div>
)

export const Token = ({ token }: { token: TokenType }) => (
  <div className="flex items-center gap-x-3 p-2 text-sm font-medium text-neutral-950">
    <div className="flex-shrink-0 flex-grow-0">
      <TokenLogo size="medium" token={token} />
    </div>
    <div className="flex w-full flex-col">
      <div className="flex items-center justify-between">
        <span>{token.name}</span>
        <Balance token={token} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">{token.symbol}</span>
        {/*  Hiding as there are no usd rates so far*/}
        {/* <span>$1,234.12</span> */}
      </div>
    </div>
  </div>
)