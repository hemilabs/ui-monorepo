import RcTooltip from 'rc-tooltip'
import { TooltipProps } from 'rc-tooltip/lib/Tooltip'
import { type ReactNode } from 'react'

import 'rc-tooltip/assets/bootstrap_white.css'

type SimpleInfoVariant = Omit<TooltipProps, 'overlay'> & {
  children?: TooltipProps['children']
  text: ReactNode
  variant: 'simple' | 'info'
}

type RichVariant = Omit<TooltipProps, 'overlay'> & {
  children?: TooltipProps['children']
  text: ReactNode
  title?: ReactNode
  variant: 'rich'
}

export type BaseTooltipProps =
  | (SimpleInfoVariant & { title?: never })
  | RichVariant

function getOverlay(props: BaseTooltipProps) {
  const commonCss = 'bg-neutral-950 border border-solid border-black/85'

  const text = props.text!
  const variant = props.variant!

  if (variant === 'simple') {
    return (
      <div className={`${commonCss} rounded-md px-1.5 py-1`}>
        <div className="font-medium text-white">{text}</div>
      </div>
    )
  }

  if (variant === 'info') {
    return (
      <div className={`${commonCss} rounded-xl p-3`}>
        <div className="font-medium text-white">{text}</div>
      </div>
    )
  }

  return (
    <div className={`${commonCss} flex flex-col gap-y-1 rounded-xl p-4`}>
      {props.title && (
        <p className="text-smd font-semibold text-white">{props.title}</p>
      )}
      <div className="text-sm font-medium text-neutral-400">{text}</div>
    </div>
  )
}

export const BaseTooltip = function (
  props: BaseTooltipProps & { visible?: boolean },
) {
  const {
    children,
    id,
    placement = 'top',
    trigger = ['click', 'hover', 'focus'],
    visible,
  } = props

  return (
    <RcTooltip
      align={{
        overflow: { adjustX: true, adjustY: true, shiftX: true },
      }}
      classNames={{
        root: 'pointer-events-none max-w-[100vw] xs:max-w-102 [&_.rc-tooltip-inner>*]:pointer-events-auto [&_.rc-tooltip-inner]:min-h-0 [&_.rc-tooltip-inner]:border-none [&_.rc-tooltip-inner]:bg-transparent [&_.rc-tooltip-inner]:p-0 [&_.rc-tooltip-inner]:px-4',
      }}
      destroyTooltipOnHide
      id={id}
      overlay={getOverlay(props)}
      placement={placement}
      showArrow={false}
      styles={{
        root: {
          background: 'transparent',
          opacity: 1,
          padding: 0,
        },
      }}
      trigger={trigger}
      visible={visible}
    >
      {children}
    </RcTooltip>
  )
}
