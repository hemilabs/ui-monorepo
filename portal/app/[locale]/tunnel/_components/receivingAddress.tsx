import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'

type LabelProps = {
  receivingText: string
  tooltipText: string
}

export const ReceivingAddressLabel = ({
  receivingText,
  tooltipText,
}: LabelProps) => (
  <div className="flex items-center gap-x-2">
    <span className="text-neutral-600">{receivingText}</span>
    <Tooltip
      borderRadius="12px"
      id="target-address"
      text={tooltipText}
      variant="info"
    >
      <InfoIcon className="[&>path]:fill-neutral-600" />
    </Tooltip>
  </div>
)

type Props = LabelProps & {
  address: string | undefined
}

export const ReceivingAddress = ({
  address,
  receivingText,
  tooltipText,
}: Props) => (
  <div className="px-auto flex h-24 flex-col items-center rounded-b-2xl border border-solid border-neutral-300/55 bg-neutral-100 pb-3 pt-11 text-sm font-medium">
    <ReceivingAddressLabel
      receivingText={receivingText}
      tooltipText={tooltipText}
    />
    <span className="text-neutral-950">{address ?? '-'}</span>
  </div>
)
