import { LongVerticalLine } from 'components/verticalLines'

type Props = {
  description?: string
  position: number
}

const StepNumber = ({ position }: { position: number }) => (
  <div className="flex size-full flex-col justify-center text-center text-[11px] font-semibold lining-nums tabular-nums leading-[0] tracking-[0.11px] text-white">
    <span className="leading-[11px]">{position}</span>
  </div>
)

export const Step = ({ description, position }: Props) => (
  <div className="relative h-[68px] w-5 shrink-0">
    <div className="absolute left-1/2 top-0 -translate-x-1/2">
      <LongVerticalLine dashed={false} stroke="stroke-neutral-300" />
    </div>
    <div className="absolute left-0 top-6 z-10 size-5 rounded-full bg-orange-600">
      <StepNumber position={position} />
    </div>
    {description ? (
      <span className="absolute left-7 top-6 text-sm font-medium text-orange-600">
        {description}
      </span>
    ) : null}
  </div>
)
