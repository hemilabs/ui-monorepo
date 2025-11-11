'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { DatabaseIcon } from 'components/icons/databaseIcon'
import { MultiTokensIcon } from 'components/icons/multiTokensIcon'
import { useHasScrolled } from 'hooks/useHasScrolled'
import { useUserTokenList } from 'hooks/useUserTokenList'
import { useTranslations } from 'next-intl'
import { type ReactElement, useRef } from 'react'
import { Token as TokenType } from 'types/token'
import { isCustomToken } from 'utils/token'
import { type Chain } from 'viem'

import { Token } from './token'

type Props = {
  chainId: Chain['id']
  onSelectToken: (token: TokenType) => void
  tokens: TokenType[]
}

type RenderHeaderProps = {
  offset: number
  hasTokens?: boolean
  height: number
  virtualItemStart: number
}

function CustomTokensHeader({
  height,
  offset,
  virtualItemStart,
}: RenderHeaderProps) {
  const t = useTranslations('token-selector')
  return (
    <li
      className="absolute left-0 top-0 w-full"
      style={{
        height,
        transform: `translateY(${virtualItemStart + offset}px)`,
      }}
    >
      <h6 className="px-4 py-3 pb-1.5 text-sm font-medium text-neutral-500 md:px-6">
        {t('manually-added-tokens')}
      </h6>
    </li>
  )
}

function YourTokensHeader({
  height,
  offset,
  virtualItemStart,
}: RenderHeaderProps) {
  const t = useTranslations('token-selector')
  return (
    <li
      className="absolute left-0 top-0 w-full"
      style={{
        height,
        transform: `translateY(${virtualItemStart + offset}px)`,
      }}
    >
      <div className="flex items-center gap-x-2 px-4 py-3 md:px-6">
        <MultiTokensIcon />
        <h6 className="text-sm font-medium text-neutral-500">
          {t('your-tokens')}
        </h6>
      </div>
    </li>
  )
}

function AllTokensHeader({
  hasTokens,
  height,
  offset,
  virtualItemStart,
}: RenderHeaderProps) {
  const t = useTranslations('token-selector')
  return (
    <li
      className="relative inset-x-0 top-0"
      style={{
        height,
        transform: `translateY(${virtualItemStart + offset}px)`,
      }}
    >
      {hasTokens && (
        <div className="absolute inset-x-0 top-4 h-px border-t border-neutral-300/55" />
      )}
      <div className="flex items-center gap-x-2 px-4 pb-2 pt-9 md:px-6">
        <DatabaseIcon />
        <h6 className="text-sm font-medium text-neutral-500">
          {t('all-tokens')}
        </h6>
      </div>
    </li>
  )
}

const TokenRow = ({
  offset,
  onSelect,
  start,
  token,
}: {
  token: TokenType
  start: number
  offset: number
  onSelect: (t: TokenType) => void
}) => (
  <li
    className="absolute left-1 right-1 top-0 cursor-pointer rounded-lg hover:bg-neutral-100 md:left-3 md:right-3"
    onClick={() => onSelect(token)}
    style={{
      height: '60px',
      transform: `translateY(${start + offset}px)`,
    }}
  >
    <Token token={token} />
  </li>
)

const shouldRenderHeader = ({
  alreadyRendered,
  condition = true,
  isFirst,
  isSearchActive,
}: {
  alreadyRendered: boolean
  isFirst: boolean
  isSearchActive: boolean
  condition?: boolean
}) => !alreadyRendered && isFirst && !isSearchActive && condition

export const List = function ({
  chainId,
  isSearchActive,
  onSelectToken,
  tokens,
  yourTokens,
}: Props & { isSearchActive: boolean } & {
  yourTokens: TokenType[]
}) {
  const parentRef = useRef<HTMLDivElement>(null)

  const { userTokenList } = useUserTokenList(chainId)
  const { hasScrolled, onScroll } = useHasScrolled()

  const combinedTokens = [...yourTokens, ...tokens, ...userTokenList]

  const rowVirtualizer = useVirtualizer({
    count: combinedTokens.length,
    estimateSize: () => 60,
    getScrollElement: () => parentRef.current,
    overscan: 5,
  })

  const customTokensHeaderHeight = 40
  const allTokensHeaderHeight = 64
  const yourTokensHeaderHeight = 40

  const getList = function () {
    const rows: ReactElement[] = []
    const virtualItems = rowVirtualizer.getVirtualItems()
    const hasYourTokens = yourTokens.length > 0

    let hasAddedYourTokensHeader = false
    let hasAddedAllTokensHeader = false
    let hasAddedCustomTokensHeader = false

    // Function to calculate the offset based on the headers that have been added
    // This is used to adjust the position of the tokens after the headers
    const getOffset = () =>
      [
        hasAddedYourTokensHeader && yourTokensHeaderHeight,
        hasAddedAllTokensHeader && allTokensHeaderHeight,
        hasAddedCustomTokensHeader && customTokensHeaderHeight,
      ].reduce((acc: number, val) => acc + (val || 0), 0)

    for (let rowIndex = 0; rowIndex < virtualItems.length; rowIndex++) {
      const virtualItem = virtualItems[rowIndex]
      const token = combinedTokens[virtualItem.index]

      const isCustom = isCustomToken(userTokenList, token)
      const isFirstYourTokens = rowIndex === 0
      const isFirstAllTokens = virtualItem.index === yourTokens.length

      const shouldRenderCustomHeader = shouldRenderHeader({
        alreadyRendered: hasAddedCustomTokensHeader,
        condition: isCustom,
        isFirst: true, // custom tokens are always the last section
        isSearchActive: false, // custom tokens are not affected by search
      })
      const shouldRenderYourTokensHeader = shouldRenderHeader({
        alreadyRendered: hasAddedYourTokensHeader,
        condition: hasYourTokens,
        isFirst: isFirstYourTokens,
        isSearchActive,
      })
      const shouldRenderAllTokensHeader = shouldRenderHeader({
        alreadyRendered: hasAddedAllTokensHeader,
        isFirst: isFirstAllTokens,
        isSearchActive,
      })

      if (shouldRenderCustomHeader) {
        rows.push(
          <CustomTokensHeader
            height={customTokensHeaderHeight}
            key="manually_added"
            offset={getOffset()}
            virtualItemStart={virtualItem.start}
          />,
        )
        hasAddedCustomTokensHeader = true
      }

      if (shouldRenderYourTokensHeader) {
        rows.push(
          <YourTokensHeader
            height={yourTokensHeaderHeight}
            key="your_tokens"
            offset={getOffset()}
            virtualItemStart={virtualItem.start}
          />,
        )
        hasAddedYourTokensHeader = true
      }

      if (shouldRenderAllTokensHeader) {
        rows.push(
          <AllTokensHeader
            hasTokens={hasYourTokens}
            height={allTokensHeaderHeight}
            key="all_tokens"
            offset={getOffset()}
            virtualItemStart={virtualItem.start}
          />,
        )
        hasAddedAllTokensHeader = true
      }

      rows.push(
        <TokenRow
          key={virtualItem.index}
          offset={getOffset()}
          onSelect={onSelectToken}
          start={virtualItem.start}
          token={token}
        />,
      )
    }
    return rows
  }

  return (
    <div
      className={`skip-parent-padding-x flex-1 overflow-y-auto bg-white transition-shadow duration-200 ${
        hasScrolled ? 'shadow-md' : ''
      }`}
      onScroll={onScroll}
      ref={parentRef}
    >
      <ul
        className="relative"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {getList()}
      </ul>
    </div>
  )
}
