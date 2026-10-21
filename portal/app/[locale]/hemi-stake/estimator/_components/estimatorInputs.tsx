import { Card } from 'components/card'
import { LazyConnectEvmWallet } from 'components/lazyConnectEvmWallet'
import {
  SegmentedControl,
  type SegmentedControlOption,
} from 'components/segmentedControl'
import { useTokenBalance } from 'hooks/useBalance'
import { useHemiToken } from 'hooks/useHemiToken'
import { useTranslations } from 'use-intl'
import { parseTokenUnits } from 'utils/token'

import { EstimatorAmountField } from '../../_components/estimator/estimatorAmountField'
import { LockupPicker } from '../../_components/lockup/lockupPicker'
import { useEstimator, type EstimatorScope } from '../_context/estimatorContext'
import { useNeedsWallet } from '../_hooks/useNeedsWallet'

export const EstimatorInputs = function () {
  const t = useTranslations('hemi-stake.estimator')
  const tCommon = useTranslations('common')
  const token = useHemiToken()
  const needsWallet = useNeedsWallet()
  const { data: balance } = useTokenBalance(token.chainId, token.address)
  const {
    amount,
    inputDays,
    lockupDays,
    scope,
    updateAmount,
    updateInputDays,
    updateLockupDays,
    updateScope,
  } = useEstimator()

  const scopeOptions: SegmentedControlOption<EstimatorScope>[] = [
    { label: t('new-position'), value: 'new-position' },
    { label: t('with-my-positions'), value: 'with-my-positions' },
  ]

  return (
    <Card>
      <div className="flex flex-col gap-y-3 p-4">
        <SegmentedControl
          label={t('scope')}
          onChange={updateScope}
          options={scopeOptions}
          value={scope}
        />
        <div className="grid">
          <div
            className={`col-start-1 row-start-1 flex flex-col gap-y-3 ${
              needsWallet ? 'invisible' : ''
            }`}
          >
            <EstimatorAmountField
              balance={balance}
              onChange={updateAmount}
              token={token}
              value={amount}
            />
            <div className="flex flex-col gap-y-3 rounded-lg bg-neutral-50 px-4 py-3">
              <LockupPicker
                amount={parseTokenUnits(amount, token)}
                inputDays={inputDays}
                lockupDays={lockupDays}
                updateInputDays={updateInputDays}
                updateLockupDays={updateLockupDays}
              />
            </div>
          </div>
          {needsWallet && (
            <div className="col-start-1 row-start-1 flex flex-col items-center justify-center gap-y-4 text-center">
              <span className="body-text-medium max-w-64 text-neutral-500">
                {t('connect-to-blend')}
              </span>
              <LazyConnectEvmWallet
                buttonSize="small"
                text={tCommon('connect-wallet')}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
