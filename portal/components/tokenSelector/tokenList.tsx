'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { Card } from 'components/card'
import { Drawer } from 'components/drawer'
import { CloseIcon } from 'components/icons/closeIcon'
import { SearchInput } from 'components/inputText'
import { Modal } from 'components/modal'
import { useDebounce } from 'hooks/useDebounce'
import { useUserTokenList } from 'hooks/useUserTokenList'
import { useWindowSize } from 'hooks/useWindowSize'
import partition from 'lodash/partition'
import { useTranslations } from 'next-intl'
import { type JSX, useRef, useState } from 'react'
import { Token as TokenType } from 'types/token'
import { type Chain, isAddress, isAddressEqual } from 'viem'

import { NoTokensMatch } from './noTokensMatch'
import { Token } from './token'

const isCustomToken = (userTokenList: TokenType[], token: TokenType) =>
  userTokenList.some(
    t => t.address === token.address && t.chainId === token.chainId,
  )

type Props = {
  chainId: Chain['id']
  closeModal: () => void
  onSelectToken: (token: TokenType) => void
  tokens: TokenType[]
}

const List = function ({
  hasCustomTokens,
  onSelectToken,
  tokens,
}: Omit<Props, 'chainId' | 'closeModal'> & { hasCustomTokens: boolean }) {
  const parentRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('token-selector')
  const { userTokenList } = useUserTokenList()

  const rowVirtualizer = useVirtualizer({
    count: tokens.length,
    estimateSize: () => 52,
    getScrollElement: () => parentRef.current,
    overscan: 5,
  })

  const customTokensLabelHeight = 28

  const getList = function () {
    const rows: JSX.Element[] = []
    const virtualItems = rowVirtualizer.getVirtualItems()
    let hasAddedCustomTokensLabel = false

    for (let rowIndex = 0; rowIndex < virtualItems.length; rowIndex++) {
      const virtualItem = virtualItems[rowIndex]
      const token = tokens[virtualItem.index]

      if (!hasAddedCustomTokensLabel && isCustomToken(userTokenList, token)) {
        rows.push(
          <div
            className="absolute left-0 top-0 w-full"
            key="manually_added"
            style={{
              height: customTokensLabelHeight,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <h6 className="py-3 pb-1.5 text-sm font-medium text-neutral-500">
              {t('manually-added-tokens')}
            </h6>
          </div>,
        )
        hasAddedCustomTokensLabel = true
      }
      rows.push(
        <li
          className="absolute left-0 top-0 w-full cursor-pointer rounded-lg hover:bg-neutral-100"
          key={virtualItem.index}
          onClick={() => onSelectToken(token)}
          style={{
            height: '52px',
            // After showing the custom tokens label, we need to adjust the position of all the following tokens to consider it
            transform: `translateY(${
              virtualItem.start +
              (hasAddedCustomTokensLabel ? customTokensLabelHeight : 0)
            }px)`,
          }}
        >
          <Token token={token} />
        </li>,
      )
    }
    return rows
  }

  return (
    <div
      className="skip-parent-padding-x mx-auto h-[212px] w-[calc(100%-theme(spacing.4)*2)]
      overflow-y-auto md:w-[calc(100%-theme(spacing.6)*2)]"
      ref={parentRef}
    >
      <ul
        className="relative w-full"
        style={{
          height: `${
            rowVirtualizer.getTotalSize() +
            (hasCustomTokens ? customTokensLabelHeight : 0)
          }px`,
        }}
      >
        {getList()}
      </ul>
    </div>
  )
}

const bySymbol = (a: TokenType, b: TokenType) =>
  a.symbol.localeCompare(b.symbol)

export const TokenList = function ({
  chainId,
  closeModal,
  onSelectToken,
  tokens,
}: Props) {
  const t = useTranslations('token-selector')
  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText)
  const { userTokenList } = useUserTokenList()
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

  const [customTokens, supportedTokens] = partition(tokensToList, token =>
    isCustomToken(userTokenList, token),
  )

  const [pinnedTokens, restOfTokens] = partition(
    supportedTokens,
    token =>
      token.symbol === 'ETH' ||
      token.symbol.includes('USDC') ||
      token.symbol.includes('USDT'),
  )

  const sortedTokens = pinnedTokens
    .sort(bySymbol)
    .concat(restOfTokens.sort(bySymbol))
    .concat(customTokens.sort(bySymbol))

  const content = (
    <div className="drawer-content h-90 gap-x-3 gap-y-0 md:w-96">
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
          hasCustomTokens={customTokens.length > 0}
          onSelectToken={function (token) {
            onSelectToken(token)
            closeModal()
          }}
          tokens={sortedTokens}
        />
      ) : (
        <NoTokensMatch
          chainId={chainId}
          closeModal={closeModal}
          searchText={debouncedSearchText}
        />
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
