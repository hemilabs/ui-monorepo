/* eslint-disable arrow-body-style */
import { AnalyticsEventsWithChain, useUmami } from 'app/analyticsEvents'
import { CheckMark } from 'components/icons/checkMark'
import { Chevron } from 'components/icons/chevron'
import { LanguageIcon } from 'components/icons/languageIcon'
import { LegalIcon } from 'components/icons/legalIcon'
import { QuestionMark } from 'components/icons/questionMark'
import { useNetworkType } from 'hooks/useNetworkType'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import { useRouter } from 'i18n/navigation'
import { locales } from 'i18n/routing'
import { useLocale, useTranslations } from 'next-intl'
import { ComponentProps, ReactNode, RefObject, useState } from 'react'

import { CmcAttribution } from './cmcAttribution'
import { TermsAndConditions } from './termsAndConditions'

type Selectable = { selected?: boolean }
type LanguageProps = {
  active: string
}
type Props = {
  event?: AnalyticsEventsWithChain
  icon?: ReactNode
  text: string
  value?: string
}

const IconContainer = ({ children }: { children: ReactNode }) => (
  <div
    className="flex h-10 w-10
      items-center justify-center rounded-lg bg-neutral-50
      md:h-4 md:w-4"
  >
    {children}
  </div>
)

const Row = (props: { children: ReactNode } & ComponentProps<'div'>) => (
  <div
    className="flex h-14 items-center justify-between px-4 md:h-fit"
    {...props}
  />
)

const MenuContainer = ({
  children,
  isOpen,
  refProp,
  ...props
}: { children: ReactNode } & {
  isOpen: boolean
  refProp: RefObject<HTMLDivElement>
} & ComponentProps<'div'>) => (
  <div
    {...props}
    className={`w-full cursor-pointer rounded-lg transition-colors duration-300 md:py-2 ${
      isOpen ? 'rounded-lg bg-neutral-50' : 'hover:bg-neutral-50'
    }`}
    ref={refProp}
  >
    {children}
  </div>
)

const ItemText = ({
  selected = false,
  text,
}: Pick<Props, 'text'> & Selectable) => (
  <span
    className={`text-base font-medium capitalize transition-colors duration-300
      group-hover/item:text-neutral-950 md:text-sm ${
        selected ? 'text-neutral-950' : 'text-neutral-700'
      }`}
  >
    {text}
  </span>
)

const ItemWithSubmenu = function ({
  event,
  icon,
  subMenu,
  text,
  value,
}: Props & { subMenu: ReactNode }) {
  const [networkType] = useNetworkType()
  const [isOpen, setIsOpen] = useState(false)
  const { track } = useUmami()

  const ref = useOnClickOutside<HTMLDivElement>(() => setIsOpen(false))

  const onClick = function () {
    setIsOpen(!isOpen)
    track?.(event, { chain: networkType })
  }

  return (
    <MenuContainer isOpen={isOpen} refProp={ref}>
      <Row onClick={onClick}>
        <div className="flex items-center gap-x-4 md:gap-x-2">
          <IconContainer>{icon}</IconContainer>
          <ItemText selected={isOpen} text={text} />
        </div>
        <div className="flex items-center gap-x-2">
          <div className="hidden md:block">
            <ItemText selected={true} text={value} />
          </div>
          <Chevron.Right />
        </div>
      </Row>
      {isOpen && subMenu}
    </MenuContainer>
  )
}

const LanguageMenu = ({ active }: LanguageProps) => {
  const t = useTranslations('navbar.help')
  const pathname = usePathnameWithoutLocale()
  const router = useRouter()

  const onClick = (locale: string) => {
    router.push(pathname, { locale })
  }

  return (
    <div
      className="absolute bottom-0 right-0 z-40 flex
    w-52 -translate-x-8 -translate-y-32 flex-col
    items-start gap-y-2
    rounded-lg border
    border-neutral-300/55 bg-white p-4
    md:top-0 md:translate-x-48 md:translate-y-1"
    >
      {locales.map(locale => (
        <div
          className="flex w-full items-center justify-between gap-x-2"
          key={locale}
          onClick={() => onClick(locale)}
        >
          <ItemText
            selected={active === locale}
            text={t(`locales.${locale}`)}
          />
          <div className={active === locale ? 'block' : 'invisible'}>
            <CheckMark className="[&>path]:stroke-emerald-500" />
          </div>
        </div>
      ))}
    </div>
  )
}

const LegalAndPrivacy = () => (
  <div
    className="-translate-y-18 absolute bottom-0 right-0 z-20
        flex w-64 -translate-x-8 flex-col
        items-start gap-x-2
        rounded-lg border
        border-neutral-300/55 bg-white p-4
        md:translate-x-60 md:translate-y-7"
  >
    <TermsAndConditions />
    <CmcAttribution />
  </div>
)

const Backdrop = ({ onClick }) => (
  <div
    className="absolute left-0 top-0 z-20
    h-screen w-screen bg-gradient-to-b
    from-neutral-950/0 to-neutral-950/25
    md:hidden"
    onClick={onClick}
  />
)

export const Help = () => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useOnClickOutside<HTMLDivElement>(() => setIsOpen(false))
  const t = useTranslations('navbar.help')
  const activeLocale = useLocale()

  return (
    <div className="cursor-pointer" ref={ref}>
      {isOpen && <Backdrop onClick={() => setIsOpen(false)} />}

      <div
        className="flex h-7 w-7 items-center justify-center rounded-md
        border border-neutral-300/55 bg-neutral-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <QuestionMark className="h-4 w-4" />
      </div>

      {isOpen && (
        <div
          className="absolute bottom-0 left-0 z-30
          flex h-36 w-full flex-col
          items-start rounded-2xl border
          border-neutral-300/55 bg-white p-4
          md:top-0 md:h-fit md:w-64 md:translate-x-52
          md:translate-y-16 md:rounded-lg md:p-1"
        >
          <ItemWithSubmenu
            event="nav - language"
            icon={<LanguageIcon className="h-5 w-5" />}
            subMenu={<LanguageMenu active={activeLocale} />}
            text={t('language')}
            value={t(`locales.${activeLocale}`)}
          />
          <ItemWithSubmenu
            event="nav - legal and privacy"
            icon={<LegalIcon className="h-5 w-5" />}
            subMenu={<LegalAndPrivacy />}
            text={t('legal-and-privacy')}
          />
        </div>
      )}
    </div>
  )
}
