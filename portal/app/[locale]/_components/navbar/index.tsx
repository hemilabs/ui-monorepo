'use client'

import { BitcoinKitIcon } from 'components/icons/bitcoinKit'
import { DocsIcon } from 'components/icons/docsIcon'
import { EcosystemIcon } from 'components/icons/ecosystemIcon'
import { NetworkStatusIcon } from 'components/icons/networkStatusIcon'
import { StakeIcon } from 'components/icons/stakeIcon'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

import { Badge } from '../badge'

import { Dex } from './_components/dex'
import { GetStarted } from './_components/getStarted'
import { HelpButton } from './_components/help/helpButton'
import { HemiExplorerLink } from './_components/hemiExplorerLink'
import { HomeLink } from './_components/homeLink'
import { ItemLink } from './_components/itemLink'
import { NetworkSwitch } from './_components/navItem'
import { SocialLinks } from './_components/socialLinks'
import { TunnelLink } from './_components/tunnelLink'
import { Tvl } from './_components/tvl'

const Separator = () => <div className="my-1 h-px w-full bg-neutral-100" />

const Help = dynamic(() => import('./_components/help').then(mod => mod.Help), {
  // Render the closed version of the help button
  loading: () => <HelpButton isOpen={false} />,
  ssr: false,
})

export const Navbar = function () {
  const t = useTranslations('navbar')

  return (
    <>
      <div className="md:h-98vh flex h-[calc(100dvh-56px)] flex-col overflow-visible bg-white px-3 pt-3 md:pt-0">
        <div className="lg:h-18 hidden h-24 items-center justify-between md:flex md:h-16 [&>*]:md:ml-2">
          <div className="flex items-center justify-start gap-x-2">
            <HomeLink />
            <Badge />
          </div>
          <Help />
        </div>
        <ul className="flex h-[calc(100dvh-170px)] flex-col gap-y-[2px] overflow-visible md:mt-2 md:h-full [&>li>div]:px-2">
          <li>
            <TunnelLink />
          </li>
          <li>
            <Dex />
          </li>
          <li>
            <ItemLink
              event="nav - stake"
              href="/stake/dashboard"
              icon={<StakeIcon />}
              text={t('stake')}
              urlToBeSelected="/stake"
            />
          </li>
          <li>
            <Separator />
          </li>
          <li>
            <ItemLink
              event="nav - ecosystem"
              href="/ecosystem"
              icon={<EcosystemIcon />}
              text={t('ecosystem')}
            />
          </li>
          <li>
            <ItemLink
              event="nav - hbk"
              href="https://docs.hemi.xyz/building-bitcoin-apps/hemi-bitcoin-kit-hbk"
              icon={<BitcoinKitIcon />}
              text={t('bitcoinkit')}
            />
          </li>
          <li>
            <ItemLink
              event="nav - docs"
              href="https://docs.hemi.xyz"
              icon={<DocsIcon />}
              text={t('docs')}
            />
          </li>
          <li>
            <Separator />
          </li>
          <li>
            <HemiExplorerLink />
          </li>
          <li>
            <ItemLink
              event="nav - network status"
              href="https://hemistatus.com"
              icon={<NetworkStatusIcon />}
              text={t('network-status')}
            />
          </li>
          <li className="mb-auto md:block">
            <NetworkSwitch />
          </li>
          <li className="md:hidden">
            <Help />
          </li>
          <li className="hidden md:block">
            <GetStarted />
          </li>
          <li className="order-first md:order-none">
            <Tvl />
          </li>
          <li className="hidden md:block">
            <SocialLinks />
          </li>
        </ul>
      </div>
      <ul className="fixed bottom-0 w-full border-t border-neutral-300 bg-neutral-50 px-3 pt-4 md:hidden">
        <li>
          <SocialLinks />
        </li>
        <li>
          <GetStarted />
        </li>
      </ul>
    </>
  )
}
