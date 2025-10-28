import { Modal } from 'components/modal'
import { useUmami } from 'hooks/useUmami'
import { useVisualViewportSize } from 'hooks/useVisualViewportSize'
import { useWindowSize } from 'hooks/useWindowSize'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { RemoteChain } from 'types/chain'
import { Token } from 'types/token'

import { Chevron } from '../icons/chevron'
import { TokenLogo } from '../tokenLogo'

const TokenListLoading = function () {
  const { width } = useWindowSize()
  const { height: viewportHeight } = useVisualViewportSize()
  return (
    <Modal verticalAlign={width < 768 ? 'top' : 'center'}>
      <Skeleton
        className="h-full w-screen md:h-[65dvh] md:w-[409px]"
        containerClassName="flex"
        style={{
          height: width < 768 ? `${viewportHeight - 112}px` : undefined,
        }}
      />
    </Modal>
  )
}

const TokenList = dynamic(
  () => import('./tokenList').then(mod => mod.TokenList),
  {
    loading: TokenListLoading,
    ssr: false,
  },
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
        className="shadow-soft group/token-selector flex h-8 w-40 items-center gap-x-1.5 rounded-lg border
        border-solid border-neutral-300/55 bg-white px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
        disabled={disabled || tokens.length < 2}
        onClick={openModal}
        type="button"
      >
        <TokenLogo size="small" token={selectedToken} />
        <span className="font-semibold text-neutral-950">
          {selectedToken.symbol}
        </span>
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
