import { ExternalLink } from 'components/externalLink'
import { TokenLogo } from 'components/tokenLogo'
import { useChain } from 'hooks/useChain'
import { type Token } from 'types/token'
import { formatEvmAddress } from 'utils/format'
import { type Address } from 'viem'

type Props = {
  token: Token
  vaultAddress: Address
}

export const PoolData = function ({ token, vaultAddress }: Props) {
  const chain = useChain(token.chainId)

  return (
    <div className="flex items-center gap-x-3">
      <div className="flex size-10 shrink-0 items-center justify-center overflow-clip rounded-lg bg-neutral-50">
        <TokenLogo size="medium" token={token} version="L1" />
      </div>
      <div className="flex flex-col">
        <span className="body-text-medium text-neutral-950">
          {token.symbol}
        </span>
        <span className="body-text-normal text-neutral-500 hover:text-neutral-950">
          <ExternalLink
            href={`${chain?.blockExplorers?.default.url}/address/${vaultAddress}`}
          >
            {formatEvmAddress(vaultAddress)}
          </ExternalLink>
        </span>
      </div>
    </div>
  )
}
