type Props = {
  position: number
}

export const PositionStatus = ({ position }: Props) => (
  <div
    className="flex aspect-square h-5 items-center justify-center rounded-full 
    bg-neutral-300/55 text-neutral-500"
  >
    <span className="flex-shrink-0 flex-grow-0 text-center text-sm lining-nums tabular-nums">
      {position}
    </span>
  </div>
)
