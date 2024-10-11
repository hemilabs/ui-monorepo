import { ExternalLink } from 'components/externalLink'
import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import hemiSocials from 'hemi-socials'
import { useTranslations } from 'next-intl'

import { DiscordFaucetIcon } from './icons/discordFaucet'
import { Section } from './section'

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
      <ExternalLink
        className="group/link text-ms flex items-center gap-x-1 rounded-xl border border-solid border-neutral-300/55
        p-4 font-medium leading-5 text-orange-500 hover:bg-neutral-50 hover:text-orange-700 md:basis-1/2"
        href={hemiSocials.discordUrl}
      >
        <DiscordFaucetIcon />
        <span className="mr-auto text-neutral-950">{t('hemi-faucet')}</span>
        <span>{t('get-testnet-tokens')}</span>
        <ArrowDownLeftIcon className="group-hover/link:text-orange-70 [&>path]:fill-orange-500" />
      </ExternalLink>
    </Section>
  )
}
