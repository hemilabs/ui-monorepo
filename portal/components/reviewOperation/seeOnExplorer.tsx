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
  // chainId can only be used here if coming from a valid known chain to us
  const blockExplorer = useChain(chainId)!.blockExplorers!.default
  const t = useTranslations('tunnel-page.transaction-status')

  if (!txHash) {
    return null
  }

  return (
    <ExternalLink
      className="group/see-on-explorer flex items-center gap-x-1 text-sm font-medium text-orange-600"
      href={`${blockExplorer.url}/tx/${txHash}`}
    >
      <span className="group-hover/see-on-explorer:text-orange-700">
        {t('see-in-explorer')}
      </span>
      <ArrowDownLeftIcon className="[&>path]:fill-orange-600 [&>path]:group-hover/see-on-explorer:fill-orange-700" />
    </ExternalLink>
  )
}
