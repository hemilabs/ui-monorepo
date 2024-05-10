'use client'

import { bridgeableNetworks, hemi } from 'app/networks'
import dynamic from 'next/dynamic'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect } from 'react'
import { HemiSymbol } from 'ui-common/components/hemiLogo'
import { Tabs, Tab } from 'ui-common/components/tabs'
import { type Chain } from 'viem'

const AddChain = dynamic(
  () => import('app/[locale]/get-started/addChain').then(mod => mod.AddChain),
  {
    ssr: false,
  },
)

const EthLogo = () => (
  <svg fill="none" height={24} width={24} xmlns="http://www.w3.org/2000/svg">
    <circle cx={12} cy={12} fill="#343434" fillOpacity={0.15} r={12} />
    <path
      d="m11.998 3-.121.41v11.902l.12.12 5.525-3.265L11.998 3Z"
      fill="#343434"
    />
    <path d="m11.996 3-5.524 9.167 5.524 3.266V3Z" fill="#8C8C8C" />
    <path
      d="m11.998 16.477-.068.083v4.24l.068.198 5.528-7.785-5.528 3.264Z"
      fill="#3C3C3B"
    />
    <path d="M11.996 20.998v-4.521l-5.524-3.264 5.524 7.785Z" fill="#8C8C8C" />
    <path d="m12 15.439 5.525-3.266L12 9.662v5.777Z" fill="#141414" />
    <path d="m6.472 12.173 5.524 3.266V9.662l-5.524 2.511Z" fill="#393939" />
  </svg>
)

type NetworkConfiguration = 'automatic' | 'manual'

const useSelectedTab = function (
  defaultConfiguration: NetworkConfiguration = 'automatic',
) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(
    function redirectToDefaultConfigurationIfInvalid() {
      if (
        ['automatic', 'manual'].some(
          c => searchParams.get('networkConfiguration') === c,
        )
      ) {
        return undefined
      }
      const current = new URLSearchParams(Array.from(searchParams.entries()))
      current.append('networkConfiguration', defaultConfiguration)
      router.replace(`${pathname}?${current.toString()}`)
      return undefined
    },
    [defaultConfiguration, pathname, router, searchParams],
  )

  return (searchParams.get('networkConfiguration') ??
    defaultConfiguration) as NetworkConfiguration
}

const ConfigurationPropTitle = ({
  children,
  order,
}: {
  children: string
  order: string
}) => <p className={`text-zinc-500 ${order}`}>{children}</p>

const ExternalLink = ({
  href,
  order,
  ...props
}: { order: string } & React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
>) => (
  <a
    className={`cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-rose-400 ${order}`}
    href={href}
    rel="noopener noreferrer"
    target="_blank"
    {...props}
  >
    {href}
  </a>
)

type ChainRowProps = {
  chain: Chain
  layer: number
  logo: React.ReactNode
}

const ChainRow = function ({ chain, layer, logo }: ChainRowProps) {
  const t = useTranslations('get-started.network')

  return (
    <div className="flex flex-col gap-y-6 lg:flex-row lg:justify-between">
      <div className="flex items-center gap-x-3 text-sm font-medium">
        {logo}
        <div className="flex flex-row gap-x-2">
          <p>{chain.name}</p>
          <span className="text-neutral-400">·</span>
          <span className="text-neutral-400">{t('layer', { layer })}</span>
        </div>
      </div>
      <div className="flex items-center gap-x-4 lg:w-44">
        <AddChain chain={chain} />
      </div>
    </div>
  )
}

const AutomaticConfiguration = function () {
  const ethereum = bridgeableNetworks.at(-1)

  return (
    <div className="flex flex-col gap-y-6 py-2 lg:gap-y-9">
      <ChainRow chain={ethereum} layer={1} logo={<EthLogo />} />
      <ChainRow
        chain={hemi}
        layer={2}
        logo={
          <div className="h-6 w-6">
            <HemiSymbol />
          </div>
        }
      />
    </div>
  )
}

const ManualConfiguration = function () {
  const t = useTranslations('get-started.network')
  const ethereum = bridgeableNetworks.at(-1)

  return (
    <div className="grid grid-cols-1 gap-y-4 rounded-lg bg-white text-black xl:grid-cols-2 2xl:grid-cols-3 [&>a]:text-sm [&>h5]:text-base xl:[&>h5]:text-lg [&>p]:text-sm xl:[&>p]:text-base">
      {/* By not adding order, when visible, this is shown first */}
      <h5 className="hidden 2xl:block">{t('network-name')}</h5>
      <h5 className="order-1">{hemi.name}</h5>
      <ConfigurationPropTitle order="order-2 xl:order-3">
        {t('rpc-url')}
      </ConfigurationPropTitle>
      <ExternalLink
        href={hemi.rpcUrls.public.http[0]}
        order="order-2 xl:order-5 2xl:order-3"
      />
      <ConfigurationPropTitle order="order-4 xl:order-7">
        {t('chain-id')}
      </ConfigurationPropTitle>
      <p className="order-5 xl:order-9">{hemi.id}</p>
      <ConfigurationPropTitle order="order-6 xl:order-11">
        {t('currency-symbol')}
      </ConfigurationPropTitle>
      <p className="xl:order-13 order-7">{hemi.nativeCurrency.symbol}</p>
      <ConfigurationPropTitle order="order-8 xl:order-15">
        {t('block-explorer-url')}
      </ConfigurationPropTitle>
      <ExternalLink
        href={hemi.blockExplorers.default.url}
        order="order-9 xl:order-17"
      />
      <h5 className="order-10 mt-5 xl:order-2 xl:mt-0">{ethereum.name}</h5>
      <ConfigurationPropTitle order="order-11 xl:order-8 2xl:hidden">
        {t('chain-id')}
      </ConfigurationPropTitle>
      <p className="order-12 xl:order-10">{ethereum.id}</p>
      <ConfigurationPropTitle order="order-13 xl:order-4 2xl:hidden">
        {t('rpc-url')}
      </ConfigurationPropTitle>
      <ExternalLink
        href={ethereum.rpcUrls.default.http[0]}
        order="order-14 xl:order-6"
      />
      <ConfigurationPropTitle order="order-15 xl:order-12 2xl:hidden">
        {t('currency-symbol')}
      </ConfigurationPropTitle>
      <p className="order-16 xl:order-14">{ethereum.nativeCurrency.symbol}</p>
      <ConfigurationPropTitle order="order-17 xl:order-16 2xl:hidden">
        {t('block-explorer-url')}
      </ConfigurationPropTitle>
      <ExternalLink
        href={ethereum.blockExplorers.default.url}
        order="order-18"
      />
    </div>
  )
}

export const ConfigureNetwork = function () {
  const t = useTranslations('get-started.network')
  const searchParams = useSearchParams()

  const networkConfiguration = useSelectedTab('automatic')

  function getHref(config: NetworkConfiguration): string {
    const params = new URLSearchParams(searchParams)

    params.set('networkConfiguration', config)

    return `?${params.toString()}`
  }

  return (
    <div className="flex flex-col gap-y-6 px-1 py-2 lg:gap-y-9">
      <div className="flex justify-center lg:justify-start">
        <Tabs>
          <Tab
            href={getHref('automatic')}
            selected={networkConfiguration === 'automatic'}
          >
            {t('automatic')}
          </Tab>
          <Tab
            href={getHref('manual')}
            selected={networkConfiguration === 'manual'}
          >
            {t('manual')}
          </Tab>
        </Tabs>
      </div>
      <div>
        {networkConfiguration === 'automatic' && <AutomaticConfiguration />}
        {networkConfiguration === 'manual' && <ManualConfiguration />}
      </div>
      <p className="text-xs font-normal text-neutral-400">
        {t.rich('troubleshoot-other-errors', {
          link: (chunk: string) => (
            <a
              className="cursor-pointer underline"
              href="https://docs.hemi.xyz/support/portal"
              rel="noopener noreferrer"
              target="_blank"
            >
              {chunk}
            </a>
          ),
        })}
      </p>
    </div>
  )
}
