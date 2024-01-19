import { Card } from './design/card'

type SubSectionProps = {
  symbol: string
  text: string
  value: string
}
const SubSection = ({ symbol, text, value }: SubSectionProps) => (
  <div className="flex items-center justify-between py-3 text-xs font-normal md:text-sm">
    <p className="text-zinc-400">{text}</p>
    <span className="uppercase">
      {value === '0' ? '-' : `${value} ${symbol}`}
    </span>
  </div>
)

const Heading = ({ text }: { text: string }) => (
  <h4 className="pb-3 text-base font-medium text-black md:text-xl">{text}</h4>
)

type DepositProps = {
  deposit: string
  depositSymbol: string
  gas: string
  gasSymbol: string
  targetSymbol: string
  total: string
}
export const ReviewDeposit = ({
  deposit,
  depositSymbol,
  gas,
  gasSymbol,
  targetSymbol,
  total,
}: DepositProps) => (
  <Card>
    <Heading text="Review Deposit" />
    <SubSection
      symbol={depositSymbol}
      text="You are Depositing"
      value={deposit}
    />
    <SubSection symbol={gasSymbol} text="Ethereum Gas fee" value={gas} />
    <div className="absolute left-0 right-0 h-px border-t border-zinc-400"></div>
    <SubSection symbol={targetSymbol} text="Total" value={total} />
  </Card>
)

export const ReviewSwap = () => (
  <Card>
    <Heading text="Review Swap" />
    <SubSection symbol="eth" text="Price impact" value="-" />
    <SubSection symbol="eth" text="Max. slippage" value="-" />
    <SubSection symbol="eth" text="Gas fee" value="-" />
    <SubSection symbol="eth" text="Order Routing" value="-" />
  </Card>
)
