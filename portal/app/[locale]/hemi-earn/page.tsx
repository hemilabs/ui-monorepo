import { DataUnavailable } from 'components/dataUnavailable'
import { lazyWithFallback } from 'components/lazyWithFallback'
import { TableCard } from 'components/table/tableCard'
import { type ReactNode } from 'react'
import { useTranslations } from 'use-intl'

import { InfoCards } from './_components/infoCards'
import { OperatorBanner } from './_components/operatorDisclosure'
import { TopSection } from './_components/topSection'
import { TransactionsSection } from './_components/transactionsSection'
import { VaultInfoBarSkeleton } from './_components/vaultInfoBarSkeleton'
import { useHemiEarnShares } from './_hooks/useHemiEarnShares'

const VaultsListSkeleton = () => (
  <div className="mt-6 flex w-full flex-col gap-4">
    <VaultInfoBarSkeleton />
  </div>
)

const VaultsSection = lazyWithFallback(
  () =>
    import('./_components/vaultsSection').then(mod => ({
      default: mod.VaultsSection,
    })),
  <VaultsListSkeleton />,
)

// Shows an error card with a retry button in place of the data section if the
// share registry can't be resolved. Loading is not gated here: each child
// component (InfoCards, VaultsSection) handles its own skeleton state, and the
// underlying `useHemiEarnShares` query is a single shared subscription via
// react-query so concurrent mounts don't fan out.
const TokensGate = function ({ children }: { children: ReactNode }) {
  const { isError, refetch } = useHemiEarnShares()
  const t = useTranslations('hemi-earn')
  if (isError)
    return (
      <div className="h-90">
        <TableCard>
          <DataUnavailable
            onRetry={() => refetch()}
            title={t('could-not-load-vaults')}
          />
        </TableCard>
      </div>
    )
  return <>{children}</>
}

export const HemiEarnPage = () => (
  <>
    <TopSection />
    <div className="mb-6">
      <OperatorBanner />
    </div>
    <TokensGate>
      <InfoCards />
      <VaultsSection />
      <TransactionsSection />
    </TokensGate>
  </>
)
