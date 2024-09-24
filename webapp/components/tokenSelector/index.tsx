import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Token } from 'types/token'

import { Chevron } from '../icons/chevron'
import { TokenLogo } from '../tokenLogo'

const TokenList = dynamic(() =>
  import('./tokenList').then(mod => mod.TokenList),
)

type Props = {
  disabled: boolean
  onSelectToken: (token: Token) => void
  selectedToken: Token
  tokens: Token[]
}

export const TokenSelector = function ({
  disabled,
  onSelectToken,
  selectedToken,
  tokens,
}: Props) {
  const [showTokenSelector, setShowTokenSelector] = useState(false)

  const closeModal = () => setShowTokenSelector(false)
  const openModal = () => setShowTokenSelector(true)

  return (
    <>
      <button
        className="text-ms shadow-soft group/token-selector flex items-center gap-x-2 rounded-lg
        border border-solid border-neutral-300/55 bg-white p-2 font-medium hover:bg-neutral-100"
        disabled={disabled || tokens.length < 2}
        onClick={openModal}
        type="button"
      >
        <div className="h-5 w-5">
          <TokenLogo token={selectedToken} />
        </div>
        <span className="text-neutral-950">{selectedToken.symbol}</span>
        {tokens.length > 1 && (
          <Chevron.Bottom className="ml-auto flex-shrink-0 [&>path]:fill-neutral-500 [&>path]:group-hover/token-selector:fill-neutral-950" />
        )}
      </button>
      {showTokenSelector && (
        <TokenList
          closeModal={closeModal}
          onSelectToken={onSelectToken}
          tokens={tokens}
        />
      )}
    </>
  )
}
