'use client'

import { ExternalLink } from 'components/externalLink'
import { CheckMark } from 'components/icons/checkMark'
import { CloseIcon } from 'components/icons/closeIcon'
import { ErrorCircleIcon } from 'components/icons/errorCircleIcon'
import { Link } from 'components/link'
import { type ComponentProps, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'

type ToastVariant = 'error' | 'success'

type Props = {
  autoCloseMs?: number
  description?: string
  goTo?: {
    href: ComponentProps<typeof Link>['href']
    label: string
  }
  title: string
  tx?: {
    href: ComponentProps<typeof ExternalLink>['href']
    label: string
  }
  variant?: ToastVariant
}

const ToastIcon = function ({ variant }: { variant: ToastVariant }) {
  if (variant === 'error') {
    return (
      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-950">
        <ErrorCircleIcon />
      </div>
    )
  }
  return (
    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-950">
      <CheckMark className="size-4 [&>path]:stroke-emerald-500" />
    </div>
  )
}

export const Toast = function ({
  autoCloseMs = 10000,
  description,
  goTo,
  title,
  tx,
  variant,
}: Props) {
  const [closedToast, setClosedToast] = useState(false)

  useEffect(
    function autoCloseToast() {
      if (autoCloseMs) {
        const timer = setTimeout(function closeToastAfterDelay() {
          setClosedToast(true)
        }, autoCloseMs)

        return () => clearTimeout(timer)
      }
      return undefined
    },
    [autoCloseMs],
  )

  if (closedToast || typeof document === 'undefined') {
    return null
  }

  // Portal to `document.body` so the toast sits in the same stacking context
  // as the drawer (also body-portaled). Without this, an intermediate
  // ancestor in the app layout would create a subordinate stacking context
  // and trap the toast behind any open drawer regardless of z-index.
  return ReactDOM.createPortal(
    <div
      className="fixed inset-x-4 bottom-20 z-40 flex justify-between
      gap-x-3 rounded-xl border border-solid border-black/85 bg-neutral-800 p-3.5
    text-sm font-medium text-white md:bottom-auto md:left-auto md:right-8 md:top-20"
    >
      <div className="mt-0.5">
        {variant !== undefined ? (
          <ToastIcon variant={variant} />
        ) : (
          <CheckMark className="[&>path]:stroke-emerald-500" />
        )}
      </div>
      <div className="flex flex-[1_0_0] flex-col items-start gap-y-1.5">
        <h5 className="text-base">{title}</h5>
        {(description !== undefined || tx !== undefined) && (
          <p className="text-neutral-400 md:max-w-96">
            {description}
            {tx !== undefined && (
              <ExternalLink href={tx.href}>
                <span className="hoverable-text ml-1">{tx.label}</span>
              </ExternalLink>
            )}
          </p>
        )}
        {goTo !== undefined && (
          <Link
            className="mt-1.5 cursor-pointer underline hover:text-neutral-200 hover:opacity-80"
            href={goTo.href}
          >
            {goTo.label}
          </Link>
        )}
      </div>
      <button className="size-5" onClick={() => setClosedToast(true)}>
        <CloseIcon className="size-full [&>path]:hover:stroke-white" />
      </button>
    </div>,
    document.body,
  )
}
