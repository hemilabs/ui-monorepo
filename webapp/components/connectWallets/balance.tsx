import { DisplayAmount } from 'components/displayAmount'
import { ReactNode } from 'react'
import { Token } from 'types/token'

const Container = ({ children }: { children: ReactNode }) => (
  <div
    className="text-3.25xl flex items-baseline gap-x-1 font-medium
  text-neutral-950"
  >
    {children}
  </div>
)

const SymbolContainer = ({ children }: { children: ReactNode }) => (
  <span className="text-sm text-neutral-500">{children}</span>
)

export const Balance = ({
  balance,
  token,
}: {
  balance: string | undefined
  token: Token
}) => (
  <div className="px-2 pb-2 pt-8 md:pb-0 md:pt-12">
    {balance ? (
      <DisplayAmount
        amount={balance}
        container={Container}
        symbolContainer={SymbolContainer}
        token={token}
      />
    ) : (
      <span className="text-3.25xl text-neutral-950">...</span>
    )}
  </div>
)
