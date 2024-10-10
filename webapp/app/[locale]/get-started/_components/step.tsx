import { ShortVerticalLine } from 'components/verticalLines'

type Props = {
  description: string
  position: number
}

export const Step = ({ description, position }: Props) => (
  <div className="mt-1">
    <div className="left-2.25 relative -translate-y-0.5">
      <ShortVerticalLine stroke="stroke-neutral-300" />
    </div>
    <div className="flex items-center gap-x-2">
      <div className="flex aspect-square h-5 items-center justify-center rounded-full bg-orange-500 text-white">
        <span className="flex-shrink-0 flex-grow-0 text-center lining-nums tabular-nums">
          {position}
        </span>
      </div>
      <h4 className="text-ms font-medium leading-5 text-orange-500">
        {description}
      </h4>
    </div>
  </div>
)
