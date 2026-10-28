import { ButtonLink } from 'components/button'
import { ExternalLink } from 'components/externalLink'
import { TokenLogo } from 'components/tokenLogo'
import { useChain } from 'hooks/useChain'
import { useLocale, useTranslations } from 'use-intl'
import {
  formatApyDisplay,
  formatCompactFiat,
  formatEvmAddress,
} from 'utils/format'

import { type EarnVault } from '../../types'
import { RenderEarnFiatBalance } from '../earnFiatBalance'
import { RiskWarningTooltip } from '../riskWarningTooltip'

import { DepositedAmount } from './depositedAmount'
import { TokenIconStack } from './tokenIconStack'
import { VaultInfoItem } from './vaultInfoItem'

type Props = {
  vault: EarnVault
}

export const VaultInfoBar = function ({ vault }: Props) {
  const t = useTranslations('hemi-earn.vault-info')
  const locale = useLocale()
  const chain = useChain(vault.shareToken.chainId)

  const formattedAddress = formatEvmAddress(vault.shareAddress)
  const explorerUrl = chain?.blockExplorers?.default.url

  return (
    <div className="flex w-full flex-col gap-4 rounded-xl bg-white p-4 shadow-sm md:min-h-19.5 md:flex-row md:items-center md:gap-6">
      <div className="flex h-10 w-full shrink-0 items-center justify-center rounded-lg bg-neutral-100 md:w-19">
        <TokenIconStack tokens={vault.exposureTokens} />
      </div>
      <div className="grid grid-cols-2 gap-4 md:flex md:flex-1 md:items-center md:gap-6">
        <div className="md:w-32">
          <VaultInfoItem label={t('vault-contract')}>
            <span className="body-text-medium text-neutral-950">
              {explorerUrl ? (
                <ExternalLink
                  className="hover:text-orange-500"
                  href={`${explorerUrl}/address/${vault.shareAddress}`}
                >
                  {formattedAddress}
                </ExternalLink>
              ) : (
                formattedAddress
              )}
            </span>
          </VaultInfoItem>
        </div>
        <div className="md:w-24">
          <VaultInfoItem label={t('share-token')}>
            <div className="flex items-center gap-x-1.5">
              <div className="flex items-center justify-center rounded-full border border-gray-200">
                <TokenLogo size="small" token={vault.shareToken} version="L1" />
              </div>
              <span className="body-text-medium text-neutral-950">
                {vault.shareToken.symbol}
              </span>
            </div>
          </VaultInfoItem>
        </div>
        <div className="md:w-24">
          <VaultInfoItem label={t('total-deposits')}>
            <span className="body-text-medium text-neutral-950">
              <RenderEarnFiatBalance
                balance={vault.totalDeposits}
                customFormatter={usd => formatCompactFiat(Number(usd), locale)}
                queryStatus={vault.totalDepositsStatus}
                token={vault.peggedToken}
              />
            </span>
          </VaultInfoItem>
        </div>
        <VaultInfoItem
          isLoading={vault.apy === undefined}
          label={
            <>
              {t('apy')}
              <RiskWarningTooltip />
            </>
          }
          value={
            typeof vault.apy === 'number'
              ? formatApyDisplay(vault.apy)
              : undefined
          }
        />
        <DepositedAmount vault={vault} />
      </div>
      <div className="flex w-full *:flex-1 md:ml-auto md:w-auto md:*:flex-initial">
        <ButtonLink
          href={`/hemi-earn/vault/${vault.shareAddress}`}
          size="small"
          variant="primary"
        >
          {t('manage')}
        </ButtonLink>
      </div>
    </div>
  )
}
