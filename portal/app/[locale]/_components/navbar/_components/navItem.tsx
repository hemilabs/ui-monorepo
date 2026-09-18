import { type AnalyticsEvent } from 'app/analyticsEvents'
import { Link } from 'components/link'
import { ComponentProps, ReactNode, ComponentType } from 'react'
import { UrlObject } from 'url'

import { IconContainer } from './iconContainer'

type Selectable = { selected?: boolean }

export const Row = (props: ComponentProps<'div'>) => (
  <div
    className="flex w-full flex-col items-center gap-2 md:flex-row"
    {...props}
  />
)

export const ItemContainer = ({
  children,
  hoverClassName = 'hover:bg-neutral-100 max-md:bg-zinc-50/80',
  justifyItems = 'justify-center md:justify-start',
  padding = 'py-1.5',
  selected = false,
  selectedClassName = 'bg-orange-50',
  ...props
}: Selectable &
  ComponentProps<'div'> & {
    justifyItems?: string
    padding?: string
    selectedClassName?: string
    hoverClassName?: string
  }) => (
  <div
    {...props}
    className={`group/item group/nav flex ${justifyItems} h-full cursor-pointer items-center rounded-lg md:h-auto ${padding} transition-colors duration-300 md:rounded-md ${
      selected ? selectedClassName : hoverClassName
    }`}
  >
    {children}
  </div>
)

export type NavItemProps = {
  event?: AnalyticsEvent
  icon?: ReactNode
  iconContainer?: ComponentType<ComponentProps<typeof IconContainer>>
  itemContainer?: ComponentType<ComponentProps<typeof ItemContainer>>
  rightSection?: ReactNode
  row?: ComponentType<ComponentProps<'div'>>
  text: string
  urlToBeSelected?: string | UrlObject
}

export const ItemText = ({
  hoverClassName = 'text-neutral-600 group-hover/item:text-neutral-950',
  selected = false,
  selectedClassName = 'text-orange-600',
  text,
}: Pick<NavItemProps, 'text'> &
  Selectable & { selectedClassName?: string; hoverClassName?: string }) => (
  <span
    className={`text-sm font-semibold transition-colors duration-300 md:font-medium ${
      selected
        ? selectedClassName
        : `group-hover/nav:text-neutral-950 ${hoverClassName}`
    }`}
  >
    {text}
  </span>
)

export type ItemLinkProps = NavItemProps &
  Required<Pick<ComponentProps<typeof Link>, 'href'>>
