import { lazy, Suspense } from 'react'

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
  if (disabled || text === null || text === undefined) {
    return <>{children}</>
  }

  const content = <div className="cursor-pointer">{children}</div>

  return (
    <Suspense fallback={content}>
      <BaseTooltip text={text} {...props}>
        {content}
      </BaseTooltip>
    </Suspense>
  )
}
