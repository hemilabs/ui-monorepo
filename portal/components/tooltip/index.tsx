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
