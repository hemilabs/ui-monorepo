import { DrawerLoader } from 'components/drawer/drawerLoader'
import { Modal } from 'components/modal'
import { useUmami } from 'hooks/useUmami'
import { useWindowSize } from 'hooks/useWindowSize'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { RemoteChain } from 'types/chain'
import { Token } from 'types/token'
import { Token as TokenType } from 'types/token'

import { Chevron } from '../icons/chevron'
import { TokenLogo } from '../tokenLogo'

const TokenListLoading = function () {
  const { width } = useWindowSize()
  return width > 768 ? (
    <Modal>
      <Skeleton className="h-[65dvh] w-[409px]" containerClassName="flex" />
    </Modal>
  ) : (
    <DrawerLoader className="h-[65dvh] md:hidden" />
  )
}

const TokenList = dynamic(
  () => import('./tokenList').then(mod => mod.TokenList),
  {
    loading: TokenListLoading,
    ssr: false,
  },
)

export const isCustomToken = (userTokenList: TokenType[], token: TokenType) =>
  userTokenList.some(
    t => t.address === token.address && t.chainId === token.chainId,
  )

type Props = {
  chainId: RemoteChain['id']
  disabled: boolean
  onSelectToken: (token: Token) => void
  selectedToken: Token
  tokens: Token[]
}

export const TokenSelector = function ({
  chainId,
  disabled,
  onSelectToken,
  selectedToken,
  tokens,
}: Props) {
  const [showTokenSelector, setShowTokenSelector] = useState(false)
  const { track } = useUmami()

  const closeModal = () => setShowTokenSelector(false)
  const openModal = () => setShowTokenSelector(true)

  const handleSelection = function (token: Token) {
    onSelectToken(token)
    track?.('select token')
  }

  return (
    <>
      <button
        className="shadow-soft group/token-selector flex items-center gap-x-2 rounded-lg border
        border-solid border-neutral-300/55 bg-white p-2 text-sm font-medium hover:bg-neutral-100"
        disabled={disabled || tokens.length < 2}
        onClick={openModal}
        type="button"
      >
        <TokenLogo size="small" token={selectedToken} />
        <span className="text-neutral-950">{selectedToken.symbol}</span>
        {tokens.length > 1 && (
          <Chevron.Bottom className="ml-auto flex-shrink-0 [&>path]:fill-neutral-500 [&>path]:group-hover/token-selector:fill-neutral-950" />
        )}
      </button>
      {showTokenSelector && typeof chainId === 'number' && (
        <TokenList
          chainId={chainId}
          closeModal={closeModal}
          onSelectToken={handleSelection}
          tokens={tokens}
        />
      )}
    </>
  )
}
