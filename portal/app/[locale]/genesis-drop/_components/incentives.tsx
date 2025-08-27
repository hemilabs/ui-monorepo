import { Tooltip } from 'components/tooltip'
import { useTranslations } from 'next-intl'

import { OdysseyIcon } from '../_icons/odysseyIcon'
import { PlusSignIcon } from '../_icons/plusSignIcon'
import { VesperIcon } from '../_icons/vesperIcon'

const classNameHover =
  'group-hover/container:[&>path]:fill-white group-hover/container:[&>rect]:fill-neutral-950'

export const Incentives = function () {
  const t = useTranslations('genesis-drop.claim-options')
  return (
    <>
      <Tooltip
        id="odyssey-tooltip"
        overlay={<p className="p-2 text-sm font-medium text-white">Odyssey</p>}
      >
        <div className="group/container">
          <OdysseyIcon className={classNameHover} />
        </div>
      </Tooltip>

      <Tooltip
        id="vesper-tooltip"
        overlay={<p className="p-2 text-sm font-medium text-white">Vesper</p>}
      >
        <div className="group/container">
          <VesperIcon className={classNameHover} />
        </div>
      </Tooltip>
      <Tooltip
        id="may-other-partners-tooltip"
        overlay={
          <p className="p-2 text-sm font-medium text-white">
            {t('and-other-partners')}
          </p>
        }
      >
        <div className="group/container">
          <PlusSignIcon className={classNameHover} />
        </div>
      </Tooltip>
    </>
  )
}
