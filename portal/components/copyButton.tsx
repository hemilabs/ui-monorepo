import { ButtonIcon } from 'components/button'
import { CheckMark } from 'components/icons/checkMark'
import { ClipboardIcon } from 'components/icons/clipboard'
import { useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'

const copiedFeedbackMs = 3000

type Props = {
  text: string
}

export const CopyButton = function ({ text }: Props) {
  const [copied, setCopied] = useState(false)
  const t = useTranslations('common')

  useEffect(
    function restoreCopied() {
      if (!copied) {
        return undefined
      }
      const timeoutId = setTimeout(() => setCopied(false), copiedFeedbackMs)
      return () => clearTimeout(timeoutId)
    },
    [copied],
  )

  const copy = () =>
    Promise.resolve()
      .then(() => window.navigator.clipboard.writeText(text))
      .then(() => setCopied(true))
      .catch(() => setCopied(false))

  return (
    <ButtonIcon
      aria-label={t(copied ? 'copied' : 'copy')}
      aria-live="polite"
      onClick={copy}
      size="xxSmall"
      type="button"
      variant="tertiary"
    >
      {copied ? (
        <CheckMark className="[&>path]:fill-emerald-500" />
      ) : (
        <ClipboardIcon />
      )}
    </ButtonIcon>
  )
}
