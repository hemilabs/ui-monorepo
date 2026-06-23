'use client'

import { ExternalLink } from 'components/externalLink'
import { CheckMark } from 'components/icons/checkMark'
import { CloseIcon } from 'components/icons/closeIcon'
import { ErrorCircleIcon } from 'components/icons/errorCircleIcon'
import { GreenCheckIcon } from 'components/icons/greenCheckIcon'
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
  return <GreenCheckIcon />
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
    <div className="fixed inset-x-4 bottom-20 z-40 flex items-center gap-3 rounded-xl border border-black/88 bg-neutral-800 p-3.5 pb-4 text-white shadow-soft md:bottom-auto md:left-auto md:right-8 md:top-20">
      <div className="shrink-0">
        {variant !== undefined ? (
          <ToastIcon variant={variant} />
        ) : (
          <CheckMark className="[&>path]:fill-emerald-500" />
        )}
      </div>
      <div className="flex flex-[1_0_0] flex-col items-start">
        <p className="text-base font-medium leading-4 tracking-[-0.32px] text-white">
          {title}
        </p>
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
      <button
        aria-label="Close notification"
        className="size-5 shrink-0"
        onClick={() => setClosedToast(true)}
      >
        <CloseIcon className="size-full [&>path]:hover:fill-white" />
      </button>
    </div>,
    document.body,
  )
}
