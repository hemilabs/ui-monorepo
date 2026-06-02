import { AnalyticsEvent } from 'app/analyticsEvents'
import { ButtonLink } from 'components/button'
import { Card } from 'components/card'
import { ExternalLink } from 'components/externalLink'
import { useUmami } from 'hooks/useUmami'
import Image, { StaticImageData } from 'next/image'
import { useTranslations } from 'next-intl'

import btcWallet from '../_assets/btcWallet.svg'
import evmWallet from '../_assets/evmWallet.svg'
import tunnelToHemi from '../_assets/tunnelToHemi.svg'

import { Section } from './section'

type TutorialCardProps = {
  event: AnalyticsEvent
  heading: string
  href: string
  icon: StaticImageData
  iconAlt: string
  subheading: string
}

const TutorialCard = function ({
  event,
  heading,
  href,
  icon,
  iconAlt,
  subheading,
}: TutorialCardProps) {
  const { enabled, track } = useUmami()

  const addTracking = () => (enabled ? () => track(event) : undefined)

  return (
    <ExternalLink
      className="shadow-bs flex h-28 overflow-hidden rounded-lg bg-white transition-colors hover:bg-neutral-50"
      href={href}
      onClick={addTracking()}
    >
      <div className="flex size-28 shrink-0 items-center justify-center">
        <Image alt={iconAlt} height={112} src={icon} width={112} />
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-1 py-3 pr-4">
        <h5 className="text-sm font-semibold text-neutral-950">{heading}</h5>
        <p className="text-sm font-normal text-neutral-500">{subheading}</p>
      </div>
    </ExternalLink>
  )
}

const WalletSetup = function () {
  const t = useTranslations('get-started.learn-more-tutorials')

  return (
    <div className="flex flex-col gap-y-3">
      <TutorialCard
        event="tut - setup evm"
        heading={t('set-up-evm-wallet')}
        href="https://docs.hemi.xyz/main/start-here/developers"
        icon={evmWallet}
        iconAlt={t('set-up-evm-wallet')}
        subheading={t('learn-to-setup-evm-wallet')}
      />
      <TutorialCard
        event="tut - setup btc"
        heading={t('set-up-btc-wallet')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/btc-wallet-setup"
        icon={btcWallet}
        iconAlt={t('set-up-btc-wallet')}
        subheading={t('learn-to-setup-btc-wallet')}
      />
      <TutorialCard
        event="tut - tunnel eth"
        heading={t('tunnel-assets-to-hemi')}
        href="https://docs.hemi.xyz/how-to-tutorials/tutorials/tunnel-eth-to-hemi"
        icon={tunnelToHemi}
        iconAlt={t('tunnel-assets-to-hemi')}
        subheading={t('learn-to-tunnel-to-hemi')}
      />
    </div>
  )
}

export const LearnMore = function () {
  const t = useTranslations('get-started')
  const { enabled, track } = useUmami()

  const tutorialsUrl = 'https://docs.hemi.xyz/main/start-here'

  const addTracking = () =>
    enabled ? () => track('tut - learn more') : undefined

  return (
    <Section card={false} step={{ position: 3 }}>
      <Card>
        <div className="grid w-full grid-cols-1 font-medium lg:grid-cols-[396px_1fr] lg:items-start">
          <div className="p-6">
            <div className="flex max-w-[332px] flex-col gap-4">
              <div>
                <h3 className="text-mid-md font-semibold text-neutral-950">
                  {t('learn-how-to-use-hemi')}
                </h3>
                <p className="mt-1 font-normal text-neutral-500">
                  {t('tutorials-subheading')}
                </p>
              </div>
              <div className="w-fit [&_.button--base]:font-semibold">
                <ButtonLink
                  href={tutorialsUrl}
                  onClick={addTracking()}
                  size="xSmall"
                  variant="primary"
                >
                  {t('view-all-tutorials')}
                </ButtonLink>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="ml-auto w-full max-w-[500px]">
              <WalletSetup />
            </div>
          </div>
        </div>
      </Card>
    </Section>
  )
}
