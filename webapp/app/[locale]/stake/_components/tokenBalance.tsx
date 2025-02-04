import { ReactNode } from 'react'

type Props = {
  balance: ReactNode
}

export const TokenBalance = ({ balance }: Props) => (
  <div className="flex flex-col justify-end">
    <span className="text-neutral-950">{balance}</span>
    <p className="text-neutral-500">
      <span className="mr-1">$</span>
      {/* TODO - TBD how to calculate monetaryValue - https://github.com/hemilabs/ui-monorepo/issues/796 */}
      125
    </p>
  </div>
)
