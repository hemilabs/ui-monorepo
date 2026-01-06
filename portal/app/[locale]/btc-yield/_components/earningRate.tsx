import { Tooltip } from 'components/tooltip'
import { useTranslations } from 'next-intl'
import { type MerklOpportunityResponse } from 'utils/merkl'
import { Address, isAddress, isAddressEqual } from 'viem'

import { useEarningRate } from '../_hooks/useEarningRate'
import { useMerklCampaigns } from '../_hooks/useMerklCampaigns'
import { usePoolAsset } from '../_hooks/usePoolAsset'
import {
  calculateTotalAPR,
  formatAPRDisplay,
  getActiveCampaigns,
  getUniqueRewardTokens,
} from '../_utils'

import { CardInfo } from './cardInfo'
import earningRateIcon from './icons/earningRate.svg'
import { TokenDisplay } from './tokenDisplay'

const getTotalTokenAPR = (
  campaigns: MerklOpportunityResponse['campaigns'],
  tokenAddress: Address,
  tokenChainId: number,
) =>
  campaigns
    .filter(
      campaign =>
        isAddress(campaign.rewardToken.address) &&
        isAddressEqual(tokenAddress, campaign.rewardToken.address) &&
        tokenChainId === campaign.rewardToken.chainId,
    )
    .reduce((sum, campaign) => sum + campaign.apr, 0)

export const EarningRate = function () {
  const poolAsset = usePoolAsset().data
  const t = useTranslations('bitcoin-yield.info')

  const { data: nativeRate, isError: nativeError } = useEarningRate()
  const { data: merklData, isError: merklError } = useMerklCampaigns()

  const hasError = nativeError || merklError

  const activeCampaigns = getActiveCampaigns(merklData?.campaigns)

  const totalAPR = calculateTotalAPR(nativeRate, merklData)

  // Get unique tokens for the breakdown
  const campaignRewards = getUniqueRewardTokens(activeCampaigns)

  return (
    <CardInfo
      data={totalAPR}
      formatValue={function (apr) {
        const hasRewards = merklData?.apr && merklData.apr > 0
        const formattedTotal = formatAPRDisplay(apr)

        const tooltipContent = hasRewards ? (
          <div className="flex flex-col gap-y-1">
            <div className="*:body-text-medium flex items-center justify-start gap-x-1 *:text-white">
              <TokenDisplay
                address={poolAsset.address}
                chainId={poolAsset.chainId}
                size="small"
              />
              <p>{t('native')}</p>
              <span className="ml-auto">{formatAPRDisplay(nativeRate!)}</span>
            </div>
            {campaignRewards.map(function (token) {
              const totalTokenAPR = getTotalTokenAPR(
                activeCampaigns!,
                token.address,
                token.chainId,
              )

              return (
                <div
                  className="*:body-text-medium flex items-center justify-start gap-x-1 *:text-white"
                  key={`${token.address}-${token.chainId}`}
                >
                  <TokenDisplay
                    address={token.address}
                    chainId={token.chainId}
                    size="small"
                  />
                  <p>{token.symbol}:</p>
                  <span className="ml-auto">
                    +{formatAPRDisplay(totalTokenAPR)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : null

        const content = (
          <div className="group/earning-rate flex items-center gap-x-2">
            <span>{formattedTotal}</span>
            {hasRewards && (
              <div className="flex -space-x-2 group-hover/earning-rate:space-x-0.5">
                {/* The list of rewards starts with the "Native" reward, plus all the incentives */}
                {[poolAsset, ...campaignRewards].map(token => (
                  <div
                    className="relative"
                    key={`${token.address}-${token.chainId}`}
                  >
                    <TokenDisplay
                      address={token.address}
                      chainId={token.chainId}
                      size="small"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )

        return hasRewards ? (
          <Tooltip
            id="earning-rate-breakdown"
            text={tooltipContent}
            variant="rich"
          >
            {content}
          </Tooltip>
        ) : (
          content
        )
      }}
      icon={earningRateIcon}
      isError={hasError}
      label={t('earning-rate')}
    />
  )
}
