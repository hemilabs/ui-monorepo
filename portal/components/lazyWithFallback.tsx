import {
  type ComponentProps,
  type ComponentType,
  lazy,
  type ReactNode,
  Suspense,
} from 'react'

// Pairs a lazy component with its own boundary, the way next/dynamic's `loading`
// option did. Declaring them together is what stops a call site from rendering a
// lazy component with no boundary, which would suspend up to whatever ancestor
// happens to have one. Call it at module scope: inside a render it would build a
// new component type every pass and remount the subtree.
//
// The `any` mirrors React's own `lazy<T extends ComponentType<any>>`. Narrower
// constraints compile but silently drop the weak-type check, letting stray
// children and spreads through.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const lazyWithFallback = function <T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  fallback?: ReactNode,
) {
  const Lazy = lazy(loader)
  const WithFallback = (props: ComponentProps<T>) => (
    <Suspense fallback={fallback}>
      <Lazy {...props} />
    </Suspense>
  )
  WithFallback.displayName = 'WithFallback'
  return WithFallback
}
