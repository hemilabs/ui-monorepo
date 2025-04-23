type Props = {
  dashed?: boolean
  stroke:
    | 'stroke-neutral-300'
    | 'stroke-neutral-300/55'
    | 'stroke-orange-500'
    | 'stroke-rose-500'
}

export const ShortVerticalLine = ({ dashed = true, stroke }: Props) => (
  <svg fill="none" height="24" viewBox="0 0 2 24" width="2">
    <path
      className={stroke}
      d="M1 0V24"
      strokeDasharray={dashed ? '3 2' : ''}
    />
  </svg>
)

export const LongVerticalLine = ({ dashed = true, stroke }: Props) => (
  <svg fill="none" height="68" viewBox="0 0 2 68" width="2">
    <path
      className={stroke}
      d="M1 0L1 68"
      strokeDasharray={dashed ? '3 2' : ''}
    />
  </svg>
)
