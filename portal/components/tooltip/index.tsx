import {
  lazy,
  Suspense,
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from 'react'

import { type BaseTooltipProps } from './base'

const BaseTooltip = lazy(() =>
  import('./base').then(mod => ({ default: mod.BaseTooltip })),
)

const linkTrigger = function (
  children: ReactNode,
  describedById: string | undefined,
) {
  // Link the description to the trigger itself rather than leaving it orphaned: clone
  // DOM-element children with aria-describedby (merged with any they already carry),
  // and link the wrapper too for children that need it (components like Button don't
  // forward refs). Without a description the historical wrapper passes through unchanged.
  if (!isValidElement(children) || typeof children.type !== 'string') {
    return (
      <div aria-describedby={describedById} className="cursor-pointer">
        {children}
      </div>
    )
  }
  if (describedById === undefined) {
    return <div className="cursor-pointer">{children}</div>
  }
  const existing = (children.props as { 'aria-describedby'?: string })[
    'aria-describedby'
  ]
  return cloneElement(children as ReactElement<Record<string, unknown>>, {
    'aria-describedby': existing
      ? `${existing} ${describedById}`
      : describedById,
  })
}

export const Tooltip = function ({
  children,
  disabled = false,
  text,
  ...props
}: BaseTooltipProps & { disabled?: boolean }) {
  const id = useId()
  if (disabled || text === null || text === undefined) {
    return <>{children}</>
  }

  // An always-present description: rc-tooltip's overlay only exists while visible
  // (destroyTooltipOnHide) and mounts after focus, so it can't describe the trigger (#2476).
  // Only plain text is echoed; richer overlays keep their visible content as the source.
  // The id is linked only when a description is rendered — never a dangling reference.
  const describedById =
    typeof text === 'string' || typeof text === 'number' ? id : undefined
  const description = describedById ? (
    <span className="sr-only" id={describedById}>
      {text}
    </span>
  ) : null
  const trigger = linkTrigger(children, describedById)

  return (
    <>
      <Suspense fallback={trigger}>
        <BaseTooltip text={text} {...props}>
          {trigger}
        </BaseTooltip>
      </Suspense>
      {description}
    </>
  )
}
