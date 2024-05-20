'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { Token } from 'types/token'
import { Card } from 'ui-common/components/card'

import { Balance } from './balance'
import { TokenLogo } from './tokenLogo'

const CloseIcon = dynamic(
  () => import('ui-common/components/closeIcon').then(mod => mod.CloseIcon),
  {
    ssr: false,
  },
)

const Modal = dynamic(
  () => import('ui-common/components/modal').then(mod => mod.Modal),
  {
    ssr: false,
  },
)

const MagnifyingGlass = () => (
  <svg
    fill="none"
    height="25"
    viewBox="0 0 24 25"
    width="24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 20.5L16.05 16.55M18 11.5C18 15.366 14.866 18.5 11 18.5C7.13401 18.5 4 15.366 4 11.5C4 7.63401 7.13401 4.5 11 4.5C14.866 4.5 18 7.63401 18 11.5Z"
      stroke="black"
      strokeLinecap="round"
      strokeWidth="2"
    />
  </svg>
)

type Props = {
  disabled: boolean
  onSelectToken: (token: Token) => void
  selectedToken: Token
  tokens: Token[]
}

const TokenList = function ({
  onSelectToken,
  tokens,
}: Pick<Props, 'onSelectToken' | 'tokens'>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: tokens.length,
    estimateSize: () => 52,
    getScrollElement: () => parentRef.current,
    overscan: 10,
  })

  return (
    <div className="h-96 w-full overflow-y-auto" ref={parentRef}>
      <ul
        className="relative w-full"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map(function (virtualItem) {
          const token = tokens[virtualItem.index]
          return (
            <li
              className="absolute left-0 top-0 w-full cursor-pointer hover:bg-slate-100"
              key={virtualItem.index}
              onClick={() => onSelectToken(token)}
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="flex items-center py-2">
                <div className="flex-shrink-0">
                  <TokenLogo token={token} />
                </div>
                <div className="mx-2 flex w-full flex-col text-xs">
                  <div className="flex items-center justify-between font-medium">
                    <span>{token.name}</span>
                    <Balance token={token} />
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>{token.symbol}</span>
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

export const TokenSelector = function ({
  disabled,
  onSelectToken,
  selectedToken,
  tokens,
}: Props) {
  const t = useTranslations('token-selector')
  const [showTokenSelector, setShowTokenSelector] = useState(false)
  const [searchText, setSearchText] = useState('')

  const closeModal = () => setShowTokenSelector(false)
  const openModal = () => setShowTokenSelector(true)

  const tokensToList = tokens.filter(
    token =>
      token.name.toLowerCase().includes(searchText.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchText.toLowerCase()),
  )

  return (
    <>
      <button
        className="flex items-center justify-end gap-x-2 text-xs"
        disabled={disabled}
        onClick={openModal}
        type="button"
      >
        <TokenLogo token={selectedToken} />
        <span className="text-xs font-medium text-slate-700 sm:text-sm">
          {selectedToken.symbol}
        </span>
        <svg
          fill="none"
          height="16"
          viewBox="0 0 17 16"
          width="17"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            d="M4.65561 4.32695C4.21967 3.89102 3.51288 3.89102 3.07695 4.32695C2.64102 4.76288 2.64102 5.46967 3.07695 5.90561L7.96067 10.7893C8.39661 11.2253 9.10339 11.2253 9.53933 10.7893L14.423 5.90561C14.859 5.46967 14.859 4.76288 14.423 4.32695C13.9871 3.89102 13.2803 3.89102 12.8444 4.32695L8.75 8.42134L4.65561 4.32695Z"
            fill="#2E3A59"
            fillRule="evenodd"
          />
        </svg>
      </button>
      {showTokenSelector && (
        <Modal onClose={closeModal}>
          <div className="w-[calc(100vw-2rem)] px-4 sm:w-screen sm:max-w-96">
            <Card padding="medium" radius="large">
              <div className="mx-2 flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{t('choose-token')}</h3>
                  <CloseIcon onClick={closeModal} />
                </div>
                <div className="my-4 flex w-full items-center rounded-2xl bg-zinc-50 px-3 py-2">
                  <MagnifyingGlass />
                  <input
                    className="ml-4 w-full bg-transparent placeholder:text-xs placeholder:text-neutral-400"
                    onChange={e => setSearchText(e.target.value)}
                    placeholder={t('search-tokens')}
                    type="text"
                    value={searchText}
                  ></input>
                </div>
                {tokensToList.length > 0 ? (
                  <TokenList
                    onSelectToken={function (token) {
                      onSelectToken(token)
                      closeModal()
                    }}
                    tokens={tokensToList}
                  />
                ) : (
                  <span>{t('no-tokens')}</span>
                )}
              </div>
            </Card>
          </div>
        </Modal>
      )}
    </>
  )
}
