import Link from 'next-intl/link'

type Props = {
  className?: string
  txHash: string
  operation: string
  text: string
}

export const CallToAction = ({
  className = 'bg-orange-950 text-white',
  txHash,
  operation,
  text,
}: Props) => (
  <Link
    className={`inline-block rounded-3xl px-5 py-3 text-xs ${className}`}
    href={`/tunnel?txHash=${txHash}&operation=${operation}`}
  >
    {text}
  </Link>
)
