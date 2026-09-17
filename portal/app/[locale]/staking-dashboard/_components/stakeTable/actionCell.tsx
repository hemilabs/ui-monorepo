import { useOnClickOutside } from '@hemilabs/react-hooks/useOnClickOutside'
import { useWindowSize } from '@hemilabs/react-hooks/useWindowSize'
import { Row } from '@tanstack/react-table'
import { Tooltip } from 'components/tooltip'
import { useHemiToken } from 'hooks/useHemiToken'
import { ReactNode, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  type CollectAllRewardsOperationRunning,
  type StakingPosition,
} from 'types/stakingDashboard'
import { useTranslations } from 'use-intl'
import { getRewardsGeneration } from 'utils/veHemiEpochRewards'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import { useStakingDashboard } from '../../_context/stakingDashboardContext'
import { useClaimEligibility } from '../../_hooks/useClaimEligibility'
import { useIsClaimingEpochRewards } from '../../_hooks/useClaimRewardsWalkthrough'
import { useCollectRewards } from '../../_hooks/useCollectAllRewards'
import { useDrawerStakingQueryString } from '../../_hooks/useDrawerStakingQueryString'
import { useEpochClaimWithDrawer } from '../../_hooks/useEpochClaimWithDrawer'
import { PlusIcon } from '../../_icons/plusIcon'
import { StarsIcon } from '../../_icons/starsIcon'
import { getUnlockInfo, minDays } from '../../_utils/lockCreationTimes'
import { isPositionOwner } from '../../_utils/positionOwnership'

import { ActionButton } from './actionButton'

type ActionItemProps = {
  enabled?: boolean
  icon: ReactNode
  label: string
  onClick?: VoidFunction
  // Why this item is unavailable. A greyed-out control with no explanation reads as a
  // broken one, and most of these states are actionable.
  reason?: string
}

const ActionItem = function ({
  enabled = true,
  icon,
  label,
  onClick,
  reason,
}: ActionItemProps) {
  const describedBy = useId()
  const item = (
    <button
      // A real button, not a div with an onClick: these were unreachable by keyboard,
      // and this menu is the only way to claim rewards.
      aria-describedby={reason && !enabled ? describedBy : undefined}
      aria-disabled={!enabled}
      className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left transition-colors ${
        enabled
          ? 'cursor-pointer hover:bg-neutral-50 hover:text-neutral-950'
          : 'cursor-default opacity-50'
      }`}
      // `aria-disabled`, not `disabled` - a disabled button takes no focus, and the
      // reason is what a keyboard user needs to reach.
      onClick={enabled ? onClick : undefined}
      role="menuitem"
      type="button"
    >
      {icon}
      <span>{label}</span>
      {reason && !enabled && (
        <span className="sr-only" id={describedBy}>
          {reason}
        </span>
      )}
    </button>
  )

  return reason && !enabled ? (
    <Tooltip text={reason} variant="simple">
      {item}
    </Tooltip>
  ) : (
    item
  )
}

type Props = {
  row: Row<StakingPosition>
  openRowId: string | null
  setOpenRowId: (id: string | null) => void
}

export function ActionCell({ openRowId, row, setOpenRowId }: Props) {
  const t = useTranslations('staking-dashboard')
  const { chainId, decimals, symbol } = useHemiToken()
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

  const { address } = useAccount()
  const { amount, id, lockTime, owner, timestamp, tokenId } = row.original
  // Rows for positions the wallet no longer holds are fine; acting on them is not.
  // veHEMI reverts for anyone but the current owner.
  const isOwner = isPositionOwner({ address, owner })
  const isContinuousGeneration = getRewardsGeneration(chainId) === 'continuous'
  const { disabled: cannotClaim, reason: cannotClaimReason } =
    useClaimEligibility({ owner, tokenId })

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

  // From the mutation cache, not a local flag: the sequence is several transactions and
  // can stop at any of them, and a latch nobody cleared would leave the only Claim
  // control dead for the session. Any claim counts, claim-all included - the wallet can
  // only be asked one thing at a time.
  const isClaimingEpochRewards = useIsClaimingEpochRewards()
  const { mutate: runClaimEpochRewards } = useEpochClaimWithDrawer({
    amount,
    owner,
    tokenId,
  })
  const { mutate: runCollectRewards } = useCollectRewards({
    amount,
    on(emitter) {
      emitter.on('user-signed-collect-all-rewards', function () {
        setOpenRowId(null)
      })
      emitter.on('collect-all-rewards-settled', function () {
        setOperationRunning('idle')
      })
    },
    owner,
    tokenId,
    updateCollectRewardsDashboardOperation,
  })

  const { timeRemainingSeconds } = getUnlockInfo({
    lockTime,
    timestamp,
  })

  const isOpen = openRowId === id

  // Focus follows the menu, which is portaled elsewhere in the document.
  useEffect(
    function moveFocusIntoMenu() {
      if (!isOpen) {
        return
      }
      const first =
        menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      first?.focus()
    },
    [isOpen, menuRef],
  )

  const closeMenu = function () {
    setOpenRowId(null)
    // Handed back to the trigger, rather than dropping focus at the top of the page.
    buttonRef.current?.querySelector('button')?.focus()
  }

  const handleMenuKeyDown = function (event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      closeMenu()
    }
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
        owner,
        tokenId,
      },
    })
    // Two different contracts with different claim shapes - the original settles in one
    // transaction, the epoch one walks the range in chunks.
    if (isContinuousGeneration) {
      setOperationRunning('collecting')
      // `onError` as well as the emitter: the mutation can reject before the action
      // even exists (a declined chain switch, no account), leaving the control latched.
      runCollectRewards(undefined, {
        onError: () => setOperationRunning('idle'),
      })
      return
    }
    // The epoch branch tracks its in-flight state through the mutation, so it must not
    // set the legacy latch too - nothing here would clear it.
    setOpenRowId(null)
    runClaimEpochRewards()
  }

  return (
    <div className="relative" ref={buttonRef}>
      <ActionButton
        isOpen={isOpen}
        label={t('table.actions-for-position', { tokenId: tokenId.toString() })}
        setIsOpen={open => (open ? setOpenRowId(id) : closeMenu())}
      />
      {openRowId === id &&
        createPortal(
          <div
            aria-label={t('table.action')}
            className="fixed z-10 min-w-64 cursor-pointer rounded-lg bg-white p-1 text-sm font-medium text-neutral-700 shadow-lg"
            // Portaled to the body, so Tab from the trigger walks past the menu rather
            // than into it. Focus moves here on open, returns to the trigger on close,
            // and Escape closes - otherwise there is no way out without a pointer.
            onKeyDown={handleMenuKeyDown}
            ref={menuRef}
            role="menu"
            style={{ left: menuPosition.left, top: menuPosition.top }}
            tabIndex={-1}
          >
            <ActionItem
              enabled={isOwner && timeRemainingSeconds > 0}
              icon={<PlusIcon />}
              label={t('table.add-liquidity-to-lockup', { symbol })}
              onClick={handleIncreaseAmount}
            />
            <ActionItem
              enabled={isOwner && timeRemainingSeconds > 0}
              icon={<PlusIcon />}
              label={t('table.add-time-to-lockup')}
              onClick={handleIncreaseUnlockTime}
            />
            <ActionItem
              enabled={
                !cannotClaim &&
                !isClaimingEpochRewards &&
                operationRunning !== 'collecting'
              }
              icon={<StarsIcon />}
              label={t('claim-rewards.heading')}
              onClick={handleClaimRewards}
              reason={
                cannotClaimReason
                  ? t(`claim-rewards.ineligible.${cannotClaimReason}`)
                  : undefined
              }
            />
          </div>,
          document.body,
        )}
    </div>
  )
}
