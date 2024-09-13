import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'ui-common/components/tooltip'

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
    className="text-ms px-auto flex h-24
    flex-col items-center rounded-b-2xl
    border border-solid border-neutral-300/55 bg-neutral-100
    pb-3 pt-11 font-medium leading-5"
  >
    <div className="flex items-center gap-x-2">
      <span className="text-neutral-600">{receivingText}</span>
      <Tooltip
        id="target-address"
        overlay={
          <div className="w-60">
            <p className="text-xs text-gray-600">{tooltipText}</p>
          </div>
        }
      >
        <InfoIcon className="[&>path]:fill-neutral-600" />
      </Tooltip>
    </div>
    <span className="text-neutral-950">{address ?? '-'}</span>
  </div>
)
