import Big from 'big.js'

type SubSectionProps = {
  symbol: string
  text: string
  value: string
}
export const SubSection = function ({ symbol, text, value }: SubSectionProps) {
  const getValue = () =>
    Big(value.replace(/,/g, '')).lt('0.001') ? '< 0.001' : value

  return (
    <div className="flex items-center justify-between py-3 text-xs font-normal md:text-sm">
      <p className="text-zinc-400">{text}</p>
      <span>{value === '0' ? '-' : `${getValue()} ${symbol}`}</span>
    </div>
  )
}
export const Heading = ({ text }: { text: string }) => (
  <h4 className="pb-3 text-base font-medium text-black md:text-xl">{text}</h4>
)
