'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { Card } from 'components/card'
import { Drawer } from 'components/drawer'
import { CloseIcon } from 'components/icons/closeIcon'
import { SearchInput } from 'components/inputText'
import { Modal } from 'components/modal'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { Token } from 'types/token'
import { useWindowSize } from 'ui-common/hooks/useWindowSize'

import { Balance } from '../balance'
import { TokenLogo } from '../tokenLogo'

type Props = {
  closeModal: () => void
  onSelectToken: (token: Token) => void
  tokens: Token[]
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
              <div className="flex items-center gap-x-3 p-2 text-sm font-medium text-neutral-950">
                <div className="flex-shrink-0 flex-grow-0">
                  <TokenLogo size="medium" token={token} />
                </div>
                <div className="flex w-full flex-col">
                  <div className="flex items-center justify-between">
                    <span>{token.name}</span>
                    <Balance token={token} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">{token.symbol}</span>
                    {/*  Hiding as there are no usd rates so far*/}
                    {/* <span>$1,234.12</span> */}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export const TokenList = function ({
  closeModal,
  onSelectToken,
  tokens,
}: Props) {
  const t = useTranslations('token-selector')
  const [searchText, setSearchText] = useState('')

  const { width } = useWindowSize()

  const tokensToList = tokens
    .filter(
      token =>
        token.name.toLowerCase().includes(searchText.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchText.toLowerCase()),
    )
    .sort(function (a, b) {
      if (a.symbol === 'ETH') return -1
      if (b.symbol === 'ETH') return 1
      // using startsWith due to .e symbol version in Hemi
      if (a.symbol.startsWith('USDC')) return -1
      if (b.symbol.startsWith('USDC')) return 1
      if (a.symbol.startsWith('USDT')) return -1
      if (b.symbol.startsWith('USDT')) return 1
      return a.name.localeCompare(b.name)
    })

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
      {tokensToList.length > 0 ? (
        <List
          onSelectToken={function (token) {
            onSelectToken(token)
            closeModal()
          }}
          tokens={tokensToList}
        />
      ) : (
        <span className="text-center text-sm font-medium text-neutral-500">
          {t.rich('no-results-for', {
            search: () => (
              <span className="text-neutral-950">{searchText}</span>
            ),
          })}
        </span>
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
