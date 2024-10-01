import { ExternalLink } from 'components/externalLink'
import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import { useChain } from 'hooks/useChain'
import { useTranslations } from 'next-intl'
import { RemoteChain } from 'types/chain'

type Props = {
  chainId: RemoteChain['id']
  txHash: string
}
export const SeeOnExplorer = function ({ chainId, txHash }: Props) {
  const t = useTranslations('tunnel-page.transaction-status')
  const blockExplorer = useChain(chainId).blockExplorers.default
  return (
    <ExternalLink
      className="text-ms group/see-on-explorer flex items-center gap-x-1 font-medium leading-5 text-orange-500"
      href={`${blockExplorer.url}/tx/${txHash}`}
    >
      <span className="group-hover/see-on-explorer:text-orange-700">
        {t('see-on-explorer', { explorer: blockExplorer.name })}
      </span>
      <ArrowDownLeftIcon className="[&>path]:fill-orange-500 [&>path]:group-hover/see-on-explorer:fill-orange-700" />
    </ExternalLink>
  )
}
