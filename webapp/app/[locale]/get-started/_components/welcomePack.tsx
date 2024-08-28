'use client'

import { bitcoinTestnet } from 'btc-wallet/chains'
import { ExternalLink } from 'components/externalLink'
import hemiSocials from 'hemi-socials'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { type Chain } from 'viem'
import { sepolia } from 'viem/chains'

import { Btc } from './icons/btc'
import { Eth } from './icons/eth'
import { Hemi } from './icons/hemi'

const giveAwayTokens = (chain: Chain) =>
  chain.testnet
    ? [
        {
          amount: 0.2,
          icon: <Eth />,
          symbol: `${sepolia.nativeCurrency.symbol} (Sepolia Ether)`,
        },
        {
          amount: 0.2,
          icon: <Eth />,
          symbol: `${chain.nativeCurrency.symbol} (Tunneled Sepolia Ether)`,
        },
        {
          amount: 0.1,
          icon: <Btc />,
          symbol: `${bitcoinTestnet.nativeCurrency.symbol} (Testnet Bitcoin)`,
        },
        {
          amount: 1,
          icon: <Hemi />,
          symbol: 'tHEMI (Testnet Hemi)',
        },
      ]
    : // mainnet capsules not confirmed
      []

const CoinRow = ({
  amount,
  icon,
  symbol,
}: {
  amount?: number
  icon?: React.ReactNode
  symbol: string
}) => (
  <div className="flex w-fit items-center gap-x-2 rounded-lg bg-orange-100 px-2 py-1.5">
    {icon}
    <span className="text-sm font-medium text-orange-950">
      {[amount, symbol].filter(Boolean).join(' ')}
    </span>
  </div>
)

const { discordUrl } = hemiSocials

export const WelcomePack = function () {
  const hemi = useHemi()
  const t = useTranslations('get-started')

  return (
    <>
      <h4 className="w-full text-xl font-medium text-slate-900">
        {t('network.welcome-pack')}
      </h4>
      <p className="pt-2 text-sm text-slate-500">
        {t.rich('network.welcome-pack-description', {
          channel: (chunk: string) => (
            <span className="font-medium text-black">{chunk}</span>
          ),
        })}
      </p>
      <div className="flex flex-col gap-y-2 py-8">
        {giveAwayTokens(hemi).map(({ amount, icon, symbol }) => (
          <CoinRow amount={amount} icon={icon} key={symbol} symbol={symbol} />
        ))}
      </div>
      <div className="flex flex-col gap-y-3">
        <ExternalLink
          className="flex h-14 w-full cursor-pointer items-center justify-center rounded-xl bg-orange-950 text-lg text-white hover:bg-opacity-80"
          href={discordUrl}
        >
          {t('network.claim-my-tokens')}
        </ExternalLink>
      </div>
    </>
  )
}
