import { AnalyticsEvent } from 'app/analyticsEvents'
import { ExternalLink as AnchorTag } from 'components/externalLink'
import { ArrowDownLeftIcon } from 'components/icons/arrowDownLeftIcon'
import { Chevron } from 'components/icons/chevron'
import { DexIcon } from 'components/icons/dexIcon'
import { useNetworkType } from 'hooks/useNetworkType'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useUmami } from 'hooks/useUmami'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  type ComponentProps,
  type MouseEventHandler,
  type RefObject,
  type ReactNode,
  Suspense,
  useState,
} from 'react'

import atlasIcon from './_images/atlas.png'
import dodoIcon from './_images/dodo.png'
import dzapIcon from './_images/dzap.png'
import eisenIcon from './_images/eisen.png'
import izumiIcon from './_images/izumi.png'
import okuIcon from './_images/oku.png'
import oneDeltaIcon from './_images/oneDelta.png'
import passdexIcon from './_images/passdex.png'
import rubicIcon from './_images/rubic.png'
import sushiIcon from './_images/sushi.png'

type Props = {
  event?: AnalyticsEvent
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
  const { enabled, track } = useUmami()
  const addTracking = () => (enabled && event ? () => track(event) : undefined)
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

const Container = ({
  children,
  divRef,
  isOpen = false,
  onClick,
}: {
  children: ReactNode
  divRef?: RefObject<HTMLDivElement | null>
  isOpen?: boolean
  onClick?: () => void
}) => (
  <div
    className={`group/nav cursor-pointer rounded-md py-2 transition-colors duration-300 ${
      isOpen ? 'bg-neutral-50' : 'hover:bg-neutral-100'
    }`}
    onClick={onClick}
    ref={divRef}
  >
    {children}
  </div>
)

const HemiSwapLink = function ({
  event,
  text,
}: Omit<ItemLinkProps, 'href'> & Pick<ComponentProps<'a'>, 'href'>) {
  const { enabled, track } = useUmami()
  const addTracking = () => (enabled && event ? () => track(event) : undefined)
  return (
    <Container>
      <AnchorTag href="https://swap.hemi.xyz" onClick={addTracking()}>
        <Row>
          <IconContainer>{<DexIcon />}</IconContainer>
          <ItemText text={text} />
          <div className="ml-auto hidden size-4 items-center group-hover/nav:flex">
            <ArrowDownLeftIcon />
          </div>
        </Row>
      </AnchorTag>
    </Container>
  )
}

const Backdrop = ({
  onClick,
}: {
  onClick: MouseEventHandler<HTMLDivElement>
}) => (
  <div
    className="absolute left-0 top-0 z-20
    h-screen w-screen bg-gradient-to-b
    from-neutral-950/0 to-neutral-950/25
    md:hidden"
    onClick={onClick}
  />
)

const DexImpl = function () {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useOnClickOutside<HTMLDivElement>(() => setIsOpen(false))
  const t = useTranslations('navbar.dex')
  const [networkType] = useNetworkType()
  const isTestnet = networkType === 'testnet'

  return isTestnet ? (
    <HemiSwapLink event="nav - dex" text={t('title')} />
  ) : (
    <Container divRef={ref} isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
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
          className="md:translate-y-30 absolute bottom-0 left-0
          top-24 z-30 flex w-full
          flex-col items-start overflow-y-auto
          rounded-t-2xl bg-white
          p-4 shadow-lg md:top-0 md:h-fit md:w-64
          md:translate-x-56 md:rounded-lg
          md:p-1"
        >
          <ItemTitle text={t('aggregators')} />
          <ExternalLink
            event="nav - rubic"
            href="https://app.rubic.exchange"
            icon={<Image alt="Rubic" src={rubicIcon} />}
            text="Rubic"
          />
          <ExternalLink
            event="nav - dzap"
            href="https://app.dzap.io/trade"
            icon={<Image alt="Dzap" src={dzapIcon} />}
            text="Dzap"
          />
          <ExternalLink
            event="nav - 1delta"
            href="https://1delta.io"
            icon={<Image alt="1delta" src={oneDeltaIcon} />}
            text="1delta"
          />
          <ExternalLink
            event="nav - eisen"
            href="https://eisenfinance.com"
            icon={<Image alt="Eisen" src={eisenIcon} />}
            text="Eisen"
          />
          <ItemTitle text={t('subtitle')} />
          <ExternalLink
            event="nav - sushi"
            href="https://www.sushi.com/hemi/swap"
            icon={<Image alt="Sushi" src={sushiIcon} />}
            text="Sushi"
          />
          <ExternalLink
            event="nav - oku"
            href="https://oku.trade?inputChain=hemi"
            icon={<Image alt="Oku (uni)" src={okuIcon} />}
            text="Oku (uni)"
          />
          <ExternalLink
            event="nav - izumi"
            href="https://izumi.finance/trade/swap"
            icon={<Image alt="Izumi" src={izumiIcon} />}
            text="Izumi"
          />
          <ExternalLink
            event="nav - dodo"
            href="https://app.dodoex.io/swap/network/hemi"
            icon={<Image alt="Dodo" src={dodoIcon} />}
            text="Dodo"
          />
          <ExternalLink
            event="nav - atlas"
            href="https://www.atlasexchange.xyz/swap"
            icon={<Image alt="Atlas" src={atlasIcon} />}
            text="Atlas"
          />
          <ExternalLink
            event="nav - passdex"
            href="https://passdex.finance/?chain=HEMI"
            icon={<Image alt="Passdex" src={passdexIcon} />}
            text="Passdex"
          />
        </div>
      )}
    </Container>
  )
}

export const Dex = function () {
  const t = useTranslations('navbar.dex')
  return (
    // The only difference for the DEX link for mainnet|testnet is that for testnet
    // there's an arrow (External link), while for mainnet, there's a chevron (Clickable menu)
    // As both of these only appear on hover, and there's no hover on a static render
    // we can just ignore them, and render the text and icon as a fallback
    <Suspense
      fallback={
        <Container>
          <Row>
            <IconContainer>{<DexIcon />}</IconContainer>
            <ItemText text={t('title')} />
          </Row>
        </Container>
      }
    >
      <DexImpl />
    </Suspense>
  )
}
