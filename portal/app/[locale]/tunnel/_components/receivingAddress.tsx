import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'

type Props = {
  address: string | undefined
  receivingText: string
  tooltipText: string
}

export const ReceivingAddress = ({
  address,
  receivingText,
  tooltipText,
}: Props) => (
  <div
    className="px-auto flex h-24 flex-col items-center rounded-b-2xl border
    border-solid border-neutral-300/55 bg-neutral-100 pb-3 pt-11 text-sm font-medium"
  >
    <div className="flex items-center gap-x-2">
      <span className="text-neutral-600">{receivingText}</span>
      <Tooltip
        borderRadius="12px"
        id="target-address"
        overlay={
          <div className="max-w-64 p-3.5">
            <p className="text-sm font-medium text-white">{tooltipText}</p>
          </div>
        }
      >
        <InfoIcon className="[&>path]:fill-neutral-600" />
      </Tooltip>
    </div>
    <span className="text-neutral-950">{address ?? '-'}</span>
  </div>
)
