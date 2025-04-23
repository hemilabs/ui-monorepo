import RcTooltip from 'rc-tooltip'
import { TooltipProps } from 'rc-tooltip/lib/Tooltip'

import 'rc-tooltip/assets/bootstrap_white.css'

export const Tooltip = function ({
  borderRadius = '4px',
  disabled = false,
  overlay,
  children,
  id,
  placement = 'top',
  trigger = ['click', 'hover', 'focus'],
}: TooltipProps & { borderRadius?: '4px' | '12px'; disabled?: boolean }) {
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
      overlayClassName="shadow-soft max-w-[360px] bg-neutral-800
        text-white [&_.rc-tooltip-inner]:min-h-0 [&_.rc-tooltip-inner]:border
        [&_.rc-tooltip-inner]:border-solid [&_.rc-tooltip-inner]:border-black/85
        [&_.rc-tooltip-inner]:bg-neutral-800 [&_.rc-tooltip-inner]:p-0"
      // these can't be set by overlayClassName
      overlayInnerStyle={{
        borderRadius,
      }}
      overlayStyle={{
        borderRadius,
        opacity: 1,
        padding: 0,
      }}
      placement={placement}
      showArrow={false}
      trigger={trigger}
    >
      <div className="cursor-pointer">{children}</div>
    </RcTooltip>
  )
}
