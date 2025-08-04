import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'

export const StakedHemiTooltip = () => (
  <Tooltip
    borderRadius="12px"
    id="staked-hemi"
    overlay={<p className="p-2 text-sm font-medium text-white">TBD</p>}
  >
    <div className="group/icon">
      <InfoIcon className="group-hover/icon:[&>g>path]:fill-neutral-950" />
    </div>
  </Tooltip>
)
