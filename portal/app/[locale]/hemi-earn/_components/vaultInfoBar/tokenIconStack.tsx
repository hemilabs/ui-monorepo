import { type Address, type Chain } from 'viem'

import { TokenDisplay } from '../tokenDisplay'

type StackToken = {
  address: Address
  chainId: Chain['id']
}

type Props = {
  interactive?: boolean
  tokens: StackToken[]
  wrapperClassName?: string
}

export const TokenIconStack = function ({
  interactive = false,
  tokens,
  wrapperClassName = '',
}: Props) {
  if (tokens.length === 0) {
    return <span className="body-text-medium text-neutral-950">-</span>
  }

  const hasMultiple = tokens.length > 1

  return (
    <div
      className={`flex items-center ${
        hasMultiple && interactive ? 'group' : ''
      } ${wrapperClassName}`}
    >
      {tokens.map((token, index) => (
        <div
          className={
            index === 0
              ? hasMultiple && interactive
                ? 'transition-transform duration-200 group-hover:-translate-x-0.5'
                : ''
              : `-ml-1.5 rounded-full border ${
                  interactive
                    ? 'border-white transition-all duration-200 group-hover:ml-0.5'
                    : 'border-neutral-100'
                }`
          }
          key={`${token.chainId}:${token.address}`}
        >
          <TokenDisplay
            address={token.address}
            chainId={token.chainId}
            size="small"
          />
        </div>
      ))}
    </div>
  )
}
