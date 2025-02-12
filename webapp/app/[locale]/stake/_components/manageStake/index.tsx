'use client'

import { useUmami } from 'app/analyticsEvents'
import {
  Drawer,
  DrawerParagraph,
  DrawerSection,
  DrawerTopSection,
} from 'components/drawer'
import { TokenInput } from 'components/tokenInput'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { useTokenBalance } from 'hooks/useBalance'
import { useIsConnectedToExpectedNetwork } from 'hooks/useIsConnectedToExpectedNetwork'
import { useTranslations } from 'next-intl'
import { FormEvent, useState } from 'react'
import { type StakeOperations, type StakeToken } from 'types/stake'
import { canSubmit } from 'utils/stake'
import { parseUnits } from 'viem'
import { useAccount } from 'wagmi'

import { useAmount } from '../../_hooks/useAmount'
import { type DrawerModes } from '../../_hooks/useDrawerStakeQueryString'

import { StakeFees, UnstakeFees } from './fees'
import { StakeMaxBalance, UnstakeMaxBalance } from './maxBalance'
import { StrategyDetails } from './strategyDetails'
import { SubmitButton } from './submitButton'
import { Tabs } from './tabs'

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

  const submitDisabled = !!canSubmit({
    amount: parseUnits(amount, token.decimals),
    balance,
    connectedChainId: chainId,
    token,
  }).error

  return (
    <Drawer onClose={closeDrawer}>
      <form
        className="drawer-content h-[95dvh] md:h-full"
        onSubmit={handleSubmit}
      >
        <DrawerTopSection heading={heading} onClose={closeDrawer} />
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
            {/* TODO define how to get TVL https://github.com/hemilabs/ui-monorepo/issues/794 */}
            <StrategyDetails token={token} tvl=" $ 129M" />
          </div>
        )}
        <div className="mt-auto flex flex-col gap-y-3 text-center">
          {isStaking && (
            <DrawerParagraph>{t('you-can-stake-anytime')}</DrawerParagraph>
          )}
          <SubmitButton
            // TODO disable when submitting https://github.com/hemilabs/ui-monorepo/issues/774
            disabled={submitDisabled}
            text={tCommon(operation)}
          />
        </div>
      </form>
    </Drawer>
  )
}
