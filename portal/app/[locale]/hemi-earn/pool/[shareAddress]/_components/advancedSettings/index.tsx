'use client'

import { useOnClickOutside } from '@hemilabs/react-hooks/useOnClickOutside'
import { type FocusEvent, useEffect, useState } from 'react'

import { extraApprovalMultiplier } from '../../../../_utils/approval'
import {
  clampSlippage,
  getSlippageLevel,
  sanitizeSlippage,
} from '../../../../_utils/slippage'
import { usePoolForm } from '../../_context/poolFormContext'
import { getDefaultSlippage } from '../../_hooks/useSlippageBps'
import { type PoolOperation } from '../../_types/operations'

import { HighSlippageModal } from './highSlippageModal'
import { SettingsPanel } from './panel'
import { SettingsTrigger } from './trigger'

type Props = {
  disabled?: boolean
  operation: PoolOperation
}

export const AdvancedSettings = function ({
  disabled = false,
  operation,
}: Props) {
  const {
    approveExtraAmount,
    slippage,
    updateApproveExtraAmount,
    updateSlippage,
  } = usePoolForm()

  const defaultSlippage = getDefaultSlippage(operation)

  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(
    slippage === undefined ? '' : String(slippage),
  )
  // Holds a high value awaiting the risk confirmation; never Auto, which is always safe.
  const [pendingSlippage, setPendingSlippage] = useState<number>()

  // An empty field reads as Auto, so the button stays lit and the committed
  // value matches what the panel shows.
  const draftSlippage = draft === '' ? undefined : clampSlippage(Number(draft))
  const draftLevel = getSlippageLevel(draftSlippage ?? defaultSlippage)

  const closeAndCommit = function () {
    setIsOpen(false)
    if (draftSlippage === slippage) {
      return
    }
    if (draftSlippage !== undefined && draftLevel !== 'normal') {
      setPendingSlippage(draftSlippage)
      return
    }
    updateSlippage(draftSlippage)
  }

  const openPanel = function () {
    // Re-seed from the committed value so an abandoned edit is discarded.
    setDraft(slippage === undefined ? '' : String(slippage))
    setIsOpen(true)
  }

  const handleDraftChange = function (value: string) {
    const next = sanitizeSlippage(value)
    if (next === null) {
      return
    }
    setDraft(next)
  }

  const ref = useOnClickOutside<HTMLDivElement>(function () {
    if (isOpen) {
      closeAndCommit()
    }
  })

  // Drop a pending edit once an operation starts: the form resets its settings on
  // success, so committing a stale draft afterwards would resurrect a cleared value.
  useEffect(
    function closeWhileOperating() {
      if (disabled) {
        setIsOpen(false)
      }
    },
    [disabled],
  )

  // Only covers keyboard exits — pointer ones are useOnClickOutside's job. Requiring
  // a relatedTarget is what keeps them apart: tabbing away always names the element
  // taking focus, while clicking a non-focusable spot *inside* the panel sends focus
  // to the body and reports none, which must not read as leaving.
  const handleBlur = function (event: FocusEvent<HTMLDivElement>) {
    if (
      isOpen &&
      event.relatedTarget &&
      !event.currentTarget.contains(event.relatedTarget)
    ) {
      closeAndCommit()
    }
  }

  return (
    <div
      className={`relative ${isOpen ? 'z-30' : ''}`}
      onBlur={handleBlur}
      ref={ref}
    >
      {/* Swallows the dismissing click so it can't also activate what it landed
          on — the submit button sits right below and would sign in the same gesture. */}
      {isOpen && (
        <div
          aria-hidden
          className="fixed inset-0 z-0"
          onMouseDown={closeAndCommit}
        />
      )}
      <div className="relative z-10">
        <SettingsTrigger
          disabled={disabled}
          level={getSlippageLevel(slippage ?? defaultSlippage)}
          onClick={isOpen ? closeAndCommit : openPanel}
          slippage={slippage}
        />
      </div>
      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-1">
          <SettingsPanel
            approveExtraAmount={approveExtraAmount}
            defaultSlippage={defaultSlippage}
            disabled={disabled}
            draft={draft}
            level={draftLevel}
            multiplier={extraApprovalMultiplier}
            onApproveExtraAmountChange={updateApproveExtraAmount}
            onAutoClick={() => setDraft('')}
            onDraftChange={handleDraftChange}
            onEnter={closeAndCommit}
            operation={operation}
          />
        </div>
      )}
      {pendingSlippage !== undefined && (
        <HighSlippageModal
          onClose={() => setPendingSlippage(undefined)}
          onConfirm={function () {
            updateSlippage(pendingSlippage)
            setPendingSlippage(undefined)
          }}
          slippage={pendingSlippage}
        />
      )}
    </div>
  )
}
