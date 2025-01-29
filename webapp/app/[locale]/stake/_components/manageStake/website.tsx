import { ExternalLink } from 'components/externalLink'
import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import { useTranslations } from 'next-intl'
import { StakeToken } from 'types/stake'

const websitesMap: Partial<
  Record<StakeToken['extensions']['protocol'], string>
> = {
  bedRock: 'https://www.bedrock.technology',
  bitFi: 'https://www.bitfi.one',
  exSat: 'https://exsat.network',
  lorenzo: 'https://lorenzo-protocol.xyz',
  merlinChain: 'https://merlinchain.io',
  nodeDao: 'https://www.nodedao.com',
  pumpBtc: 'https://mainnet.pumpbtc.xyz',
  solv: 'https://solv.finance',
  stakeStone: 'https://stakestone.io/#/home',
  uniRouter: 'https://www.unirouter.io/#',
}

type Props = {
  token: StakeToken
}

export const Website = function ({ token }: Props) {
  const t = useTranslations('common')
  return (
    <>
      {websitesMap[token.extensions.protocol] ? (
        <ExternalLink
          className="group/link flex cursor-pointer items-center gap-x-1 text-sm font-medium text-neutral-500"
          href={websitesMap[token.extensions.protocol]}
        >
          <span className="group-hover/link:text-neutral-700">{t('open')}</span>
          <ArrowDownLeftIcon className="[&>path]:fill-neutral-500 [&>path]:group-hover/link:fill-neutral-700" />
        </ExternalLink>
      ) : (
        <span className="text-neutral-500">-</span>
      )}
    </>
  )
}
