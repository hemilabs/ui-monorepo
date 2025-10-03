import { AnalyticsEvent } from 'app/analyticsEvents'
import { CheckMark } from 'components/icons/checkMark'
import { Chevron } from 'components/icons/chevron'
import { LanguageIcon } from 'components/icons/languageIcon'
import { LegalIcon } from 'components/icons/legalIcon'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import { useUmami } from 'hooks/useUmami'
import { useRouter } from 'i18n/navigation'
import { getLocalizedLocaleName, locales } from 'i18n/routing'
import { useSearchParams } from 'next/navigation'
import { Locale, useLocale, useTranslations } from 'next-intl'
import {
  type ComponentProps,
  type MouseEventHandler,
  type ReactNode,
  useState,
} from 'react'

import { CmcAttribution } from '../cmcAttribution'
import { TermsAndConditions } from '../termsAndConditions'

import { HelpButton } from './helpButton'

type Selectable = { selected?: boolean }
type LanguageProps = {
  active: string
}
type Props = {
  event?: AnalyticsEvent
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
  ref,
  ...props
}: ComponentProps<'div'> & {
  isOpen: boolean
}) => (
  <div
    {...props}
    className={`w-full cursor-pointer rounded-lg transition-colors duration-300
       ${isOpen ? 'rounded-lg bg-neutral-50' : 'hover:bg-neutral-50'}`}
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
}: Required<Omit<Props, 'value'>> &
  Pick<Props, 'value'> & {
    subMenu: ReactNode
  }) {
  const [isOpen, setIsOpen] = useState(false)
  const { track } = useUmami()

  const ref = useOnClickOutside<HTMLDivElement>(() => setIsOpen(false))

  const onMouseEnter = function () {
    setIsOpen(true)
    track?.(event)
  }

  const onMouseLeave = function () {
    setIsOpen(false)
    track?.(event)
  }

  return (
    <MenuContainer
      isOpen={isOpen}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={ref}
    >
      <Row>
        <div className="flex items-center gap-x-4 md:gap-x-2">
          <IconContainer selected={isOpen}>{icon}</IconContainer>
          <ItemText selected={isOpen} text={text} />
        </div>
        {value && (
          <div className="flex items-center gap-x-2">
            <div className="hidden md:block">
              <ItemText selected={true} text={value} />
            </div>
            <Chevron.Right />
          </div>
        )}
      </Row>
      {isOpen && subMenu}
    </MenuContainer>
  )
}

const LanguageMenu = function ({ active }: LanguageProps) {
  const pathname = usePathnameWithoutLocale()
  const searchParams = useSearchParams()
  const router = useRouter()

  const onClick = function (locale: Locale) {
    const query = searchParams.toString()
    const fullPath = query ? `${pathname}?${query}` : pathname

    router.push(fullPath, { locale })
  }

  return (
    <div
      className="absolute bottom-0 right-0 z-40 flex
    h-fit w-52 -translate-x-8 -translate-y-32
    flex-col items-start
    justify-center rounded-lg bg-white p-2 shadow-lg
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
            text={getLocalizedLocaleName(locale)}
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
        rounded-lg bg-white p-4 shadow-lg
        md:translate-x-60 md:translate-y-7"
  >
    <TermsAndConditions />
    <CmcAttribution />
  </div>
)

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

export const Help = function () {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useOnClickOutside<HTMLDivElement>(() => setIsOpen(false))
  const t = useTranslations('navbar.help')
  const activeLocale = useLocale()

  return (
    <div className="cursor-pointer" ref={ref}>
      {isOpen && <Backdrop onClick={() => setIsOpen(!isOpen)} />}
      <HelpButton isOpen={isOpen} setIsOpen={setIsOpen} />

      {isOpen && (
        <div
          className="absolute bottom-0 left-0 z-30
          flex h-36 w-full flex-col
          items-start rounded-t-2xl bg-white p-4 shadow-lg
          md:top-0 md:h-fit md:w-64 md:translate-x-52
          md:translate-y-16 md:rounded-lg md:p-1"
        >
          <ItemWithSubmenu
            event="nav - language"
            icon={<LanguageIcon className="h-5 w-5 md:h-4 md:w-4" />}
            subMenu={<LanguageMenu active={activeLocale} />}
            text={t('language')}
            value={getLocalizedLocaleName(activeLocale)}
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
  )
}
