import { useUmami } from 'app/analyticsEvents'
import { featureFlags } from 'app/featureFlags'
import { ExternalLink } from 'components/externalLink'
import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import hemiSocials from 'hemi-socials'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'

import { BtcFaucetIcon } from './icons/btcFaucet'
import { DiscordFaucetIcon } from './icons/discordFaucet'
import { EthFaucetIcon } from './icons/ethFaucet'
import { MoonPay } from './icons/moonPay'
import { OkuDex } from './icons/okuDex'
import { SushiDex } from './icons/sushiDex'
import { Section } from './section'

const FundMethod = function ({
  event,
  icon,
  name,
  url,
}: {
  event:
    | 'bitcoin faucet'
    | 'ethereum faucet'
    | 'hemi discord faucet'
    | 'fund wallet - moonpay'
    | 'fund wallet - oku'
    | 'fund wallet - sushi'
  icon: ReactNode
  name: string
  url: string
}) {
  const t = useTranslations('get-started')
  const [networkType] = useNetworkType()
  const { track } = useUmami()

  const addTracking = () => (track ? () => track?.(event) : undefined)

  return (
    <ExternalLink
      className="group/link flex w-full items-center gap-x-1 rounded-xl border border-solid border-neutral-300/55
        p-4 text-sm font-medium text-orange-500 hover:bg-neutral-50 hover:text-orange-700"
      href={url}
      onClick={addTracking()}
    >
      {icon}
      <span className="mr-auto text-neutral-950">{name}</span>
      <span className="mr-1">
        {networkType === 'testnet'
          ? t('get-testnet-tokens')
          : t('buy-sell-swap')}
      </span>
      <ArrowDownLeftIcon className="group-hover/link:text-orange-70 [&>path]:fill-orange-500" />
    </ExternalLink>
  )
}

export const FundWallet = function () {
  const t = useTranslations('get-started')
  const [networkType] = useNetworkType()
  return (
    <Section
      heading={t('add-funds-to-your-wallet')}
      step={{
        description: t('fund-your-wallets'),
        position: 2,
      }}
      subheading={t(`here-are-some-options-${networkType}`)}
    >
      <div className="flex flex-col gap-y-3 md:basis-1/2">
        {networkType === 'testnet' ? (
          <>
            <FundMethod
              event="hemi discord faucet"
              icon={<DiscordFaucetIcon />}
              name={t('hemi-faucet')}
              url={hemiSocials.discordUrl}
            />
            <FundMethod
              event="ethereum faucet"
              icon={<EthFaucetIcon />}
              name={t('ethereum-faucet')}
              url="https://sepolia-faucet.pk910.de"
            />
            {featureFlags.btcTunnelEnabled && (
              <FundMethod
                event="bitcoin faucet"
                icon={<BtcFaucetIcon />}
                name={t('bitcoin-faucet')}
                url="https://coinfaucet.eu/en/btc-testnet/"
              />
            )}
          </>
        ) : (
          <>
            <FundMethod
              event="fund wallet - sushi"
              icon={<SushiDex />}
              name={t('sushi-swap')}
              url="https://www.sushi.com/ethereum/swap"
            />
            <FundMethod
              event="fund wallet - oku"
              icon={<OkuDex />}
              name={t('oku')}
              url="https://oku.trade/app/ethereum/ramp"
            />
            <FundMethod
              event="fund wallet - moonpay"
              icon={<MoonPay />}
              name={t('moonpay')}
              url="https://www.moonpay.com/"
            />
          </>
        )}
      </div>
    </Section>
  )
}
