import {
  lazy,
  Suspense,
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
} from 'react'

import { type BaseTooltipProps } from './base'

const BaseTooltip = lazy(() =>
  import('./base').then(mod => ({ default: mod.BaseTooltip })),
)

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
  const description =
    typeof text === 'string' || typeof text === 'number' ? (
      <span className="sr-only" id={id}>
        {text}
      </span>
    ) : null

  // Link the description to the trigger itself rather than the positioning wrapper:
  // clone DOM-element children with aria-describedby, and keep the wrapper only for
  // children that need it (components like Button don't forward refs).
  const trigger =
    isValidElement(children) && typeof children.type === 'string' ? (
      cloneElement(children as ReactElement<Record<string, unknown>>, {
        'aria-describedby': id,
      })
    ) : (
      <div className="cursor-pointer">{children}</div>
    )

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
