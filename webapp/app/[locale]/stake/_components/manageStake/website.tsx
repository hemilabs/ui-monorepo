import { ExternalLink } from 'components/externalLink'
import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import { useTranslations } from 'next-intl'
import { StakeToken } from 'types/stake'

const websitesMap: Partial<
  Record<StakeToken['extensions']['protocol'], string>
> = {
  bedRock: 'https://www.bedrock.technology',
  bitFi: 'https://www.bitfi.one/#waitlist',
  exSat: 'https://exsat.network/app/bridge',
  lorenzo: 'https://app.lorenzo-protocol.xyz/staking',
  merlinChain: 'https://merlinchain.io/bridge',
  // TODO add nodeDao website https://github.com/hemilabs/ui-monorepo/issues/794
  pumpBtc: 'https://mainnet.pumpbtc.xyz',
  solv: 'https://app.solv.finance/solvbtc?network=bitcoin-mainnet',
  stakeStone: 'https://app.stakestone.io/u/sbtc/stake',
  uniRouter: 'https://app.unirouter.io',
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
