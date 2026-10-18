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

const isPlainElement = (
  children: ReactNode,
): children is ReactElement<Record<string, unknown>> =>
  isValidElement(children) && typeof children.type === 'string'

// rc-tooltip replaces the aria-describedby of the element it receives as a child
// (getChildren in rc-tooltip@6), so the wrapper belongs to the tooltip and the
// description is linked to the plain element inside it. Children that hide their
// focusable element behind a component are wrapped as before, without a description.
const linkTrigger = function (
  children: ReactNode,
  describedById: string | undefined,
) {
  if (describedById === undefined || !isPlainElement(children)) {
    return {
      describesTrigger: false,
      trigger: <div className="cursor-pointer">{children}</div>,
    }
  }
  const existing = children.props['aria-describedby'] as string | undefined
  return {
    describesTrigger: true,
    trigger: (
      <div className="cursor-pointer">
        {cloneElement(children, {
          'aria-describedby': existing
            ? `${existing} ${describedById}`
            : describedById,
        })}
      </div>
    ),
  }
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

  // rc-tooltip's overlay only exists while visible (destroyTooltipOnHide) and mounts
  // after focus, so the description is always present too. Only plain text is echoed;
  // richer overlays keep their visible content as the source. It is hidden so it can't
  // join the accessible name of a button wrapping the trigger, and it is rendered only
  // next to a trigger that references it.
  const describedById =
    typeof text === 'string' || typeof text === 'number' ? id : undefined
  const { describesTrigger, trigger } = linkTrigger(children, describedById)

  return (
    <>
      <Suspense fallback={trigger}>
        <BaseTooltip text={text} {...props}>
          {trigger}
        </BaseTooltip>
      </Suspense>
      {describesTrigger && (
        <span aria-hidden="true" className="sr-only" id={describedById}>
          {text}
        </span>
      )}
    </>
  )
}
