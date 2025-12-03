import { ExternalLink } from 'components/externalLink'
import { useHemi } from 'hooks/useHemi'
import { formatEvmAddress } from 'utils/format'
import { Address } from 'viem'

type Props = {
  address: Address
}
export const PoolAddress = function ({ address }: Props) {
  const hemi = useHemi()
  return (
    <span className="body-text-normal text-neutral-500 hover:text-neutral-950">
      <ExternalLink
        href={`${hemi.blockExplorers!.default.url}/address/${address}`}
      >
        {formatEvmAddress(address)}
      </ExternalLink>
    </span>
  )
}
