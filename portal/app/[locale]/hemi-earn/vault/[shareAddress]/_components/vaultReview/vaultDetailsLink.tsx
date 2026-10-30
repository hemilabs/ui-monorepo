import { Link } from 'components/link'
import { useTranslations } from 'use-intl'
import { type Address } from 'viem'

// TODO: confirm the destination. Issue #2588 says the vault's pool page, but
// vetro-monorepo#1013 asked Vetro for a `feeScheduleUrl` that was never published.
// As it stands the drawer only renders on the vault page, so this links to the page
// the user is already on.
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
    >
      {t('vault-details-and-fees')}
    </Link>
  )
}
