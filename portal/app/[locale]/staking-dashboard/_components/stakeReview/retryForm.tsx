import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { type FormEvent } from 'react'
import { useTranslations } from 'use-intl'

type Props = {
  disabled?: boolean
  isCollecting: boolean
  onRetry: (e: FormEvent) => void
  // Why retrying is pointless right now. Without it the button resubmits and fails on
  // the same guard, which reads as a button that does nothing.
  reason?: string
}

// Shared by both generations' reviews, which retry different contracts.
export const RetryForm = function ({
  disabled = false,
  isCollecting,
  onRetry,
  reason,
}: Props) {
  const t = useTranslations()
  return (
    <div className="flex w-full flex-col gap-y-2">
      {/* In the open, not in a tooltip: a disabled control doesn't reliably hover, and
          this is a dead end they have to read to get out of. */}
      {disabled && reason !== undefined && (
        <p className="text-sm font-medium text-neutral-500">{reason}</p>
      )}
      <form className="flex w-full [&>button]:w-full" onSubmit={onRetry}>
        <SubmitWhenConnected
          submitButton={
            <Button disabled={isCollecting || disabled} size="small">
              {t(
                isCollecting
                  ? 'staking-dashboard.claim-rewards.heading'
                  : 'common.try-again',
              )}
            </Button>
          }
          submitButtonSize="small"
        />
      </form>
    </div>
  )
}
