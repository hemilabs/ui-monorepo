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
      <div className="text-ms flex items-center gap-x-2 rounded-xl border border-solid border-neutral-300/55 p-4 font-medium leading-5">
        <DiscordFaucetIcon />
        <span className="text-neutral-950">{t('hemi-faucet')}</span>
        <ExternalLink
          className="group/link ml-auto flex items-center justify-between gap-x-1 text-orange-500 hover:text-orange-700"
          href={hemiSocials.discordUrl}
        >
          <span>{t('get-testnet-tokens')}</span>
          <ArrowDownLeftIcon className="group-hover/link:text-orange-70 [&>path]:fill-orange-500" />
        </ExternalLink>
      </div>
    </Section>
  )
}
