import { Chevron } from 'components/icons/chevron'
import { Link } from 'components/link'
import { NetworkType, useNetworkType } from 'hooks/useNetworkType'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { usePathnameWithoutLocale } from 'hooks/usePathnameWithoutLocale'
import { useUmami } from 'hooks/useUmami'
import { useWindowSize } from 'hooks/useWindowSize'
import { useRouter } from 'i18n/navigation'
import { Suspense, useEffect, useState } from 'react'
import { screenBreakpoints } from 'styles'
import { UrlObject } from 'url'

import {
  AccordionContainer,
  AccordionIconContainer,
  AccordionItemText,
  ItemAccordionProps,
  ItemText,
  Row,
} from './navItem'

type Props = {
  eventEnabled?: boolean
  eventTrack?: ReturnType<typeof useUmami>['track']
  width?: number
} & ItemAccordionProps

function ItemAccordionUI({
  eventEnabled,
  eventTrack,
  icon,
  items,
  networkType,
  text,
  width = 0,
}: Omit<Props, 'event' | 'urlToBeSelected'> & { networkType: NetworkType }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathnameWithoutLocale()
  const router = useRouter()

  function matchesPath(path: string, url?: string | UrlObject) {
    if (typeof url === 'string') {
      return path.startsWith(url)
    }
    return !!url?.pathname && path.startsWith(url.pathname)
  }

  const hasSelectedItem = items.some(({ urlToBeSelected }) =>
    matchesPath(pathname, urlToBeSelected),
  )

  const handleClickOutside = function () {
    if (!hasSelectedItem) {
      setIsOpen(false)
    }
  }

  const ref = useOnClickOutside<HTMLDivElement>(handleClickOutside)

  useEffect(
    function syncAccordionOpenWithSelectedItem() {
      setIsOpen(hasSelectedItem)
    },
    [hasSelectedItem, pathname],
  )

  function handleOpenAccordion() {
    const firstItemHref = items.length > 0 ? items[0]?.href : undefined
    if (firstItemHref && width >= screenBreakpoints.md) {
      router.push(
        `${firstItemHref}${
          networkType === 'mainnet' ? '' : `?networkType=${networkType}`
        }`,
      )
    }
  }

  function handleClick() {
    if (!hasSelectedItem) {
      handleOpenAccordion()
      setIsOpen(prev => !prev)
    }
  }

  return (
    <div ref={ref}>
      <AccordionContainer isOpen={isOpen} onClick={handleClick}>
        <div className="flex items-center justify-between">
          <Row>
            <AccordionIconContainer selected={isOpen}>
              {icon}
            </AccordionIconContainer>
            <AccordionItemText selected={isOpen} text={text} />
          </Row>
          {isOpen ? (
            <Chevron.Up className="[&>path]:fill-neutral-500" />
          ) : (
            <Chevron.Bottom className="[&>path]:fill-neutral-500 group-hover/item:[&>path]:fill-neutral-950" />
          )}
        </div>
      </AccordionContainer>
      <div
        className={`mt-1 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-32' : 'max-h-0'
        }`}
      >
        {items.map(function ({ event, href, text: itemText, urlToBeSelected }) {
          const isSelected = matchesPath(pathname, urlToBeSelected)

          return (
            <Link
              href={href}
              key={itemText}
              onClick={
                eventEnabled && eventTrack && !!event
                  ? () => eventTrack(event)
                  : undefined
              }
            >
              <div
                className={`group/item relative ml-4 flex flex-col gap-1 px-5 py-1.5 text-sm
                  before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-neutral-200
                  ${
                    isSelected
                      ? 'after:absolute after:left-0 after:top-1/2 after:h-4/6 after:w-0.5 after:-translate-y-1/2 after:bg-orange-600'
                      : ''
                  }
                `}
              >
                <ItemText selected={isSelected} text={itemText} />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function ItemAccordionImpl(props: Omit<Props, 'urlToBeSelected'>) {
  const [networkType] = useNetworkType()
  const { enabled, track } = useUmami()
  const { width } = useWindowSize()

  const allProps = {
    ...props,
    eventEnabled: enabled,
    eventTrack: track,
    networkType,
    width,
  }

  return <ItemAccordionUI {...allProps} />
}

export const ItemAccordion = (props: ItemAccordionProps) => (
  <Suspense fallback={<ItemAccordionUI {...props} networkType="mainnet" />}>
    <ItemAccordionImpl {...props} />
  </Suspense>
)
