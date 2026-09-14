import { ChainLogo } from 'components/chainLogo'
import { Tooltip } from 'components/tooltip'
import { useChain } from 'hooks/useChain'
import { type RemoteChain } from 'types/chain'

type Props = {
  chainId: RemoteChain['id']
}

// The column is 125px wide and the logo and the gap take 26 of those. Shrinking
// is not an option: the tooltip wraps the content in a div of its own, whose
// automatic minimum size is the full width of the name.
export const Chain = function ({ chainId }: Props) {
  const chain = useChain(chainId)
  return (
    <Tooltip
      id={`chain-name-${chainId}`}
      text={chain?.name}
      // the row opens the operation details on click, so the tooltip must not react to it
      trigger={['hover', 'focus']}
      variant="simple"
    >
      <div className="flex items-center gap-x-1.5">
        <ChainLogo chainId={chainId} />
        <span className="max-w-[99px] truncate capitalize text-neutral-950">
          {chain?.name ?? '-'}
        </span>
      </div>
    </Tooltip>
  )
}
