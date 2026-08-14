import { ReactNode } from 'react'

type Props = {
  balance: ReactNode
  balanceUsd: ReactNode
}

export const TokenBalance = ({ balance, balanceUsd }: Props) => (
  <div className="flex flex-col justify-end">
    <span className="text-neutral-950">{balance}</span>
    <div className="body-text-caption flex items-center text-neutral-500">
      <span className="mr-1">$</span>
      {balanceUsd}
    </div>
  </div>
)
