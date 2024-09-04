'use client'

import { BitcoinKitIcon } from 'components/icons/bitcoinKit'
import { DemosPageIcon } from 'components/icons/demosPageIcon'
import { DexIcon } from 'components/icons/dexIcon'
import { DocsIcon } from 'components/icons/docsIcon'
// import { ElectroCardiogramIcon } from 'components/icons/electroCardiogramIcon'
import { PoPMinerIcon } from 'components/icons/popMinerIcon'
import { ToolsIcon } from 'components/icons/toolsIcon'
import { TunnelIcon } from 'components/icons/tunnelIcon'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import Link from 'next-intl/link'
import React, { Suspense } from 'react'
import { HemiLogoFull } from 'ui-common/components/hemiLogo'

import { GetStarted } from './_components/getStarted'
import { HemiExplorerLink } from './_components/hemiExplorerLink'
import { ItemLink, ItemWithSubmenu } from './_components/navItem'
import { SocialLinks } from './_components/socialLinks'
import { TermsAndConditions } from './_components/termsAndConditions'

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
  const t = useTranslations('navbar')

  return (
    <div className="md:h-98vh flex h-[calc(100dvh-56px)] flex-col px-3 pt-3 md:pt-0 [&>*]:md:ml-4 [&>*]:md:pr-4">
      <div className="hidden h-24 items-center justify-center md:flex">
        <div className="flex h-1/3 w-1/3">
          <Link className="w-full" href="/tunnel">
            <HemiLogoFull />
          </Link>
        </div>
      </div>
      <ul className="flex h-full flex-col gap-y-1 overflow-y-auto [&>li>div]:px-3">
        <li className="order-1">
          <ItemLink
            href="/tunnel"
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
            href="https://swap.hemi.xyz"
            icon={<DexIcon />}
            text={t('dex')}
          />
        </li>
        <li className="order-3">
          <Suspense>
            <HemiExplorerLink />
          </Suspense>
        </li>
        <li className="order-4">
          <ItemLink
            href="https://pop-miner.hemi.xyz"
            icon={<PoPMinerIcon />}
            text={t('web-pop-miner')}
          />
        </li>
        <li className="order-5">
          <Separator />
        </li>
        <li className="order-6">
          <ItemLink
            href="https://docs.hemi.xyz/building-bitcoin-apps/hemi-bitcoin-kit-hbk"
            icon={<BitcoinKitIcon />}
            text={t('bitcoinkit')}
          />
        </li>
        <li className="order-7">
          <ItemWithSubmenu
            icon={<ToolsIcon />}
            subMenu={
              <ul>
                <ItemLink
                  href="https://purefinance.hemi.xyz"
                  text="Pure Finance"
                />
                <ItemLink
                  href="https://discord.com/channels/1202677849887080508/1230886659222929418"
                  text="Faucet"
                />
              </ul>
            }
            text={t('tools')}
          />
        </li>
        <li className="order-8">
          <Separator />
        </li>
        <li className="order-9 mb-auto">
          <ItemLink href="/demos" icon={<DemosPageIcon />} text={t('demos')} />
        </li>
        {/* <li className="order-10 md:order-11">
          <ItemLink
            href=""
            icon={<ElectroCardiogramIcon />}
            text={t('network-status')}
          />
        </li> */}
        <li className="order-11 md:order-12">
          <ItemLink
            href="https://docs.hemi.xyz"
            icon={<DocsIcon />}
            text={t('hemidocs')}
          />
        </li>
        {/* <li className="order-12 md:order-13">
          Network Switch
        </li> */}
        <li className="order-13 md:hidden">
          <Separator />
        </li>
        <li className="order-14 md:order-10">
          <GetStarted />
        </li>
        <li className="order-15 md:order-14">
          <SocialLinks />
        </li>
        <li className="order-16 md:hidden">
          <Separator />
        </li>
        <li className="order-17 md:order-15">
          <TermsAndConditions />
        </li>
      </ul>
    </div>
  )
}
