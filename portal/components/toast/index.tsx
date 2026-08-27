'use client'

import { ButtonLink } from 'components/button'
import { ExternalLink } from 'components/externalLink'
import { CheckCircleIcon } from 'components/icons/checkCircleIcon'
import { CloseIcon } from 'components/icons/closeIcon'
import { InfoIcon } from 'components/icons/infoIcon'
import { type ComponentProps, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'

type ToastVariant = 'error' | 'success'

type Props = {
  autoCloseMs?: number
  description?: string
  goTo?: {
    href: ComponentProps<typeof ButtonLink>['href']
    label: string
  }
  title: string
  tx?: {
    href: ComponentProps<typeof ExternalLink>['href']
    label: string
  }
  variant?: ToastVariant
}

const ToastIcon = ({ variant }: { variant: ToastVariant }) =>
  variant === 'error' ? (
    <InfoIcon className="size-4 shrink-0 [&>g>path]:fill-rose-500" />
  ) : (
    <CheckCircleIcon className="size-4 shrink-0 text-orange-600" />
  )

export const Toast = function ({
  autoCloseMs = 10000,
  description,
  goTo,
  title,
  tx,
  variant = 'success',
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
    <div className="group fixed inset-x-4 bottom-20 z-40 flex flex-col gap-y-3 overflow-hidden rounded-lg bg-neutral-950 p-3 text-white shadow-sm md:bottom-auto md:left-auto md:right-8 md:top-20 md:w-96">
      <div className="flex flex-col gap-y-0.5">
        <div className="flex h-4.5 items-center gap-x-2">
          <ToastIcon variant={variant} />
          <p className="text-sm font-medium text-white">{title}</p>
          <button
            aria-label="Close notification"
            className="ml-auto size-4 shrink-0 transition-opacity duration-200 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
            onClick={() => setClosedToast(true)}
          >
            <CloseIcon className="size-full [&>path]:fill-neutral-400 [&>path]:hover:fill-white" />
          </button>
        </div>
        {(description !== undefined || tx !== undefined) && (
          <p className="pl-6 text-sm text-neutral-400">
            {description}
            {tx !== undefined && (
              <ExternalLink href={tx.href}>
                <span className="hoverable-text ml-1">{tx.label}</span>
              </ExternalLink>
            )}
          </p>
        )}
      </div>
      {goTo !== undefined && (
        <div className="flex pl-6">
          <ButtonLink href={goTo.href} size="xxSmall" variant="secondary">
            {goTo.label}
          </ButtonLink>
        </div>
      )}
    </div>,
    document.body,
  )
}
