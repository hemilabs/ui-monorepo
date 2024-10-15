import RcTooltip from 'rc-tooltip'
import { TooltipProps } from 'rc-tooltip/lib/Tooltip'

import 'rc-tooltip/assets/bootstrap_white.css'

export const Tooltip = function ({
  disabled = false,
  overlay,
  overlayClassName = '',
  overlayInnerStyle,
  children,
  id,
  placement = 'top',
  trigger = ['click', 'hover', 'focus'],
}: TooltipProps & { disabled?: boolean }) {
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
      overlayInnerStyle={overlayInnerStyle}
      placement={placement}
      showArrow={false}
      trigger={trigger}
    >
      <div className="cursor-pointer">{children}</div>
    </RcTooltip>
  )
}
