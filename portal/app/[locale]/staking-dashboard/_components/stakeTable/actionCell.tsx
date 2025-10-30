import { Row } from '@tanstack/react-table'
import { useHemiToken } from 'hooks/useHemiToken'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useWindowSize } from 'hooks/useWindowSize'
import { useTranslations } from 'next-intl'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  type CollectAllRewardsOperationRunning,
  type StakingPosition,
} from 'types/stakingDashboard'
import { formatUnits } from 'viem'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useCollectRewards } from '../../_hooks/useCollectAllRewards'
import { useDrawerStakingQueryString } from '../../_hooks/useDrawerStakingQueryString'
import { useHasRewards } from '../../_hooks/useHasRewards'
import { PlusIcon } from '../../_icons/plusIcon'
import { StarsIcon } from '../../_icons/starsIcon'
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
  <div
    className={`flex items-center gap-2 rounded px-3 py-2 transition-colors ${
      enabled
        ? 'cursor-pointer hover:bg-neutral-50 hover:text-neutral-950'
        : 'cursor-default opacity-50'
    }`}
    onClick={enabled ? onClick : undefined}
  >
    {icon}
    <span>{label}</span>
  </div>
)

type Props = {
  row: Row<StakingPosition>
  openRowId: string | null
  setOpenRowId: (id: string | null) => void
}

export function ActionCell({ openRowId, row, setOpenRowId }: Props) {
  const t = useTranslations('staking-dashboard')
  const { decimals, symbol } = useHemiToken()
  const buttonRef = useRef<HTMLDivElement>(null)
  const menuRef = useOnClickOutside<HTMLDivElement>(() => setOpenRowId(null))
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 })
  const { height: viewportHeight, width: viewportWidth } = useWindowSize()
  const {
    updateCollectRewardsDashboardOperation,
    updateStakingDashboardOperation,
  } = useStakingDashboard()
  const { setDrawerQueryString } = useDrawerStakingQueryString()
  const [operationRunning, setOperationRunning] =
    useState<CollectAllRewardsOperationRunning>('idle')

  const { amount, id, lockTime, timestamp, tokenId } = row.original
  const { hasRewards } = useHasRewards(tokenId)

  const MENU_WIDTH = 275
  const MENU_HEIGHT = 88
  const MENU_OFFSET = 4

  useEffect(
    function calcMenuPosition() {
      if (openRowId === id && buttonRef.current) {
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
    [openRowId, id, viewportWidth, viewportHeight],
  )

  useEffect(
    function closeMenuWhenScrolling() {
      if (openRowId === id) {
        const handleScroll = () => setOpenRowId(null)

        window.addEventListener('scroll', handleScroll, true)

        return () => window.removeEventListener('scroll', handleScroll, true)
      }
      return undefined
    },
    [openRowId, id, setOpenRowId],
  )

  const { mutate: runCollectRewards } = useCollectRewards({
    on(emitter) {
      emitter.on('user-signed-collect-all-rewards', function () {
        setOpenRowId(null)
      })
      emitter.on('collect-all-rewards-settled', function () {
        setOperationRunning('idle')
      })
    },
    tokenId,
    updateCollectRewardsDashboardOperation,
  })

  const { timeRemainingSeconds } = getUnlockInfo({
    lockTime,
    timestamp,
  })

  if (timeRemainingSeconds <= 0) {
    return null
  }

  function handleIncreaseAmount() {
    updateStakingDashboardOperation({
      input: '0',
      stakingPosition: {
        amount,
        tokenId,
      },
    })
    setDrawerQueryString('increasingAmount')
    setOpenRowId(null)
  }

  function handleIncreaseUnlockTime() {
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
    setOpenRowId(null)
  }

  function handleClaimRewards() {
    updateCollectRewardsDashboardOperation({
      stakingPosition: {
        amount,
        tokenId,
      },
    })
    runCollectRewards()
    setOperationRunning('collecting')
  }

  return (
    <div className="relative" ref={buttonRef}>
      <ActionButton
        isOpen={openRowId === id}
        setIsOpen={isOpen => setOpenRowId(isOpen ? id : null)}
      />
      {openRowId === id &&
        createPortal(
          <div
            className="fixed z-10 min-w-64 cursor-pointer rounded-lg bg-white p-1 text-sm font-medium text-neutral-700 shadow-lg"
            ref={menuRef}
            style={{ left: menuPosition.left, top: menuPosition.top }}
          >
            <ActionItem
              icon={<PlusIcon />}
              label={t('table.add-liquidity-to-lockup', { symbol })}
              onClick={handleIncreaseAmount}
            />
            <ActionItem
              icon={<PlusIcon />}
              label={t('table.add-time-to-lockup')}
              onClick={handleIncreaseUnlockTime}
            />
            <ActionItem
              enabled={operationRunning !== 'collecting' && hasRewards}
              icon={<StarsIcon />}
              label={t('claim-rewards.heading')}
              onClick={handleClaimRewards}
            />
          </div>,
          document.body,
        )}
    </div>
  )
}
