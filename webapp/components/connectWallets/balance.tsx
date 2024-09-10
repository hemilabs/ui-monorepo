type Props = {
  balance: string | undefined
  symbol: string
}

export const Balance = ({ balance, symbol }: Props) => (
  <div className="flex items-baseline gap-x-1 font-medium">
    <span className="text-3.25xl leading-10 text-neutral-950">
      {balance ? balance : '...'}
    </span>
    <span className="leading-5 text-neutral-500">{symbol}</span>
  </div>
)
