import { Button } from 'components/button'
import { Checkbox } from 'components/checkbox'
import { Modal } from 'components/modal'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'use-intl'

import {
  highSlippageThreshold,
  veryHighSlippageThreshold,
} from '../../../../_constants/slippage'
import { getSlippageLevel } from '../../../../_utils/slippage'
import { type VaultOperation } from '../../_types/operations'

type Props = {
  onClose: VoidFunction
  onConfirm: VoidFunction
  operation: VaultOperation
  // Captured by the caller before the settings panel unmounted, so focus can go
  // back to whatever held it rather than being dropped on the body.
  returnFocusTo: HTMLElement | null
  slippage: number
}

export const HighSlippageModal = function ({
  onClose,
  onConfirm,
  operation,
  returnFocusTo,
  slippage,
}: Props) {
  const [accepted, setAccepted] = useState(false)
  const checkboxRef = useRef<HTMLInputElement>(null)

  // The panel commits on blur, so this dialog can open while focus still sits on a
  // form control behind it — where Enter would submit the very operation the dialog
  // is asking about. Pull focus in, and hand it back once the dialog is gone.
  useEffect(
    function moveFocusIntoDialog() {
      checkboxRef.current?.focus()
      return function restoreFocus() {
        returnFocusTo?.focus()
      }
    },
    [returnFocusTo],
  )
  const t = useTranslations('hemi-earn.vault.settings')
  const tCommon = useTranslations('common')

  const isVeryHigh = getSlippageLevel(slippage) === 'veryHigh'

  return (
    <Modal onClose={onClose}>
      <div className="flex w-full max-w-md flex-col rounded-2xl bg-white">
        <div className="flex flex-col gap-y-3 p-6">
          <h3 className="text-neutral-950">{t('warning-title')}</h3>
          <p className="text-sm text-neutral-500">
            {t.rich(
              operation === 'deposit'
                ? 'warning-description-deposit'
                : 'warning-description-withdrawal',
              {
                highlight: (chunks: ReactNode) => (
                  <span
                    className={isVeryHigh ? 'text-rose-500' : 'text-amber-500'}
                  >
                    {chunks}
                  </span>
                ),
                threshold: isVeryHigh
                  ? veryHighSlippageThreshold
                  : highSlippageThreshold,
              },
            )}
          </p>
        </div>
        <Checkbox
          checked={accepted}
          className="body-text-medium items-center bg-neutral-50 px-6 py-3"
          label={t('accept-risk')}
          onChange={setAccepted}
          ref={checkboxRef}
        />
        <div className="flex gap-x-3 p-6 [&>button]:flex-1">
          <Button
            onClick={onClose}
            size="small"
            type="button"
            variant="secondary"
          >
            {tCommon('cancel')}
          </Button>
          <Button
            disabled={!accepted}
            onClick={onConfirm}
            size="small"
            type="button"
          >
            {t('continue-anyway')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
