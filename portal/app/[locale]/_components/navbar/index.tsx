'use client'

import { BitcoinKitIcon } from 'components/icons/bitcoinKit'
import { DocsIcon } from 'components/icons/docsIcon'
import { EcosystemIcon } from 'components/icons/ecosystemIcon'
import { NetworkStatusIcon } from 'components/icons/networkStatusIcon'
import { StakeIcon } from 'components/icons/stakeIcon'
import { TunnelIcon } from 'components/icons/tunnelIcon'
import { Link } from 'components/link'
import { useTunnelOperationByConnectedWallet } from 'hooks/useTunnelOperationByConnectedWallet'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import React, { Suspense } from 'react'

import { Badge } from './_components/badge'
import { Dex } from './_components/dex'
import { GetStarted } from './_components/getStarted'
import { Help } from './_components/help'
import { HemiExplorerLink } from './_components/hemiExplorerLink'
import { HemiLogoFull } from './_components/hemiLogo'
import { ItemLink, NetworkSwitch } from './_components/navItem'
import { SocialLinks } from './_components/socialLinks'
import { Tvl } from './_components/tvl'

const ActionableOperations = dynamic(
  () =>
    import('components/actionableOperations').then(
      mod => mod.ActionableOperations,
    ),
  { ssr: false },
)

const Separator = () => <div className="my-1 h-px w-full bg-neutral-100" />

export const Navbar = function () {
  const t = useTranslations('navbar')

  const href = useTunnelOperationByConnectedWallet()

  return (
    <>
      <div className="md:h-98vh flex h-[calc(100dvh-56px)] flex-col overflow-visible bg-white px-3 pt-3 md:pt-0">
        <div className="lg:h-18 hidden h-24 items-center justify-between md:flex md:h-16 [&>*]:md:ml-2">
          <div className="flex items-center justify-start gap-x-2">
            <Link className="w-full" href={href}>
              <HemiLogoFull />
            </Link>
            <Badge />
          </div>
          <Help />
        </div>
        <ul className="flex h-[calc(100dvh-170px)] flex-col gap-y-[2px] overflow-y-auto md:mt-2 md:h-full lg:h-full [&>li>div]:px-2">
          <li>
            <ItemLink
              event="nav - tunnel"
              href={href}
              icon={<TunnelIcon />}
              rightSection={
                <div className="ml-auto">
                  <ActionableOperations />
                </div>
              }
              text={t('tunnel')}
            />
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
            <Suspense>
              <HemiExplorerLink />
            </Suspense>
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
