import { Tooltip } from 'ui-common/components/tooltip'

const InfoIcon = () => (
  <svg fill="none" height={12} width={12} xmlns="http://www.w3.org/2000/svg">
    <path
      clipRule="evenodd"
      d="M6 .991a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-1 4.5a.5.5 0 0 1 .5-.5H6a.5.5 0 0 1 .5.5v2.5a.5.5 0 0 1-1 0v-2a.5.5 0 0 1-.5-.5Zm1-2a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1Z"
      fill="#09090B"
      fillRule="evenodd"
    />
  </svg>
)

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
  <div className="flex flex-col gap-y-1 text-xs leading-normal">
    <div className="flex items-center gap-x-2">
      <span className="font-normal text-zinc-900">{receivingText}</span>
      <Tooltip
        id="target-address"
        overlay={
          <div className="w-60">
            <p className="text-xs text-gray-600">{tooltipText}</p>
          </div>
        }
      >
        <InfoIcon />
      </Tooltip>
    </div>
    <span className="font-medium text-slate-950">{address ?? '-'}</span>
  </div>
)
