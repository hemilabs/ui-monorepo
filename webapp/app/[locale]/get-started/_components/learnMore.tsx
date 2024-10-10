import { ButtonLink } from 'components/button'
import { Card } from 'components/card'
import { ExternalLink } from 'components/externalLink'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Tab, Tabs } from 'ui-common/components/tabs'

type Props = {
  href: string
  heading: string
  subheading: string
}

const Box = ({ heading, href, subheading }: Props) => (
  <div className="rounded-2xl border border-solid border-neutral-300/55 bg-white">
    <ExternalLink
      className="text-ms block cursor-pointer p-4 font-medium leading-5"
      href={href}
    >
      <h5 className="text-neutral-950">{heading}</h5>
      <p className="text-neutral-500">{subheading}</p>
    </ExternalLink>
  </div>
)

const DeveloperTooling = function () {
  const t = useTranslations('get-started.learn-more-tutorials')
  return (
    <div className="flex flex-col gap-y-3">
      <Box
        heading={t('hello-world')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/using-remix-ide"
        subheading={t('learn-to-develop-hello-world')}
      />
      <Box
        heading={t('deploy-erc20')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/erc-20"
        subheading={t('learn-to-deploy-erc20')}
      />
      <Box
        heading={t('get-bitcoin-balance')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/using-remix-ide-1"
        subheading={t('learn-to-get-bitcoin-balance')}
      />
      <Box
        heading={t('set-up-safe')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/set-up-a-safe-wallet"
        subheading={t('learn-about-multisig-wallet')}
      />

      <Box
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
        heading={t('run-web-pop-miner')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/web-based-pop-miner"
        subheading={t('get-started-with-web-pop-miner')}
      />
      <Box
        heading={t('run-cli-pop-miner')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/setup-part-1"
        subheading={t('set-up-cli-pop-miner')}
      />
      <Box
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
        heading={t('set-up-evm-wallet')}
        href="https://docs.hemi.xyz/main/start-here/developers"
        subheading={t('learn-to-setup-evm-wallet')}
      />
      <Box
        heading={t('set-up-btc-wallet')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/btc-wallet-setup"
        subheading={t('learn-to-setup-btc-wallet')}
      />
      <Box
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
  return (
    <>
      <h2 className="leading-6.5 text-xl font-medium text-neutral-950">
        {t('learn-more-about-hemi')}
      </h2>
      <p className="text-ms mb-6 font-medium leading-5 text-neutral-600 md:mb-8">
        {t('subheading')}
      </p>
      <Card>
        <div className="p-1 pb-2 font-medium md:p-3 md:pb-6">
          <video
            autoPlay
            className="h-24 rounded-lg md:h-auto"
            loop
            muted
            src="/hemi.mp4"
          />
          <div className="mt-4 flex flex-col gap-y-2 px-2 md:mt-6 md:flex-row md:gap-x-6">
            <div className="mb-6">
              <h4 className="text-base text-neutral-950">{t('tutorials')}</h4>
              <p className="text-ms leading-5 text-neutral-600">
                {t('tutorials-subheading')}
              </p>
              <div className="mt-3 hidden w-fit md:block">
                <ButtonLink href="https://docs.hemi.xyz/how-to-tutorials/tutorials">
                  {tCommon('learn-more')}
                </ButtonLink>
              </div>
            </div>
            <div className="flex basis-full flex-col gap-y-4 xl:basis-1/2">
              <Tabs>
                <Tab
                  onClick={() => setSelectedTab('wallet')}
                  selected={selectedTab === 'wallet'}
                >
                  {t('learn-more-tutorials.wallet-setup')}
                </Tab>
                <Tab
                  onClick={() => setSelectedTab('dev-tooling')}
                  selected={selectedTab === 'dev-tooling'}
                >
                  {t('learn-more-tutorials.developer-tooling')}
                </Tab>
                <Tab
                  onClick={() => setSelectedTab('PoP-miner')}
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
