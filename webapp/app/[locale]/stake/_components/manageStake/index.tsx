'use client'

import { useUmami } from 'app/analyticsEvents'
import {
  Drawer,
  DrawerParagraph,
  DrawerSection,
  DrawerTitle,
} from 'components/drawer'
import { TokenInput } from 'components/tokenInput'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { useTokenBalance } from 'hooks/useBalance'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useTranslations } from 'next-intl'
import { FormEvent, useState } from 'react'
import { StakeToken } from 'types/stake'
import { CloseIcon } from 'ui-common/components/closeIcon'
import { canSubmit } from 'utils/stake'
import { parseUnits } from 'viem'
import { useAccount } from 'wagmi'

import { useAmount } from '../../_hooks/useAmount'
import { type DrawerModes } from '../../_hooks/useDrawerStakeQueryString'
import { DiamondTag, HemiTag, PointsTag } from '../rewardTag'

import { StakeFees, UnstakeFees } from './fees'
import { StakeMaxBalance, UnstakeMaxBalance } from './maxBalance'
import { StrategyDetails } from './strategyDetails'
import { SubmitButton } from './submitButton'
import { Tabs } from './tabs'
import { StakeOperations } from './types'

type Props = {
  closeDrawer: () => void
  initialOperation: StakeOperations
  mode: DrawerModes
  token: StakeToken
}

export const ManageStake = function ({
  closeDrawer,
  mode,
  token,
  ...props
}: Props) {
  const isManaging = mode === 'manage' && 'initialOperation' in props

  const { chainId } = useAccount()
  const [amount, setAmount] = useAmount()
  const connectedToExpectedChain = useIsConnectedToExpectedNetwork(
    token.chainId,
  )
  const [operation, setOperation] = useState<StakeOperations>(() =>
    isManaging ? props.initialOperation : 'stake',
  )
  const { balance } = useTokenBalance(token)

  const t = useTranslations('stake-page.drawer')
  const tCommon = useTranslations('common')
  const { track } = useUmami()

  const { heading, subheading } = {
    manage: {
      heading: t('manage-your-stake'),
      subheading: t('description-manage-stake'),
    },
    stake: {
      heading: t('stake-token', { symbol: token.symbol }),
      subheading: t('stake-and-earn-rewards', { symbol: token.symbol }),
    },
  }[mode]

  const handleSubmit = function (e: FormEvent) {
    e.preventDefault()
    track?.(`stake - ${operation}`)
    // TODO implement submit https://github.com/hemilabs/ui-monorepo/issues/774
  }

  const isStaking = mode === 'stake' || operation === 'stake'

  // TODO define how to get these https://github.com/hemilabs/ui-monorepo/issues/794
  const strategyDetails = {
    rewards: [
      <DiamondTag key="diamond" />,
      <HemiTag key="hemi" />,
      <PointsTag key="points" />,
    ],
    token,
    tvl: ' $ 129M',
  }

  const submitDisabled = !!canSubmit({
    amount: parseUnits(amount, token.decimals),
    balance,
    connectedChainId: chainId,
    token,
  }).error

  return (
    <Drawer onClose={closeDrawer}>
      <form className="drawer-content h-[95dvh] md:h-full">
        <div className="flex items-center justify-between">
          <DrawerTitle>{heading}</DrawerTitle>
          <button
            className="cursor-pointer"
            onClick={closeDrawer}
            type="button"
          >
            <CloseIcon className="[&>path]:hover:stroke-black" />
          </button>
        </div>
        <div className="mb-5">
          <DrawerParagraph>{subheading}</DrawerParagraph>
        </div>
        <div className="skip-parent-padding-x">
          {isManaging && (
            <div className="relative translate-y-px">
              <Tabs onSelect={setOperation} selected={operation} />
            </div>
          )}
          <DrawerSection>
            <div className="flex flex-col gap-y-4">
              <div className="[&>*]:hover:shadow-large [&>*]:border-neutral-300/55 [&>*]:bg-white">
                <TokenInput
                  // TODO disable when submitting https://github.com/hemilabs/ui-monorepo/issues/774
                  disabled={false}
                  label={tCommon('amount')}
                  maxBalanceButton={
                    isStaking ? (
                      <StakeMaxBalance
                        disabled={
                          !connectedToExpectedChain || balance === BigInt(0)
                        }
                        onSetMaxBalance={setAmount}
                        token={token}
                      />
                    ) : (
                      <UnstakeMaxBalance
                        disabled={
                          !connectedToExpectedChain || balance === BigInt(0)
                        }
                        onSetMaxBalance={setAmount}
                        token={token}
                      />
                    )
                  }
                  onChange={setAmount}
                  token={token}
                  tokenSelector={<TokenSelectorReadOnly token={token} />}
                  value={amount}
                />
              </div>
              {isStaking ? <StakeFees /> : <UnstakeFees />}
            </div>
          </DrawerSection>
        </div>
        {isStaking && (
          <div className="mt-1">
            <StrategyDetails {...strategyDetails} />
          </div>
        )}
        <div className="mt-auto flex flex-col gap-y-3 text-center">
          {isStaking && (
            <DrawerParagraph>{t('you-can-stake-anytime')}</DrawerParagraph>
          )}
          <SubmitButton
            // TODO disable when submitting https://github.com/hemilabs/ui-monorepo/issues/774
            disabled={submitDisabled}
            onSubmit={handleSubmit}
            text={tCommon(operation)}
          />
        </div>
      </form>
    </Drawer>
  )
}
