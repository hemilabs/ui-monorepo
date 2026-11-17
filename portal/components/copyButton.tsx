import { ButtonIcon } from 'components/button'
import { CheckMark } from 'components/icons/checkMark'
import { ClipboardIcon } from 'components/icons/clipboard'
import { useCopyToClipboard } from 'hooks/useCopyToClipboard'
import { useTranslations } from 'use-intl'

type Props = {
  onCopy?: VoidFunction
  text: string
}

export const CopyButton = function ({ onCopy, text }: Props) {
  const { copied, copy } = useCopyToClipboard()
  const t = useTranslations('common')

  const onClick = () =>
    copy(text).then(function (success) {
      if (success) {
        onCopy?.()
      }
    })

  return (
    <ButtonIcon
      aria-label={t(copied ? 'copied' : 'copy')}
      aria-live="polite"
      onClick={onClick}
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
