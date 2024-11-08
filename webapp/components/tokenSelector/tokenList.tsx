'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { Card } from 'components/card'
import { Drawer } from 'components/drawer'
import { CloseIcon } from 'components/icons/closeIcon'
import { SearchInput } from 'components/inputText'
import { Modal } from 'components/modal'
import { useDebounce } from 'hooks/useDebounce'
import partition from 'lodash/partition'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { Token as TokenType } from 'types/token'
import { useWindowSize } from 'ui-common/hooks/useWindowSize'
import { isAddress, isAddressEqual } from 'viem'

import { Token } from './token'

type Props = {
  closeModal: () => void
  onSelectToken: (token: TokenType) => void
  tokens: TokenType[]
}

const List = function ({ onSelectToken, tokens }: Omit<Props, 'closeModal'>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: tokens.length,
    estimateSize: () => 52,
    getScrollElement: () => parentRef.current,
    overscan: 5,
  })

  return (
    <div className="h-[212px] w-full overflow-y-auto" ref={parentRef}>
      <ul
        className="relative w-full"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map(function (virtualItem) {
          const token = tokens[virtualItem.index]
          return (
            <li
              className="absolute left-0 top-0 w-full cursor-pointer rounded-lg hover:bg-neutral-100"
              key={virtualItem.index}
              onClick={() => onSelectToken(token)}
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <Token token={token} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const NoTokensMatch = function ({ searchText }: { searchText: string }) {
  const t = useTranslations('token-selector')

  return (
    <span className="text-center text-sm font-medium text-neutral-500">
      {t.rich('no-results-for', {
        search: () => <span className="text-neutral-950">{searchText}</span>,
      })}
    </span>
  )
}

const bySymbol = (a: TokenType, b: TokenType) =>
  a.symbol.localeCompare(b.symbol)

export const TokenList = function ({
  closeModal,
  onSelectToken,
  tokens,
}: Props) {
  const t = useTranslations('token-selector')
  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText)
  const { width } = useWindowSize()

  const userTypedAddress = isAddress(debouncedSearchText)

  const tokensToList = tokens.filter(
    token =>
      token.name.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
      token.symbol.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
      // allow only exact match for addresses. In most cases, they will be pasted, rather than typed
      // so no user will partially type an address
      (userTypedAddress &&
        isAddress(token.address) &&
        isAddressEqual(token.address, debouncedSearchText)),
  )

  const [pinnedTokens, restOfTokens] = partition(
    tokensToList,
    token =>
      token.symbol === 'ETH' ||
      token.symbol.includes('USDC') ||
      token.symbol.includes('USDT'),
  )

  const sortedTokens = pinnedTokens
    .sort(bySymbol)
    .concat(restOfTokens.sort(bySymbol))

  const content = (
    <div className="flex h-[357px] w-full flex-col gap-x-3 bg-white p-6 px-4 md:w-96 md:px-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-medium text-neutral-950">
          {t('select-token')}
        </h3>
        <CloseIcon
          className="scale-125 cursor-pointer [&>path]:hover:fill-neutral-950"
          onClick={closeModal}
        />
      </div>
      <div className="py-4">
        <SearchInput
          onChange={e => setSearchText(e.target.value)}
          onClear={() => setSearchText('')}
          placeholder={t('search-tokens')}
          value={searchText}
        />
      </div>
      {sortedTokens.length > 0 ? (
        <List
          onSelectToken={function (token) {
            onSelectToken(token)
            closeModal()
          }}
          tokens={sortedTokens}
        />
      ) : (
        <NoTokensMatch searchText={debouncedSearchText} />
      )}
    </div>
  )

  return width >= 768 ? (
    <Modal onClose={closeModal}>
      <Card>{content}</Card>
    </Modal>
  ) : (
    <Drawer onClose={closeModal}>{content}</Drawer>
  )
}
