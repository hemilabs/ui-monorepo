type Props = {
  balance: string | undefined
  symbol: string
}

export const Balance = ({ balance, symbol }: Props) => (
  <div className="px-2 pb-2 pt-8 md:pb-0 md:pt-12">
    <div className="flex items-baseline gap-x-1 font-medium">
      <span className="text-3.25xl leading-10 text-neutral-950">
        {balance ? balance : '...'}
      </span>
      <span className="leading-5 text-neutral-500">{symbol}</span>
    </div>
  </div>
)
