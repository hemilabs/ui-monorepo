'use client'

import { BitcoinKitIcon } from 'components/icons/bitcoinKit'
import { DemosPageIcon } from 'components/icons/demosPageIcon'
import { DexIcon } from 'components/icons/dexIcon'
import { DocsIcon } from 'components/icons/docsIcon'
import { ElectroCardiogramIcon } from 'components/icons/electroCardiogramIcon'
import { StakeIcon } from 'components/icons/stakeIcon'
import { ToolsIcon } from 'components/icons/toolsIcon'
import { TunnelIcon } from 'components/icons/tunnelIcon'
import { Link } from 'components/link'
import { useNetworkType } from 'hooks/useNetworkType'
import { useTunnelOperationByConnectedWallet } from 'hooks/useTunnelOperationByConnectedWallet'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import React, { Suspense } from 'react'
import { getSwapUrl } from 'utils/swap'

import { Badge } from './_components/badge'
import { GetStarted } from './_components/get-started/index'
import { Help } from './_components/help'
import { HemiExplorerLink } from './_components/hemiExplorerLink'
import { HemiLogoFull } from './_components/hemiLogo'
import { ItemLink, ItemWithSubmenu, NetworkSwitch } from './_components/navItem'
import { SocialLinks } from './_components/socialLinks'

const ActionableOperations = dynamic(
  () =>
    import('components/actionableOperations').then(
      mod => mod.ActionableOperations,
    ),
  { ssr: false },
)

const Separator = () => (
  <div className="my-2 h-px w-full bg-neutral-300/55 md:my-3" />
)

export const Navbar = function () {
  const [networkType] = useNetworkType()
  const t = useTranslations('navbar')

  const href = useTunnelOperationByConnectedWallet()

  return (
    <>
      <div className="md:h-98vh flex h-[calc(100dvh-56px)] flex-col bg-white px-3 pt-3 md:pt-0 [&>*]:md:ml-3 [&>*]:md:pr-3">
        <div className="hidden h-24 items-center justify-between md:flex">
          <div className="flex items-center gap-x-2">
            <Link className="w-full" href={href}>
              <HemiLogoFull />
            </Link>
            <Badge />
          </div>
          <Help />
        </div>
        <ul className="flex h-[calc(100dvh-240px)] flex-col gap-y-1 overflow-y-auto md:h-full [&>li>div]:px-3">
          <li className="order-1">
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
          <li className="order-2">
            <ItemLink
              event="nav - stake"
              href="/stake/dashboard"
              icon={<StakeIcon />}
              text={t('stake')}
              urlToBeSelected="/stake"
            />
          </li>
          <li className="order-3">
            <ItemLink
              event="nav - dex"
              href={getSwapUrl(networkType)}
              icon={<DexIcon />}
              text={t('swap')}
            />
          </li>
          <li className="order-4">
            <Suspense>
              <HemiExplorerLink />
            </Suspense>
          </li>
          <li className="order-5">
            <Separator />
          </li>
          <li className="order-6">
            <ItemLink
              event="nav - hbk"
              href="https://docs.hemi.xyz/building-bitcoin-apps/hemi-bitcoin-kit-hbk"
              icon={<BitcoinKitIcon />}
              text={t('bitcoinkit')}
            />
          </li>
          <li className="order-7">
            <ItemWithSubmenu
              event="nav - tools"
              icon={<ToolsIcon />}
              subMenu={
                <>
                  <ItemLink
                    event="nav - pure finance"
                    href="https://purefinance.hemi.xyz"
                    text="Pure Finance"
                  />
                </>
              }
              text={t('tools')}
            />
          </li>
          <li className="order-8">
            <Separator />
          </li>
          <li className="order-9 mb-auto">
            <ItemLink
              event="nav - demos"
              href="/demos"
              icon={<DemosPageIcon />}
              text={t('demos')}
            />
          </li>
          <li className="order-10 md:order-11">
            <ItemLink
              event="nav - network status"
              href="https://hemistatus.com"
              icon={<ElectroCardiogramIcon />}
              text={t('network-status')}
            />
          </li>
          <li className="order-11 md:order-12">
            <ItemLink
              event="nav - docs"
              href="https://docs.hemi.xyz"
              icon={<DocsIcon />}
              text={t('hemidocs')}
            />
          </li>
          <li className="order-12 md:hidden">
            <Separator />
          </li>
          <li className="order-13 md:hidden">
            <Help />
          </li>
          <li className="md:order-13 hidden md:block">
            <NetworkSwitch />
          </li>
          <li className="hidden md:order-10 md:block">
            <GetStarted />
          </li>
          <li className="md:order-14 hidden md:block">
            <SocialLinks />
          </li>
        </ul>
      </div>
      <ul className="fixed bottom-0 w-full border-t border-neutral-300 bg-neutral-50 px-3 pt-4 md:hidden">
        <li className="rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-1">
          <NetworkSwitch />
        </li>
        <li className="mt-3">
          <GetStarted />
        </li>
        <li>
          <SocialLinks />
        </li>
      </ul>
    </>
  )
}
