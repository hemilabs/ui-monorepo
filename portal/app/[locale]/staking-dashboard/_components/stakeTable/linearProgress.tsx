import { InRelativeTime } from 'components/inRelativeTime'

type Props = {
  percentage: number
  unlockTime: number
}

export function LinearProgress({ percentage, unlockTime }: Props) {
  const width = `${Math.min(100, Math.max(0, percentage))}%`

  return (
    <div className="relative flex h-7 w-28 items-center justify-center overflow-hidden rounded-md bg-neutral-100 px-2 py-1.5">
      <div
        className="bg-linear-progress-bar absolute inset-y-0 left-0 transition-all duration-300 ease-out"
        style={{
          width,
        }}
      />
      <span className="z-10 text-xs font-semibold text-neutral-950 first-letter:uppercase">
        <InRelativeTime timestamp={unlockTime} />
      </span>
    </div>
  )
}
