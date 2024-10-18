import { useUmami } from 'app/analyticsEvents'
import { featureFlags } from 'app/featureFlags'
import { ExternalLink } from 'components/externalLink'
import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import hemiSocials from 'hemi-socials'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'

import { BtcFaucetIcon } from './icons/btcFaucet'
import { DiscordFaucetIcon } from './icons/discordFaucet'
import { EthFaucetIcon } from './icons/ethFaucet'
import { Section } from './section'

const Faucet = function ({
  event,
  icon,
  name,
  url,
}: {
  event: 'bitcoin faucet' | 'ethereum faucet' | 'hemi discord faucet'
  icon: ReactNode
  name: string
  url: string
}) {
  const t = useTranslations('get-started')
  const { track } = useUmami()

  const addTracking = () => (track ? () => track?.(event) : undefined)

  return (
    <ExternalLink
      className="group/link text-ms flex w-full items-center gap-x-1 rounded-xl border border-solid
        border-neutral-300/55 p-4 font-medium leading-5 text-orange-500 hover:bg-neutral-50 hover:text-orange-700"
      href={url}
      onClick={addTracking()}
    >
      {icon}
      <span className="mr-auto text-neutral-950">{name}</span>
      <span className="mr-1">{t('get-testnet-tokens')}</span>
      <ArrowDownLeftIcon className="group-hover/link:text-orange-70 [&>path]:fill-orange-500" />
    </ExternalLink>
  )
}

export const FundWallet = function () {
  const t = useTranslations('get-started')
  return (
    <Section
      heading={t('add-funds-to-your-wallet')}
      step={{
        description: t('fund-your-wallets'),
        position: 2,
      }}
      subheading={t('here-are-some-options')}
    >
      <div className="flex flex-col gap-y-3 md:basis-1/2">
        <Faucet
          event="hemi discord faucet"
          icon={<DiscordFaucetIcon />}
          name={t('hemi-faucet')}
          url={hemiSocials.discordUrl}
        />
        <Faucet
          event="ethereum faucet"
          icon={<EthFaucetIcon />}
          name={t('ethereum-faucet')}
          url="https://sepolia-faucet.pk910.de"
        />
        {featureFlags.btcTunnelEnabled && (
          <Faucet
            event="bitcoin faucet"
            icon={<BtcFaucetIcon />}
            name={t('bitcoin-faucet')}
            url="https://coinfaucet.eu/en/btc-testnet/"
          />
        )}
      </div>
    </Section>
  )
}
