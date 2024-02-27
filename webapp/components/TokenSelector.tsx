'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { Token } from 'types/token'

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

type Props = {
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
                    <span className="uppercase">{token.symbol}</span>
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
        onClick={openModal}
        type="button"
      >
        <TokenLogo token={selectedToken} />
        <span className="text-xs font-medium uppercase text-slate-700 sm:text-sm">
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
          <div className="mx-8 flex w-full flex-col bg-white p-4 sm:max-w-96">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium">{t('select-token')}</h3>
              <CloseIcon onClick={closeModal} />
            </div>
            {/* hidden for now, as we won't allow adding custom tokens */}
            {/* <div className="border-b border-gray-200 text-center text-sm font-medium text-gray-500">
              <ul className="-mb-px flex flex-wrap text-black">
                <li className="me-2">
                  <button className="active inline-block rounded-t-lg border-b-2 border-transparent p-4 hover:border-gray-300 hover:text-gray-600">
                    Tokens
                  </button>
                </li>
                
                <li className="me-2">
                  <button className="active inline-block rounded-t-lg border-b-2 border-blue-600 p-4 text-blue-600 dark:border-blue-500 dark:text-blue-500">
                    Custom Tokens
                  </button>
                </li>
              </ul>
            </div> */}
            <div className="my-4 flex w-full items-center bg-zinc-50 px-4 py-3">
              <svg
                fill="none"
                height="21"
                viewBox="0 0 21 21"
                width="21"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g id="search">
                  <path
                    clipRule="evenodd"
                    d="M17.25 9.5C17.25 13.7802 13.7802 17.25 9.5 17.25C5.21979 17.25 1.75 13.7802 1.75 9.5C1.75 5.21979 5.21979 1.75 9.5 1.75C13.7802 1.75 17.25 5.21979 17.25 9.5ZM9.5 18.75C14.6086 18.75 18.75 14.6086 18.75 9.5C18.75 4.39137 14.6086 0.25 9.5 0.25C4.39137 0.25 0.25 4.39137 0.25 9.5C0.25 14.6086 4.39137 18.75 9.5 18.75ZM20.4217 20.4217C19.6506 21.1928 18.4004 21.1928 17.6293 20.4217L15.7563 18.5488C16.8465 17.7936 17.7936 16.8465 18.5488 15.7563L20.4217 17.6292C21.1928 18.4003 21.1928 19.6506 20.4217 20.4217Z"
                    fill="#93989A"
                    fillRule="evenodd"
                    id="combo shape"
                  />
                </g>
              </svg>
              <input
                className="ml-4 w-full bg-transparent placeholder:text-sm placeholder:text-neutral-400"
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
        </Modal>
      )}
    </>
  )
}
