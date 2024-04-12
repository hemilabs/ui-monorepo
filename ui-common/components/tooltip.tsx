import RcTooltip from 'rc-tooltip'
import { RCTooltip } from 'rc-tooltip/index'

import 'rc-tooltip/assets/bootstrap_white.css'

export const Tooltip = function ({
  disabled = false,
  overlay,
  overlayClassName = '',
  children,
  id,
  placement = 'top',
}: RCTooltip.Props & { disabled?: boolean }) {
  if (!overlay || disabled) {
    return <>{children}</>
  }

  return (
    <RcTooltip
      align={{
        overflow: { adjustX: true, adjustY: true },
      }}
      destroyTooltipOnHide
      id={id}
      overlay={overlay}
      overlayClassName={`no-opacity mx-auto w-fit ${overlayClassName}`}
      // @ts-expect-error placement type incorrectly defined in @types/rc-tooltip
      placement={placement}
      showArrow={false}
      trigger={['click', 'hover', 'focus']}
    >
      <div className="cursor-pointer">{children}</div>
    </RcTooltip>
  )
}
