import RcTooltip from 'rc-tooltip'
import { TooltipProps } from 'rc-tooltip/lib/Tooltip'
import { type ReactNode } from 'react'

import 'rc-tooltip/assets/bootstrap_white.css'

type CommonTooltipProps = {
  borderRadius?: '4px' | '12px'
}

type SimpleInfoVariant = Omit<TooltipProps, 'overlay'> & {
  children?: TooltipProps['children']
  text: ReactNode
  variant: 'simple' | 'info'
}

type RichVariant = Omit<TooltipProps, 'overlay'> & {
  children?: TooltipProps['children']
  text: ReactNode
  title: ReactNode
  variant: 'rich'
}

export type BaseTooltipProps = CommonTooltipProps &
  ((SimpleInfoVariant & { title?: never }) | RichVariant)

function getOverlay(props: BaseTooltipProps) {
  const commonCss = 'bg-neutral-950 border border-solid border-black/85'

  const text = props.text!
  const variant = props.variant!

  if (variant === 'simple') {
    return (
      <div className={`${commonCss} rounded-md px-1.5 py-1`}>
        <p className="font-medium text-white">{text}</p>
      </div>
    )
  }

  if (variant === 'info') {
    return (
      <div className={`${commonCss} rounded-xl p-3`}>
        <p className="font-medium text-white">{text}</p>
      </div>
    )
  }

  const title = props.title!

  return (
    <div className={`${commonCss} flex flex-col gap-y-1 rounded-xl p-4`}>
      <p className="text-smd font-semibold text-white">{title}</p>
      <p className="text-sm font-medium text-neutral-400">{text}</p>
    </div>
  )
}

export const BaseTooltip = function (props: BaseTooltipProps) {
  const {
    borderRadius = '4px',
    children,
    id,
    placement = 'top',
    trigger = ['click', 'hover', 'focus'],
  } = props

  return (
    <RcTooltip
      align={{
        overflow: { adjustX: true, adjustY: true },
      }}
      classNames={{
        root: 'max-w-90 md:max-w-94 [&_.rc-tooltip-inner]:min-h-0 [&_.rc-tooltip-inner]:border-none [&_.rc-tooltip-inner]:p-0',
      }}
      destroyTooltipOnHide
      id={id}
      overlay={getOverlay(props)}
      placement={placement}
      showArrow={false}
      styles={{
        body: {
          borderRadius,
        },
        root: { borderRadius, opacity: 1, padding: 0 },
      }}
      trigger={trigger}
    >
      {children}
    </RcTooltip>
  )
}
