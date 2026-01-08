'use client'

import { Card } from 'components/card'
import { CloseIcon } from 'components/icons/closeIcon'
import { MagnifyingGlassIcon } from 'components/icons/magnifyingGlassIcon'
import { SearchInput } from 'components/inputText'
import { Modal } from 'components/modal'
import { useDebounce } from 'hooks/useDebounce'
import { useTopTokensToHighlight } from 'hooks/useTopTokensToHighlight'
import { useUserTokenList } from 'hooks/useUserTokenList'
import { useVisualViewportSize } from 'hooks/useVisualViewportSize'
import { useWindowSize } from 'hooks/useWindowSize'
import partition from 'lodash/partition'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { screenBreakpoints } from 'styles'
import { Token as TokenType } from 'types/token'
import { isCustomToken } from 'utils/token'
import { type Chain, isAddress, isAddressEqual } from 'viem'

import { List } from './list'
import { NoTokensMatch } from './noTokensMatch'
import { TokenListSkeleton } from './tokenListSkeleton'
import { TokenQuickSelect } from './tokenQuickSelect'

type Props = {
  chainId: Chain['id']
  closeModal: () => void
  onSelectToken: (token: TokenType) => void
  tokens: TokenType[]
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
  const { userTokenList } = useUserTokenList(chainId)
  const { width } = useWindowSize()
  const { height: viewportHeight } = useVisualViewportSize()

  // Define a list of default priority tokens by their addresses
  // These tokens will be prioritized in the quick selection section
  const defaultPriorityTokensByAddress = [
    'ETH',
    // USDC Sepolia
    '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
    // USDT Sepolia
    '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    // USDC.e Sepolia
    '0xD47971C7F5B1067d25cd45d30b2c9eb60de96443',
    // USDT.e Sepolia
    '0x3Adf21A6cbc9ce6D5a3ea401E7Bae9499d391298',
    // USDC Mainnet
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    // USDT Mainnet
    '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    // USDC Hemi
    '0xad11a8BEb98bbf61dbb1aa0F6d6F2ECD87b35afA',
    // USDT Hemi
    '0xbB0D083fb1be0A9f6157ec484b6C79E0A4e31C2e',
  ]

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

  const quickSelectionTokens = tokens.filter(token =>
    defaultPriorityTokensByAddress.some(address => token.address === address),
  )

  const {
    isLoading: isLoadingTopTokens,
    sortedTokens: fetchedSortedTopTokens,
  } = useTopTokensToHighlight({
    tokens: supportedTokens,
  })

  const restOfTokens = supportedTokens
    .filter(
      token =>
        !fetchedSortedTopTokens.some(top => top.address === token.address),
    )
    .sort(bySymbol)

  const sortedTokens = [
    // Do not sort 'fetchedSortedTopTokens' again; already sorted by balance in hook.
    ...(fetchedSortedTopTokens as TokenType[])
      .concat(restOfTokens)
      .concat(customTokens.sort(bySymbol)),
  ]

  function handleSelectToken(token: TokenType) {
    onSelectToken(token)
    closeModal()
  }

  const onKeyDown = function (e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleSelectToken(sortedTokens[0])
    }
  }

  const addKeyDownListener = sortedTokens.length === 1 ? onKeyDown : undefined

  const content = (
    <div
      className="flex h-screen w-screen flex-col gap-x-3 overflow-hidden bg-white pt-6 md:h-[65dvh] md:w-[409px] md:bg-transparent [&>:not(.skip-parent-padding-x)]:px-4 [&>:not(.skip-parent-padding-x)]:md:px-6"
      style={{
        // On mobile devices, when the virtual keyboard is open, the visible viewport height (visualViewport.height)
        // becomes smaller than the full window height. To ensure the modal fits within the remaining space plus the extra space,
        // we uses visualViewport to detect available height
        // On desktop (md:), fallback to Tailwind-defined height.
        height:
          width < screenBreakpoints.md
            ? `${viewportHeight - 112}px`
            : undefined,
        scrollbarColor: '#d4d4d4 transparent',
        scrollbarWidth: 'thin',
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-mid-md font-semibold text-neutral-950">
          {t('select-token')}
        </h3>
        <CloseIcon
          className="scale-125 cursor-pointer [&>path]:hover:fill-neutral-950"
          onClick={closeModal}
        />
      </div>
      <div className="py-4">
        <SearchInput
          autoFocus={width >= screenBreakpoints.md}
          name="search-tokens"
          onChange={e => setSearchText(e.target.value)}
          onClear={() => setSearchText('')}
          onKeyDown={addKeyDownListener}
          placeholder={t('search-tokens')}
          size="s"
          value={searchText}
        />
      </div>
      {!searchText ? (
        <div className="mb-4">
          <TokenQuickSelect
            onSelect={token => handleSelectToken(token)}
            tokens={quickSelectionTokens}
          />
        </div>
      ) : (
        <div className="mb-2 flex items-center gap-x-2">
          <MagnifyingGlassIcon />
          <div className="text-sm font-medium text-neutral-500">
            {t('search-results')}
          </div>
        </div>
      )}
      {isLoadingTopTokens || searchText !== debouncedSearchText ? (
        <div className="mt-2">
          <TokenListSkeleton />
        </div>
      ) : sortedTokens.length > 0 ? (
        <List
          chainId={chainId}
          isSearchActive={!!searchText}
          onSelectToken={token => handleSelectToken(token)}
          tokens={searchText ? restOfTokens : supportedTokens.sort(bySymbol)}
          yourTokens={fetchedSortedTopTokens}
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

  return (
    <Modal
      onClose={closeModal}
      verticalAlign={width < screenBreakpoints.md ? 'top' : 'center'}
    >
      <Card>
        <div className="overflow-hidden bg-white">{content}</div>
      </Card>
    </Modal>
  )
}
