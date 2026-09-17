import { Button } from 'components/button'
import { TokenLogo } from 'components/tokenLogo'
import Skeleton from 'react-loading-skeleton'
import { EvmToken } from 'types/token'
import { useTranslations } from 'use-intl'
import { isDataUnavailable } from 'utils/queryStatus'
import type { TokenSettlement } from 've-hemi-rewards/actions'
import { type Address } from 'viem'

import { useClaimEpochRewardsToken } from '../../_hooks/useClaimEpochRewardsToken'
import { useEpochClaimableByToken } from '../../_hooks/useEpochClaimableByToken'
import { useRewardTokens } from '../../_hooks/useRewardTokens'
import { useSettleableTokens } from '../../_hooks/useSettleableTokens'
import { formatRewardAmount } from '../../_utils/rewardAmount'

type AssetRowProps = {
  claimable: bigint | undefined
  // From the Lens row: the registry mixes 18dp and 8dp assets.
  decimals: number | undefined
  isAmountUnavailable: boolean
  isMissingRow: boolean
  symbol: string | undefined
  settlement: TokenSettlement['state'] | undefined
  token: EvmToken
  tokenId: bigint
}

const AssetRow = function ({
  claimable,
  decimals,
  isAmountUnavailable,
  isMissingRow,
  settlement,
  symbol,
  token,
  tokenId,
}: AssetRowProps) {
  const t = useTranslations('staking-dashboard.claim-rewards')
  // The last-resort path to the holder's money. It used to report nothing at all, so a
  // rejected signature or a revert left the row unchanged and the button looked dead.
  const {
    isError,
    isPending,
    mutate: claimAsset,
  } = useClaimEpochRewardsToken({
    token: token.address as Address,
    tokenId,
  })

  const owesNothing =
    settlement === 'nothing-owed' ||
    (claimable !== undefined && claimable === BigInt(0))
  // Only a refusal from the contract says the asset is blocked. A simulation that could
  // not be completed says nothing, and calling that "cannot be claimed" would invent a
  // blocklist from a bad connection.
  const isBlocked = settlement === 'reverts'
  // An unfinished pre-flight is not a verdict either. The claim action simulates the
  // exact call again before signing, so leave the control usable and let the contract
  // answer rather than disabling it on a read that never came back.
  const isEnabled = !isPending && !owesNothing && !isBlocked

  // The Lens row wins over the token list - the contract's answer cannot go stale.
  const renderAmount = function () {
    const assetSymbol = symbol ?? token.symbol
    if (claimable !== undefined) {
      return `${formatRewardAmount({
        amount: claimable,
        decimals: decimals ?? token.decimals,
      })} ${assetSymbol}`
    }
    // A read that resolved without listing this asset is not a pending one.
    if (isAmountUnavailable || isMissingRow) {
      return `- ${assetSymbol}`
    }
    return <Skeleton className="h-4 w-16" />
  }

  return (
    <li className="flex items-center justify-between gap-x-2 py-1">
      <div className="flex items-center gap-x-1 text-sm font-medium">
        <TokenLogo size="xSmall" token={token} />
        <span>{renderAmount()}</span>
      </div>
      {isBlocked ? (
        <span className="text-sm font-medium text-neutral-500">
          {t('asset-blocked')}
        </span>
      ) : (
        <div className="flex items-center gap-x-2">
          {/* Beside the button, never instead of it. Replacing the control with a
              failure label removed the only thing that could act on the advice the
              label was giving. */}
          {isError && (
            <span className="text-sm font-medium text-neutral-500">
              {t('asset-claim-failed')}
            </span>
          )}
          <Button
            disabled={!isEnabled}
            onClick={() => claimAsset()}
            size="small"
          >
            {t(isPending ? 'heading' : 'claim-asset')}
          </Button>
        </div>
      )}
    </li>
  )
}

/**
 * Claims the reward assets one at a time, when claiming them together will not work.
 *
 * The whole-registry claim reverts as a whole, so a holder blocked in a single asset - a
 * USDC-shaped blocklist - can otherwise collect nothing. Offered only after a failure,
 * since the pre-flight costs one simulation per registered asset.
 */
export const ClaimAssetsIndividually = function ({
  tokenId,
}: {
  tokenId: bigint
}) {
  const t = useTranslations('staking-dashboard.claim-rewards')
  // `hasError` as well as the tokens: `useRewardTokens` drops any asset whose metadata
  // read failed, so without this one just vanishes from the list with no explanation.
  const { hasError: hasRewardTokensError, tokens: rewardTokens } =
    useRewardTokens()
  const {
    data: claimable,
    fetchStatus,
    status,
  } = useEpochClaimableByToken(tokenId)
  const isAmountUnavailable = isDataUnavailable({ fetchStatus, status })
  const { data: settleable } = useSettleableTokens({ enabled: true, tokenId })
  // The pre-flight only narrows what is offered. Until it answers, every asset is
  // `unknown` - shown and claimable, rather than the whole list going quietly dead.
  const isPreflightUnfinished = settleable === undefined

  if (rewardTokens.length === 0) {
    return null
  }

  const find = <T extends { token: string }>(
    rows: T[] | undefined,
    at: string,
  ) => rows?.find(row => row.token.toLowerCase() === at.toLowerCase())

  return (
    <div className="flex w-full flex-col gap-y-2">
      {/* The blocked-asset explanation is only true when an asset IS blocked. A claim
          can also fail for reasons that have nothing to do with the registry - a
          rejected signature, a dropped transaction - and saying otherwise would send
          the holder looking for a problem that is not there. */}
      <p className="text-sm font-medium text-neutral-500">
        {/* The blocked-asset explanation is only true when SOME assets settle and
            others do not. If every asset refuses, the cause is the contract - paused,
            or this holder - not one bad token, and naming a blocklist sends the holder
            looking for a problem that is not there. */}
        {t(
          settleable?.some(row => row.state === 'reverts') &&
            settleable.some(row => row.state !== 'reverts')
            ? 'claim-individually-explainer'
            : 'claim-individually-heading',
        )}
      </p>
      {/* An incomplete list is not the list, and the missing asset is probably the one
          they came here to claim. */}
      {hasRewardTokensError && (
        <p className="text-sm font-medium text-neutral-500">
          {t('ineligible.rewards-unavailable')}
        </p>
      )}
      <ul className="flex w-full flex-col">
        {rewardTokens.map(token => (
          <AssetRow
            claimable={find(claimable, token.address)?.claimable}
            decimals={find(claimable, token.address)?.decimals}
            isAmountUnavailable={isAmountUnavailable}
            isMissingRow={
              claimable !== undefined &&
              find(claimable, token.address) === undefined
            }
            key={token.address}
            settlement={
              isPreflightUnfinished
                ? 'unknown'
                : find(settleable, token.address)?.state
            }
            symbol={find(claimable, token.address)?.symbol}
            token={token}
            tokenId={tokenId}
          />
        ))}
      </ul>
    </div>
  )
}
