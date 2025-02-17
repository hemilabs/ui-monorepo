import { useUmami, AnalyticsEvent } from 'app/analyticsEvents'
import { ButtonLink } from 'components/button'
import { Card } from 'components/card'
import { ExternalLink } from 'components/externalLink'
import { Tab, Tabs } from 'components/tabs'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import hemiBannerMobile from '../_assets/hemi-banner.svg'

type Props = {
  event: AnalyticsEvent // There are too many too list, just allow all of them
  href: string
  heading: string
  subheading: string
}

const Box = function ({ event, heading, href, subheading }: Props) {
  const { track } = useUmami()

  const addTracking = () => (track ? () => track(event) : undefined)

  return (
    <div className="rounded-2xl border border-solid border-neutral-300/55 bg-white hover:bg-gray-50">
      <ExternalLink
        className="block cursor-pointer p-4 text-sm font-medium"
        href={href}
        onClick={addTracking()}
      >
        <h5 className="text-neutral-950">{heading}</h5>
        <p className="text-neutral-500">{subheading}</p>
      </ExternalLink>
    </div>
  )
}

const DeveloperTooling = function () {
  const t = useTranslations('get-started.learn-more-tutorials')
  return (
    <div className="flex flex-col gap-y-3">
      <Box
        event="tut - hello world"
        heading={t('hello-world')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/using-remix-ide"
        subheading={t('learn-to-develop-hello-world')}
      />
      <Box
        event="tut - deploy erc20"
        heading={t('deploy-erc20')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/erc-20"
        subheading={t('learn-to-deploy-erc20')}
      />
      <Box
        event="tut - get btc balance"
        heading={t('get-bitcoin-balance')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/using-remix-ide-1"
        subheading={t('learn-to-get-bitcoin-balance')}
      />
      <Box
        event="tut - setup safe"
        heading={t('set-up-safe')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/set-up-a-safe-wallet"
        subheading={t('learn-about-multisig-wallet')}
      />
      <Box
        event="tut - create capsule"
        heading={t('create-a-capsule')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/create-a-capsule"
        subheading={t('learn-about-capsules')}
      />
    </div>
  )
}

const PoPMiner = function () {
  const t = useTranslations('get-started.learn-more-tutorials')
  return (
    <div className="flex flex-col gap-y-3">
      <Box
        event="tut - pop miner cli"
        heading={t('run-cli-pop-miner')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/setup-part-1"
        subheading={t('set-up-cli-pop-miner')}
      />
      <Box
        event="tut - add hemi"
        heading={t('add-themi-wallet')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/add-themi-to-metamask"
        subheading={t('learn-to-add-themi-wallet')}
      />
    </div>
  )
}

const WalletSetup = function () {
  const t = useTranslations('get-started.learn-more-tutorials')
  return (
    <div className="flex flex-col gap-y-3">
      <Box
        event="tut - setup evm"
        heading={t('set-up-evm-wallet')}
        href="https://docs.hemi.xyz/main/start-here/developers"
        subheading={t('learn-to-setup-evm-wallet')}
      />
      <Box
        event="tut - setup btc"
        heading={t('set-up-btc-wallet')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/btc-wallet-setup"
        subheading={t('learn-to-setup-btc-wallet')}
      />
      <Box
        event="tut - tunnel eth"
        heading={t('tunnel-eth-to-hemi')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/tunnel-eth-to-hemi"
        subheading={t('learn-to-tunnel-to-hemi')}
      />
    </div>
  )
}

export const LearnMore = function () {
  const [selectedTab, setSelectedTab] = useState<
    'wallet' | 'dev-tooling' | 'PoP-miner'
  >('wallet')
  const tCommon = useTranslations('common')
  const t = useTranslations('get-started')
  const { track } = useUmami()

  const tutorialsUrl = 'https://docs.hemi.xyz/main/start-here'

  const addTracking = () =>
    track ? () => track('tut - learn more') : undefined

  return (
    <>
      <h2 className="text-xl font-medium text-neutral-950">
        {t('learn-more-about-hemi')}
      </h2>
      <p className="mb-6 text-sm font-medium text-neutral-600 md:mb-8">
        {t('tutorials-and-tools')}
      </p>
      <Card>
        <div className="p-1 pb-2 font-medium md:p-3 md:pb-6">
          <Image
            alt="Hemi banner"
            className="h-24 w-full rounded-lg md:h-auto"
            src={hemiBannerMobile}
            style={{ objectFit: 'cover' }}
          />
          <div className="mt-4 flex flex-col gap-y-2 px-2 md:mt-6 md:flex-row md:gap-x-6">
            <div className="mb-6">
              <h4 className="text-base text-neutral-950">{t('tutorials')}</h4>
              <p className="text-sm text-neutral-600">
                {t('tutorials-subheading')}
              </p>
              <div className="mt-3 hidden w-fit md:block">
                <ButtonLink href={tutorialsUrl} onClick={addTracking()}>
                  {tCommon('learn-more')}
                </ButtonLink>
              </div>
            </div>
            <div className="flex basis-full flex-col gap-y-4 xl:basis-1/2">
              <Tabs>
                <Tab
                  onClick={function () {
                    setSelectedTab('wallet')
                    track?.('tut - wallet setup')
                  }}
                  selected={selectedTab === 'wallet'}
                >
                  {t('learn-more-tutorials.wallet-setup')}
                </Tab>
                <Tab
                  onClick={function () {
                    setSelectedTab('dev-tooling')
                    track?.('tut - dev tooling')
                  }}
                  selected={selectedTab === 'dev-tooling'}
                >
                  {t('learn-more-tutorials.developer-tooling')}
                </Tab>
                <Tab
                  onClick={function () {
                    setSelectedTab('PoP-miner')
                    track?.('tut - pop miner')
                  }}
                  selected={selectedTab === 'PoP-miner'}
                >
                  {t('learn-more-tutorials.pop-miner')}
                </Tab>
              </Tabs>
              {selectedTab === 'dev-tooling' && <DeveloperTooling />}
              {selectedTab === 'PoP-miner' && <PoPMiner />}
              {selectedTab === 'wallet' && <WalletSetup />}
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}
