import { AnalyticsEventsWithChain, useUmami } from 'app/analyticsEvents'
import { ExternalLink as AnchorTag } from 'components/externalLink'
import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import { Chevron } from 'components/icons/chevron'
import { DexIcon } from 'components/icons/dexIcon'
import { useNetworkType } from 'hooks/useNetworkType'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ComponentProps, ReactNode, useState } from 'react'

import atlasIcon from './_images/atlas.png'
import dodoIcon from './_images/dodo.png'
import eisenIcon from './_images/eisen.png'
import izumiIcon from './_images/izumi.png'
import okuIcon from './_images/oku.png'
import oneDeltaIcon from './_images/oneDelta.png'
import passdexIcon from './_images/passdex.png'
import sushiIcon from './_images/sushi.png'

type Props = {
  event?: AnalyticsEventsWithChain
  icon?: ReactNode
  text: string
}

type Selectable = { selected?: boolean }

const IconContainer = ({
  children,
  selected = false,
}: Selectable & { children: ReactNode }) => (
  <div
    className={`flex size-6 items-center justify-center rounded-md
      transition-colors duration-300 md:size-5
      group-hover/nav:[&>svg>path]:fill-neutral-950 ${
        selected
          ? '[&>svg>path]:fill-neutral-950'
          : 'bg-neutral-100 [&>svg>path]:fill-neutral-400 group-hover/item:[&>svg>path]:fill-neutral-950'
      }`}
  >
    {children}
  </div>
)

const LinkIconContainer = ({ children }: { children: ReactNode }) => (
  <div className="flex size-10 items-center justify-center rounded-md md:size-5 group-hover/item:[&>svg>path]:fill-neutral-950">
    {children}
  </div>
)

const Row = (props: { children: ReactNode } & ComponentProps<'div'>) => (
  <div className="flex items-center gap-x-3" {...props} />
)

const ItemContainer = ({
  children,
  ref,
  selected = false,
  ...props
}: { children: ReactNode } & Selectable & ComponentProps<'div'>) => (
  <div
    {...props}
    className={`group/item w-full cursor-pointer rounded-md px-3 py-2 transition-colors duration-300 ${
      selected ? 'bg-neutral-50' : 'hover:bg-neutral-100'
    }`}
    ref={ref}
  >
    {children}
  </div>
)

const ItemText = ({
  selected = false,
  text,
}: Pick<Props, 'text'> & Selectable) => (
  <span
    className={`text-base font-medium transition-colors duration-300
       group-hover/nav:text-neutral-950 md:text-sm ${
         selected
           ? 'text-neutral-950'
           : 'text-neutral-600 group-hover/item:text-neutral-950'
       }`}
  >
    {text}
  </span>
)

const ItemTitle = ({ text }: Pick<Props, 'text'>) => (
  <div className="w-full px-3 py-4 md:py-2">
    <span className="text-base font-medium text-neutral-500 md:text-sm">
      {text}
    </span>
  </div>
)

type ItemLinkProps = Props & Required<Pick<ComponentProps<typeof Link>, 'href'>>

const ExternalLink = function ({
  event,
  href,
  icon,
  text,
}: Omit<ItemLinkProps, 'href'> & Pick<ComponentProps<'a'>, 'href'>) {
  const [networkType] = useNetworkType()
  const { track } = useUmami()
  const addTracking = () =>
    track ? () => track(event, { chain: networkType }) : undefined
  return (
    <ItemContainer>
      <AnchorTag href={href} onClick={addTracking()}>
        <Row>
          {icon && <LinkIconContainer>{icon}</LinkIconContainer>}
          <ItemText text={text} />
          <div className="ml-auto hidden size-4 items-center group-hover/item:flex">
            <ArrowDownLeftIcon />
          </div>
        </Row>
      </AnchorTag>
    </ItemContainer>
  )
}

const HemiSwapLink = function ({
  event,
  text,
}: Omit<ItemLinkProps, 'href'> & Pick<ComponentProps<'a'>, 'href'>) {
  const [networkType] = useNetworkType()
  const { track } = useUmami()
  const addTracking = () =>
    track ? () => track(event, { chain: networkType }) : undefined
  return (
    <div className="group/nav cursor-pointer rounded-md py-2 transition-colors duration-300 hover:bg-neutral-100">
      <AnchorTag href="https://swap.hemi.xyz" onClick={addTracking()}>
        <Row>
          <IconContainer>{<DexIcon />}</IconContainer>
          <ItemText text={text} />
          <div className="ml-auto hidden size-4 items-center group-hover/nav:flex">
            <ArrowDownLeftIcon />
          </div>
        </Row>
      </AnchorTag>
    </div>
  )
}

const Backdrop = ({ onClick }) => (
  <div
    className="absolute left-0 top-0 z-20
    h-screen w-screen bg-gradient-to-b
    from-neutral-950/0 to-neutral-950/25
    md:hidden"
    onClick={onClick}
  />
)

export const Dex = function () {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useOnClickOutside<HTMLDivElement>(() => setIsOpen(false))
  const t = useTranslations('navbar.dex')
  const [networkType] = useNetworkType()
  const isTestnet = networkType === 'testnet'

  return isTestnet ? (
    <HemiSwapLink event="nav - dex" text={t('title')} />
  ) : (
    <div
      className={`group/nav cursor-pointer rounded-md py-2 transition-colors duration-300 ${
        isOpen ? 'bg-neutral-50' : 'hover:bg-neutral-100'
      }`}
      onClick={() => setIsOpen(!isOpen)}
      ref={ref}
    >
      {isOpen && <Backdrop onClick={() => setIsOpen(!isOpen)} />}

      <Row>
        <IconContainer selected={isOpen}>{<DexIcon />}</IconContainer>
        <ItemText selected={isOpen} text={t('title')} />
        <Chevron.Right
          className={`ml-auto group-hover/nav:block
          ${isOpen ? 'block' : 'hidden'}`}
        />
      </Row>

      {isOpen && (
        <div
          className="shadow-help-menu md:translate-y-30 absolute bottom-0
          left-0 z-30 flex
          w-full flex-col items-start
          rounded-t-2xl border border-neutral-300/55 bg-white
          p-4 md:top-0 md:h-fit md:w-64
          md:translate-x-56 md:rounded-lg
          md:p-1"
        >
          <ItemTitle text={t('aggregators')} />
          <ExternalLink
            event="nav - 1delta"
            href="https://1delta.io"
            icon={<Image alt={t('1delta')} src={oneDeltaIcon} />}
            text={t('1delta')}
          />
          <ExternalLink
            event="nav - eisen"
            href="https://eisenfinance.com"
            icon={<Image alt={t('eisen')} src={eisenIcon} />}
            text={t('eisen')}
          />
          <ItemTitle text={t('subtitle')} />
          <ExternalLink
            event="nav - sushi"
            href="https://www.sushi.com/hemi/swap"
            icon={<Image alt={t('sushi')} src={sushiIcon} />}
            text={t('sushi')}
          />
          <ExternalLink
            event="nav - oku"
            href="https://oku.trade?inputChain=hemi"
            icon={<Image alt={t('oku')} src={okuIcon} />}
            text={t('oku')}
          />
          <ExternalLink
            event="nav - izumi"
            href="https://izumi.finance/trade/swap"
            icon={<Image alt={t('izumi')} src={izumiIcon} />}
            text={t('izumi')}
          />
          <ExternalLink
            event="nav - dodo"
            href="https://app.dodoex.io/swap/network/hemi"
            icon={<Image alt={t('dodo')} src={dodoIcon} />}
            text={t('dodo')}
          />
          <ExternalLink
            event="nav - atlas"
            href="https://www.atlasexchange.xyz/swap"
            icon={<Image alt={t('atlas')} src={atlasIcon} />}
            text={t('atlas')}
          />
          <ExternalLink
            event="nav - passdex"
            href="https://passdex.finance/?chain=HEMI"
            icon={<Image alt={t('passdex')} src={passdexIcon} />}
            text={t('passdex')}
          />
        </div>
      )}
    </div>
  )
}
