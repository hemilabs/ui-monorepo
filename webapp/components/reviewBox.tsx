type SubSectionProps = {
  text: string
  value: string | undefined
}
const SubSection = ({ text }: SubSectionProps) => (
  <div className="flex items-center justify-between py-3">
    <p className="text-zinc-400">{text}</p>
    <span>-</span>
  </div>
)
export const ReviewDeposit = () => (
  <article className="flex flex-col rounded-xl bg-white px-4 py-5">
    <h4 className="text-xl font-medium text-black">Review Deposit</h4>
    <SubSection text="You are Depositing" value="0.123 ETH" />
    <SubSection text="Ethereum Gas fee" value="0.123 ETH" />
    <SubSection text="BVM Gas fee" value="0.123 ETH" />
    <SubSection text="Execution time" value="-" />
  </article>
)

export const ReviewSwap = () => (
  <article className="flex flex-col rounded-xl bg-white px-4 py-5">
    <h4 className="text-xl font-medium text-black">Review Swap</h4>
    <SubSection text="Price impact" value="-" />
    <SubSection text="Max. slippage" value="-" />
    <SubSection text="Gas fee" value="-" />
    <SubSection text="Order Routing" value="-" />
  </article>
)
