import { lazy, Suspense } from 'react'

import { type BaseTooltipProps } from './base'

// Can't use dynamic here, because the fallback depends on the consumer.
// next/dynamic offers a static fallback, defined at import time.
const BaseTooltip = lazy(() =>
  import('./base').then(mod => ({ default: mod.BaseTooltip })),
)

export const Tooltip = function ({
  children,
  disabled = false,
  ...props
}: BaseTooltipProps & { disabled?: boolean }) {
  if (disabled) {
    return <>{children}</>
  }

  const content = <div className="cursor-pointer">{children}</div>

  return (
    <Suspense fallback={content}>
      <BaseTooltip {...props}>{content}</BaseTooltip>
    </Suspense>
  )
}
