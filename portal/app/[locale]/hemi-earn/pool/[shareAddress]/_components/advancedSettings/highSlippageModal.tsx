'use client'

import { Button } from 'components/button'
import { Checkbox } from 'components/checkbox'
import { Modal } from 'components/modal'
import { useTranslations } from 'next-intl'
import { type ReactNode, useState } from 'react'

import {
  highSlippageThreshold,
  veryHighSlippageThreshold,
} from '../../../../_constants/slippage'
import { getSlippageLevel } from '../../../../_utils/slippage'

type Props = {
  onClose: VoidFunction
  onConfirm: VoidFunction
  slippage: number
}

export const HighSlippageModal = function ({
  onClose,
  onConfirm,
  slippage,
}: Props) {
  const [accepted, setAccepted] = useState(false)
  const t = useTranslations('hemi-earn.pool.settings')
  const tCommon = useTranslations('common')

  const isVeryHigh = getSlippageLevel(slippage) === 'veryHigh'

  return (
    <Modal onClose={onClose}>
      <div className="flex w-full max-w-md flex-col rounded-2xl bg-white">
        <div className="flex flex-col gap-y-3 p-6">
          <h3 className="text-neutral-950">{t('warning-title')}</h3>
          <p className="text-sm text-neutral-500">
            {t.rich('warning-description', {
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
            })}
          </p>
        </div>
        <label
          className="flex cursor-pointer items-center gap-x-2 bg-neutral-50 px-6 py-3"
          htmlFor="accept-slippage-risk"
        >
          <Checkbox
            checked={accepted}
            id="accept-slippage-risk"
            onChange={setAccepted}
          />
          <span className="text-sm font-medium text-neutral-950">
            {t('accept-risk')}
          </span>
        </label>
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
