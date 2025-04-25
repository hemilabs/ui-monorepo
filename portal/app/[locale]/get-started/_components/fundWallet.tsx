import { useUmami } from 'app/analyticsEvents'
import { ExternalLink } from 'components/externalLink'
import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import { useNetworkType } from 'hooks/useNetworkType'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'

import btcFaucet from './icons/btcFaucet.png'
import ethFaucet from './icons/ethFaucet.png'
import moonPay from './icons/moonPay.png'
import okuDex from './icons/okuDex.png'
import sushiDex from './icons/sushiDex.png'
import { Section } from './section'

const FundMethod = function ({
  event,
  icon,
  name,
  url,
}: {
  event:
    | 'bitcoin faucet'
    | 'ethereum faucet'
    | 'fund wallet - moonpay'
    | 'fund wallet - oku'
    | 'fund wallet - sushi'
  icon: ReactNode
  name: string
  url: string
}) {
  const t = useTranslations('get-started')
  const [networkType] = useNetworkType()
  const { track } = useUmami()

  const addTracking = () => (track ? () => track?.(event) : undefined)

  return (
    <ExternalLink
      className="group/link flex w-full items-center gap-x-1 rounded-xl border border-solid border-neutral-300/55
        p-4 text-sm font-medium text-orange-500 hover:bg-neutral-50 hover:text-orange-700"
      href={url}
      onClick={addTracking()}
    >
      <div className="w-5">{icon}</div>
      <span className="ml-1 mr-auto text-neutral-950">{name}</span>
      <span className="mr-1">
        {networkType === 'testnet'
          ? t('get-testnet-tokens')
          : t('buy-sell-swap')}
      </span>
      <ArrowDownLeftIcon className="group-hover/link:text-orange-70 [&>path]:fill-orange-500" />
    </ExternalLink>
  )
}

export const FundWallet = function () {
  const t = useTranslations('get-started')
  const [networkType] = useNetworkType()
  return (
    <Section
      heading={t('add-funds-to-your-wallet')}
      step={{
        description: t('fund-your-wallets'),
        position: 2,
      }}
      subheading={t(`here-are-some-options-${networkType}`)}
    >
      <div className="flex flex-col gap-y-3 md:basis-1/2">
        {networkType === 'testnet' ? (
          <>
            <FundMethod
              event="ethereum faucet"
              icon={
                <Image
                  alt="Eth Faucet icon"
                  height={21}
                  priority
                  src={ethFaucet}
                  width={21}
                />
              }
              name={t('ethereum-faucet')}
              url="https://sepolia-faucet.pk910.de"
            />
            <FundMethod
              event="bitcoin faucet"
              icon={
                <Image
                  alt="Btc Faucet icon"
                  height={21}
                  priority
                  src={btcFaucet}
                  width={21}
                />
              }
              name={t('bitcoin-faucet')}
              url="https://coinfaucet.eu/en/btc-testnet/"
            />
          </>
        ) : (
          <>
            <FundMethod
              event="fund wallet - sushi"
              icon={
                <Image
                  alt="Sushi Dex logo"
                  height={16}
                  priority
                  src={sushiDex}
                  width={18}
                />
              }
              name={t('sushi-swap')}
              url="https://www.sushi.com/ethereum/swap"
            />
            <FundMethod
              event="fund wallet - oku"
              icon={
                <Image
                  alt="Oku Dex logo"
                  height={20}
                  priority
                  src={okuDex}
                  width={20}
                />
              }
              name={t('oku')}
              url="https://oku.trade/app/ethereum/ramp"
            />
            <FundMethod
              event="fund wallet - moonpay"
              icon={
                <Image
                  alt="Moonpay logo"
                  height={20}
                  priority
                  src={moonPay}
                  width={20}
                />
              }
              name={t('moonpay')}
              url="https://www.moonpay.com/"
            />
          </>
        )}
      </div>
    </Section>
  )
}
