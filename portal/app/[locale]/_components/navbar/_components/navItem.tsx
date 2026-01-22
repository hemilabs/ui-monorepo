import { type AnalyticsEvent } from 'app/analyticsEvents'
import { Link } from 'components/link'
import { ComponentProps, ReactNode, ComponentType } from 'react'
import { UrlObject } from 'url'

import { IconContainer } from './iconContainer'

type Selectable = { selected?: boolean }

export type NavItemProps = {
  event?: AnalyticsEvent
  icon?: ReactNode
  iconContainer?: ComponentType<ComponentProps<typeof IconContainer>>
  itemContainer?: ComponentType<ComponentProps<'div'> & Selectable>
  rightSection?: ReactNode
  row?: ComponentType<ComponentProps<'div'>>
  text: string
  urlToBeSelected?: string | UrlObject
}

export const Row = (props: ComponentProps<'div'>) => (
  <div
    className="flex w-full flex-col items-center gap-2 md:flex-row"
    {...props}
  />
)

export const ItemContainer = ({
  children,
  justifyItems = 'justify-center md:justify-start',
  padding = 'py-1.5',
  selected = false,
  ...props
}: Selectable &
  ComponentProps<'div'> & { justifyItems?: string; padding?: string }) => (
  <div
    {...props}
    className={`group/item group/nav flex ${justifyItems} h-full cursor-pointer items-center rounded-lg ${padding} transition-colors duration-300 md:rounded-md ${
      selected ? 'bg-orange-50' : 'hover:bg-neutral-100 max-md:bg-zinc-50/80'
    }`}
  >
    {children}
  </div>
)

export const ItemText = ({
  selected = false,
  text,
}: Pick<NavItemProps, 'text'> & Selectable) => (
  <span
    className={`text-sm font-semibold transition-colors duration-300
      md:font-medium ${
        selected
          ? 'text-orange-600'
          : 'text-neutral-600 group-hover/item:text-neutral-950'
      }`}
  >
    {text}
  </span>
)

export type ItemLinkProps = NavItemProps &
  Required<Pick<ComponentProps<typeof Link>, 'href'>>

export type ItemAccordionProps = {
  icon: ReactNode
  items: Omit<ItemLinkProps, 'icon' | 'rightSection'>[]
  text: string
}

export const AccordionContainer = ({
  children,
  isOpen = false,
  ...props
}: { children: ReactNode } & {
  isOpen?: boolean
} & ComponentProps<'div'>) => (
  <div
    {...props}
    className={`group/nav cursor-pointer rounded-lg p-2 transition-colors duration-300 ${
      isOpen ? 'rounded-lg bg-neutral-100' : 'hover:bg-neutral-100'
    }`}
  >
    {children}
  </div>
)

export const AccordionIconContainer = ({
  children,
  selected = false,
}: Selectable & { children: ReactNode }) => (
  <div
    className={`flex size-6 items-center justify-center rounded-md
      transition-colors duration-300 md:size-5
      group-hover/nav:[&>svg>path]:fill-neutral-950 ${
        selected
          ? '[&>svg>path]:fill-neutral-950'
          : '[&>svg>path]:fill-neutral-400'
      }`}
  >
    {children}
  </div>
)

export const AccordionItemText = ({
  selected = false,
  text,
}: Pick<NavItemProps, 'text'> & Selectable) => (
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
