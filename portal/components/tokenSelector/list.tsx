'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { DatabaseIcon } from 'components/icons/databaseIcon'
import { MultiTokensIcon } from 'components/icons/multiTokensIcon'
import { useUserTokenList } from 'hooks/useUserTokenList'
import { useTranslations } from 'next-intl'
import { type JSX, useRef } from 'react'
import { Token as TokenType } from 'types/token'

import { Token } from './token'
import { isCustomToken } from './tokenList'

type Props = {
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
    <div
      className="absolute left-0 top-0 w-full"
      key="manually_added"
      style={{
        height,
        transform: `translateY(${virtualItemStart + offset}px)`,
      }}
    >
      <h6 className="py-3 pb-1.5 text-sm font-medium text-neutral-500">
        {t('manually-added-tokens')}
      </h6>
    </div>
  )
}

function YourTokensHeader({
  height,
  offset,
  virtualItemStart,
}: RenderHeaderProps) {
  const t = useTranslations('token-selector')
  return (
    <div
      className="absolute left-0 top-0 w-full"
      key="your_tokens"
      style={{
        height,
        transform: `translateY(${virtualItemStart + offset}px)`,
      }}
    >
      <div className="flex items-center gap-x-2 py-3">
        <MultiTokensIcon />
        <h6 className="text-sm font-medium text-neutral-500">
          {t('your-tokens')}
        </h6>
      </div>
    </div>
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
    <div
      className="relative inset-x-0 top-0"
      key="all_tokens"
      style={{
        height,
        transform: `translateY(${virtualItemStart + offset}px)`,
      }}
    >
      {hasTokens && (
        <div className="absolute inset-x-0 top-4 h-px border-t border-neutral-300/55 md:-mx-6" />
      )}
      <div className="flex items-center gap-x-2 pt-8">
        <DatabaseIcon />
        <h6 className="text-sm font-medium text-neutral-500">
          {t('all-tokens')}
        </h6>
      </div>
    </div>
  )
}

const TokenRow = ({
  index,
  offset,
  onSelect,
  start,
  token,
}: {
  token: TokenType
  index: number
  start: number
  offset: number
  onSelect: (t: TokenType) => void
}) => (
  <li
    className="absolute left-0 top-0 w-full cursor-pointer rounded-lg hover:bg-neutral-100"
    key={index}
    onClick={() => onSelect(token)}
    style={{
      height: '56px',
      // After showing your, all and custom tokens headers, we need to adjust the position of all the following tokens to consider it
      transform: `translateY(${start + offset}px)`,
    }}
  >
    <Token token={token} />
  </li>
)

const shouldRenderHeader = (
  alreadyRendered: boolean,
  isFirst: boolean,
  isSearchActive: boolean,
  condition?: boolean,
) => !alreadyRendered && isFirst && !isSearchActive && (condition ?? true)

export const List = function ({
  isSearchActive,
  onSelectToken,
  tokens,
  yourTokens,
}: Props & { isSearchActive: boolean } & {
  yourTokens: TokenType[]
}) {
  const parentRef = useRef<HTMLDivElement>(null)
  const { userTokenList } = useUserTokenList()

  const combinedTokens = [...yourTokens, ...tokens, ...userTokenList]

  const rowVirtualizer = useVirtualizer({
    count: combinedTokens.length,
    estimateSize: () => 56,
    getScrollElement: () => parentRef.current,
    overscan: 5,
  })

  const customTokensHeaderHeight = 40
  const allTokensHeaderHeight = 60
  const yourTokensHeaderHeight = 40

  const getList = function () {
    const rows: JSX.Element[] = []
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
      ].reduce((acc, val) => acc + (val || 0), 0)

    for (let rowIndex = 0; rowIndex < virtualItems.length; rowIndex++) {
      const virtualItem = virtualItems[rowIndex]
      const token = combinedTokens[virtualItem.index]

      const isCustom = isCustomToken(userTokenList, token)
      const isFirstYourTokens = rowIndex === 0
      const isFirstAllTokens = virtualItem.index === yourTokens.length

      const shouldRenderCustomHeader = shouldRenderHeader(
        hasAddedCustomTokensHeader,
        true, // custom tokens are always the last section
        false, // custom tokens are not affected by search
        isCustom,
      )
      const shouldRenderYourTokensHeader = shouldRenderHeader(
        hasAddedYourTokensHeader,
        isFirstYourTokens,
        isSearchActive,
        hasYourTokens,
      )
      const shouldRenderAllTokensHeader = shouldRenderHeader(
        hasAddedAllTokensHeader,
        isFirstAllTokens,
        isSearchActive,
      )

      if (shouldRenderCustomHeader) {
        rows.push(
          <CustomTokensHeader
            height={customTokensHeaderHeight}
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
            offset={getOffset()}
            virtualItemStart={virtualItem.start}
          />,
        )
        hasAddedAllTokensHeader = true
      }

      rows.push(
        <TokenRow
          index={virtualItem.index}
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
      className="shadow-top-token-selector mb-4 size-full overflow-y-auto bg-white"
      ref={parentRef}
    >
      <ul className="relative size-full">{getList()}</ul>
    </div>
  )
}
