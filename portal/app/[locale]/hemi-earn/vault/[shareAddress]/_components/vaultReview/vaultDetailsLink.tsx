import { Link } from 'components/link'
import { useTranslations } from 'use-intl'
import { type Address } from 'viem'

// TODO: confirm the destination. Issue #2588 says the vault's pool page, but
// vetro-monorepo#1013 asked Vetro for a `feeScheduleUrl` that was never published.
// Until then this points at the vault page, opened in a new tab so following it
// does not drop `drawerMode` and close the review underneath.
export const VaultDetailsLink = function ({
  shareAddress,
}: {
  shareAddress: Address
}) {
  const t = useTranslations('hemi-earn.vault.drawer')
  return (
    <Link
      className="hoverable-text self-start text-sm font-medium underline"
      href={`/hemi-earn/vault/${shareAddress}`}
      rel="noopener noreferrer"
      target="_blank"
    >
      {t('vault-details-and-fees')}
    </Link>
  )
}
