import { ExternalLink } from 'components/externalLink'
import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import { useChain } from 'hooks/useChain'
import { useTranslations } from 'next-intl'
import { type Chain, isAddress } from 'viem'

type Props = {
  address: string
  chainId: Chain['id']
}
export const SeeOnExplorer = function ({ address, chainId }: Props) {
  const blockExplorer = useChain(chainId).blockExplorers.default
  const t = useTranslations('token-custom-drawer')

  return (
    <ExternalLink
      className="group/see-on-explorer flex items-center gap-x-1 text-sm font-medium text-neutral-500"
      {...(isAddress(address)
        ? { href: `${blockExplorer.url}/address/${address}` }
        : {})}
    >
      <span className="group-hover/see-on-explorer:text-neutral-700">
        {t('see-on-explorer', { explorer: blockExplorer.name })}
      </span>
      <ArrowDownLeftIcon className="[&>path]:fill-neutral-500 [&>path]:group-hover/see-on-explorer:fill-neutral-700" />
    </ExternalLink>
  )
}
