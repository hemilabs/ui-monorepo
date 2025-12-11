'use client'

import { BitcoinKitIcon } from 'components/icons/bitcoinKit'
import { DocsIcon } from 'components/icons/docsIcon'
import { EcosystemIcon } from 'components/icons/ecosystemIcon'
import { NetworkStatusIcon } from 'components/icons/networkStatusIcon'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

import { Badge } from '../badge'

import { BitcoinYield } from './_components/bitcoinYield'
import { Dex } from './_components/dex'
import { GenesisDrop } from './_components/genesisDrop'
import { GetStarted } from './_components/getStarted'
import { HelpButton } from './_components/help/helpButton'
import { HemiExplorerLink } from './_components/hemiExplorerLink'
import { HomeLink } from './_components/homeLink'
import { ItemLink } from './_components/itemLink'
import { NetworkSwitch } from './_components/navItem'
import { SocialLinks } from './_components/socialLinks'
import { Stake } from './_components/stake'
import { TunnelLink } from './_components/tunnelLink'
import { Tvl } from './_components/tvl'
import { VideoAsset } from './_components/videoAsset'

const Separator = () => <div className="my-1 h-px w-full bg-neutral-100" />

const Help = dynamic(() => import('./_components/help').then(mod => mod.Help), {
  // Render the closed version of the help button
  loading: () => <HelpButton isOpen={false} />,
  ssr: false,
})

const PaddedListItem = ({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) => <li className={`[&>div]:px-2 ${className}`}>{children}</li>

export const NavbarDesktop = function () {
  const t = useTranslations('navbar')

  return (
    <div className="w-54 relative flex h-full flex-col justify-between overflow-x-hidden bg-white pt-3">
      <div className="mb-6 flex items-center justify-between px-3">
        <div className="ml-2 flex items-center justify-start gap-x-2">
          <HomeLink />
          <Badge />
        </div>
        <Help />
      </div>
      <ul className="z-10 flex h-full flex-col gap-y-0.5 overflow-y-auto overflow-x-hidden [&>li:not(.no-padding)]:px-3">
        <PaddedListItem>
          <BitcoinYield />
        </PaddedListItem>
        <PaddedListItem>
          <TunnelLink />
        </PaddedListItem>
        <PaddedListItem>
          <Dex />
        </PaddedListItem>
        <PaddedListItem>
          <GenesisDrop />
        </PaddedListItem>
        <Stake />
        <PaddedListItem>
          <Separator />
        </PaddedListItem>
        <PaddedListItem>
          <ItemLink
            event="nav - ecosystem"
            href="/ecosystem"
            icon={<EcosystemIcon />}
            text={t('ecosystem')}
          />
        </PaddedListItem>
        <PaddedListItem>
          <ItemLink
            event="nav - hbk"
            href="https://docs.hemi.xyz/building-bitcoin-apps/hemi-bitcoin-kit-hbk"
            icon={<BitcoinKitIcon />}
            text={t('bitcoinkit')}
          />
        </PaddedListItem>
        <PaddedListItem>
          <ItemLink
            event="nav - docs"
            href="https://docs.hemi.xyz"
            icon={<DocsIcon />}
            text={t('docs')}
          />
        </PaddedListItem>
        <PaddedListItem>
          <Separator />
        </PaddedListItem>
        <PaddedListItem>
          <HemiExplorerLink />
        </PaddedListItem>
        <PaddedListItem>
          <ItemLink
            event="nav - network status"
            href="https://hemistatus.com"
            icon={<NetworkStatusIcon />}
            text={t('network-status')}
          />
        </PaddedListItem>
        <PaddedListItem>
          <NetworkSwitch />
        </PaddedListItem>
      </ul>
      <div className="relative w-full px-3">
        <ul className="flex flex-col">
          <li className="no-padding relative mt-auto">
            <VideoAsset />
          </li>
          <li className="mt-auto">
            <GetStarted />
          </li>
          <li>
            <Tvl />
          </li>
          <li>
            <SocialLinks />
          </li>
        </ul>
      </div>
    </div>
  )
}
