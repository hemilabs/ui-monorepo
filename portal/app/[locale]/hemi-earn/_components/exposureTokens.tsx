import { type Address, type Chain } from 'viem'

import { TokenDisplay } from './tokenDisplay'

type ExposureToken = {
  address: Address
  chainId: Chain['id']
}

type Props = {
  tokens: ExposureToken[]
}

export const ExposureTokens = function ({ tokens }: Props) {
  if (tokens.length === 0) {
    return null
  }

  const hasMultiple = tokens.length > 1

  return (
    <div className={`flex items-center ${hasMultiple ? 'group' : ''}`}>
      {tokens.map((token, index) => (
        <div
          className={
            index === 0
              ? `z-10 ${
                  hasMultiple
                    ? 'transition-transform duration-200 group-hover:-translate-x-0.5'
                    : ''
                }`
              : '-ml-2 rounded-full border border-white transition-all duration-200 group-hover:ml-0.5'
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
