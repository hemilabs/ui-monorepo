import { featureFlags } from 'app/featureFlags'
import { lazyWithFallback } from 'components/lazyWithFallback'
import { ReactNode } from 'react'

import { Badge } from '../badge'

import { BitcoinKitLink } from './_components/bitcoinKitLink'
import { Dex } from './_components/dex'
import { DocsLink } from './_components/docsLink'
import { EcosystemLink } from './_components/ecosystemLink'
import { GenesisDrop } from './_components/genesisDrop'
import { GetStarted } from './_components/getStarted'
import { HelpButton } from './_components/help/helpButton'
import { HemiEarn } from './_components/hemiEarn'
import { HemiExplorerLink } from './_components/hemiExplorerLink'
import { HemiStatusLink } from './_components/hemiStatusLink'
import { HomeLink } from './_components/homeLink'
import { NetworkSwitch } from './_components/networkSwitch'
import { SocialLinks } from './_components/socialLinks'
import { StakeDesktop } from './_components/stake'
import { TunnelLink } from './_components/tunnelLink'
import { Tvl } from './_components/tvl'
import { VideoAsset } from './_components/videoAsset'

const Separator = () => <div className="my-1 h-px w-full bg-neutral-100" />

const Help = lazyWithFallback(
  () => import('./_components/help').then(mod => ({ default: mod.Help })),
  <HelpButton isOpen={false} />,
)

const PaddedListItem = ({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) => <li className={`[&>div]:px-2 ${className}`}>{children}</li>

export const NavbarDesktop = () => (
  <div className="relative flex h-full w-54 flex-col justify-between overflow-x-hidden bg-white pt-3">
    <div className="mb-6 flex items-center justify-between px-3">
      <div className="ml-2 flex items-center justify-start gap-x-2">
        <HomeLink />
        <Badge />
      </div>
      <Help />
    </div>
    <ul className="z-10 flex h-full flex-col gap-y-0.5 overflow-y-auto overflow-x-hidden [&>li:not(.no-padding)]:px-3">
      {featureFlags.enableHemiEarnPage && (
        <PaddedListItem>
          <HemiEarn />
        </PaddedListItem>
      )}
      <PaddedListItem>
        <TunnelLink />
      </PaddedListItem>
      <PaddedListItem>
        <Dex />
      </PaddedListItem>
      <PaddedListItem>
        <GenesisDrop />
      </PaddedListItem>
      <StakeDesktop />
      <PaddedListItem>
        <Separator />
      </PaddedListItem>
      <PaddedListItem>
        <EcosystemLink />
      </PaddedListItem>
      <PaddedListItem>
        <BitcoinKitLink />
      </PaddedListItem>
      <PaddedListItem>
        <DocsLink />
      </PaddedListItem>
      <PaddedListItem>
        <Separator />
      </PaddedListItem>
      <PaddedListItem>
        <HemiExplorerLink />
      </PaddedListItem>
      <PaddedListItem>
        <HemiStatusLink />
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
          <div className="mx-4 mb-4 md:mx-0 md:mb-0">
            <GetStarted />
          </div>
        </li>
        <li>
          <Tvl />
        </li>
        <li>
          <div className="flex flex-wrap items-center justify-between overflow-visible p-3">
            <SocialLinks />
          </div>
        </li>
      </ul>
    </div>
  </div>
)
