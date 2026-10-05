import { useOnClickOutside } from '@hemilabs/react-hooks/useOnClickOutside'
import { useWindowSize } from '@hemilabs/react-hooks/useWindowSize'
import { Row } from '@tanstack/react-table'
import { useHemiToken } from 'hooks/useHemiToken'
import { useMenuKeyboard } from 'hooks/useMenuKeyboard'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { type StakingPosition } from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'
import { formatUnits } from 'viem'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useDrawerStakingQueryString } from '../../_hooks/useDrawerStakingQueryString'
import { PlusIcon } from '../../_icons/plusIcon'
import { getUnlockInfo, minDays } from '../../_utils/lockCreationTimes'

import { ActionButton } from './actionButton'

type ActionItemProps = {
  enabled?: boolean
  icon: ReactNode
  label: string
  onClick?: VoidFunction
}

const ActionItem = ({
  enabled = true,
  icon,
  label,
  onClick,
}: ActionItemProps) => (
  <button
    aria-disabled={!enabled}
    className={`flex w-full items-center gap-2 rounded px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 ${
      enabled
        ? 'cursor-pointer hover:bg-neutral-50 hover:text-neutral-950'
        : 'cursor-default [&>*]:opacity-50'
    }`}
    onClick={enabled ? onClick : undefined}
    type="button"
  >
    {icon}
    <span>{label}</span>
  </button>
)

type Props = {
  row: Row<StakingPosition>
}

export function ActionCell({ row }: Props) {
  const t = useTranslations('hemi-stake')
  const { decimals, symbol } = useHemiToken()
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(function (event) {
    if (!triggerRef.current?.contains(event.target as Node)) {
      setIsOpen(false)
    }
  }, menuRef)
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 })
  const { height: viewportHeight, width: viewportWidth } = useWindowSize()
  const { updateStakingDashboardOperation } = useStakingDashboard()
  const { setDrawerQueryString } = useDrawerStakingQueryString()

  const { amount, lockTime, timestamp, tokenId } = row.original

  const MENU_WIDTH = 275
  const MENU_HEIGHT = 60
  const MENU_OFFSET = 4

  useEffect(
    function calcMenuPosition() {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        const spaceBelow = viewportHeight - rect.bottom

        // Detect if menu should open upward
        const shouldFlip = spaceBelow < MENU_HEIGHT + MENU_OFFSET

        // Detect if button is too far left (priority column on mobile)
        const isNearLeftEdge = rect.left < MENU_WIDTH / 2

        // If near the left edge, align menu to the left of the button
        // Otherwise, align to the right as before
        let leftPosition = isNearLeftEdge
          ? rect.left + MENU_OFFSET
          : rect.right - MENU_WIDTH

        // Ensure the menu doesn't go off screen to the right
        if (leftPosition + MENU_WIDTH > viewportWidth) {
          leftPosition = viewportWidth - MENU_WIDTH - MENU_OFFSET
        }

        // Ensure the menu doesn't go off screen to the left
        if (leftPosition < MENU_OFFSET) {
          leftPosition = MENU_OFFSET
        }

        setMenuPosition({
          left: leftPosition,
          top: shouldFlip
            ? rect.top - MENU_HEIGHT - MENU_OFFSET
            : rect.bottom + MENU_OFFSET,
        })
      }
    },
    [isOpen, viewportWidth, viewportHeight],
  )

  useEffect(
    function closeMenuWhenScrolling() {
      if (isOpen) {
        const handleScroll = () => setIsOpen(false)

        window.addEventListener('scroll', handleScroll, true)

        return () => window.removeEventListener('scroll', handleScroll, true)
      }
      return undefined
    },
    [isOpen],
  )

  const { closeAndFocusTrigger, onBlur, onKeyDown } = useMenuKeyboard({
    isOpen,
    menuRef,
    setIsOpen,
    triggerRef,
  })

  const { timeRemainingSeconds } = getUnlockInfo({
    lockTime,
    timestamp,
  })

  function handleIncreaseAmount() {
    closeAndFocusTrigger()
    updateStakingDashboardOperation({
      input: '0',
      stakingPosition: {
        amount,
        tokenId,
      },
    })
    setDrawerQueryString('increasingAmount')
  }

  function handleIncreaseUnlockTime() {
    closeAndFocusTrigger()
    updateStakingDashboardOperation({
      input: formatUnits(amount, decimals),
      inputDays: minDays.toString(),
      lockupDays: minDays,
      stakingPosition: {
        amount,
        lockTime,
        timestamp,
        tokenId,
      },
    })
    setDrawerQueryString('increasingUnlockTime')
  }

  return (
    <div
      className="relative"
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      ref={buttonRef}
    >
      <ActionButton
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        ref={triggerRef}
      />
      {isOpen &&
        createPortal(
          <div
            className="fixed z-10 min-w-64 cursor-pointer rounded-lg bg-white p-1 text-sm font-medium text-neutral-700 shadow-lg"
            ref={menuRef}
            style={{ left: menuPosition.left, top: menuPosition.top }}
          >
            <ActionItem
              enabled={timeRemainingSeconds > 0}
              icon={<PlusIcon />}
              label={t('table.add-liquidity-to-lockup', { symbol })}
              onClick={handleIncreaseAmount}
            />
            <ActionItem
              enabled={timeRemainingSeconds > 0}
              icon={<PlusIcon />}
              label={t('table.add-time-to-lockup')}
              onClick={handleIncreaseUnlockTime}
            />
          </div>,
          document.body,
        )}
    </div>
  )
}
