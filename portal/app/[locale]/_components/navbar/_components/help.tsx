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
import { Locale, useLocale, useTranslations } from 'next-intl'
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

const IconContainer = ({
  children,
  selected,
}: Selectable & { children: ReactNode }) => (
  <div
    className={`flex h-10 w-10
      items-center justify-center rounded-lg bg-neutral-50
      md:h-4 md:w-4 group-hover/row:[&>svg>path]:fill-neutral-950
      ${
        selected
          ? '[&>svg>path]:fill-neutral-950'
          : '[&>svg>path]:fill-neutral-500'
      }`}
  >
    {children}
  </div>
)

const Row = (props: { children: ReactNode } & ComponentProps<'div'>) => (
  <div
    className="group/row flex h-14 items-center justify-between px-4
    md:h-8 md:px-3 md:py-2"
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
    className={`w-full cursor-pointer rounded-lg transition-colors duration-300
       ${isOpen ? 'rounded-lg bg-neutral-50' : 'hover:bg-neutral-50'}`}
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
      group-hover/row:text-neutral-950 md:text-sm ${
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

  const onMouseEnter = function () {
    setIsOpen(true)
    track?.(event, { chain: networkType })
  }

  const onMouseLeave = function () {
    setIsOpen(false)
    track?.(event, { chain: networkType })
  }

  return (
    <MenuContainer
      isOpen={isOpen}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      refProp={ref}
    >
      <Row>
        <div className="flex items-center gap-x-4 md:gap-x-2">
          <IconContainer selected={isOpen}>{icon}</IconContainer>
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

const LanguageMenu = function ({ active }: LanguageProps) {
  const t = useTranslations('navbar.help')
  const pathname = usePathnameWithoutLocale()
  const router = useRouter()

  const onClick = function (locale: Locale) {
    router.push(pathname, { locale })
  }

  return (
    <div
      className="shadow-help-menu absolute bottom-0 right-0 z-40
    flex h-fit w-52 -translate-x-8
    -translate-y-32 flex-col
    items-start justify-center rounded-lg border
    border-neutral-300/55 bg-white p-2
    md:top-0 md:translate-x-48 md:translate-y-1 md:p-1"
    >
      {locales.map(locale => (
        <div
          className="group/row flex w-full items-center
          justify-between rounded-md px-3
          py-2 hover:bg-neutral-50"
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
    className="-translate-y-18 shadow-help-menu absolute bottom-0 right-0
        z-20 flex w-64 -translate-x-8
        flex-col items-start
        gap-x-2 rounded-lg border
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

export const Help = function () {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useOnClickOutside<HTMLDivElement>(() => setIsOpen(false))
  const t = useTranslations('navbar.help')
  const activeLocale = useLocale()

  return (
    <>
      <div className="cursor-pointer" ref={ref}>
        {isOpen && <Backdrop onClick={() => setIsOpen(!isOpen)} />}
        <div
          className={`shadow-help-icon flex h-7 w-7 items-center justify-center
          rounded-md border border-neutral-300/55 hover:bg-neutral-50
          ${isOpen ? 'bg-neutral-50' : 'bg-white'} group/icon "`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <QuestionMark
            className={`h-4 w-4
            ${
              isOpen ? '[&>path]:fill-neutral-950' : '[&>path]:fill-neutral-500'
            } 
            group-hover/icon:[&>path]:fill-neutral-950`}
          />
        </div>

        {isOpen && (
          <div
            className="shadow-help-menu absolute bottom-0 left-0
            z-30 flex h-36 w-full
            flex-col items-start rounded-t-2xl
            border border-neutral-300/55 bg-white p-4
            md:top-0 md:h-fit md:w-64 md:translate-x-52
            md:translate-y-16 md:rounded-lg md:p-1"
          >
            <ItemWithSubmenu
              event="nav - language"
              icon={<LanguageIcon className="h-5 w-5 md:h-4 md:w-4" />}
              subMenu={<LanguageMenu active={activeLocale} />}
              text={t('language')}
              value={t(`locales.${activeLocale}`)}
            />
            <ItemWithSubmenu
              event="nav - legal and privacy"
              icon={<LegalIcon className="h-5 w-5 md:h-4 md:w-4" />}
              subMenu={<LegalAndPrivacy />}
              text={t('legal-and-privacy')}
            />
          </div>
        )}
      </div>
    </>
  )
}
