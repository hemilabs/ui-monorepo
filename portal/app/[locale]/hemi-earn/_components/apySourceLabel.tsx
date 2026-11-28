import { InfoIcon } from 'components/icons/infoIcon'
import { Tooltip } from 'components/tooltip'
import { useTranslations } from 'use-intl'
import { type Address } from 'viem'

import { useVaultMetadata } from '../_hooks/useVaultMetadata'

type Props = {
  stakingVault: Address
}

export const ApySourceLabel = function ({ stakingVault }: Props) {
  const metadata = useVaultMetadata(stakingVault)
  const t = useTranslations('hemi-earn')

  return (
    <>
      {t('apy-provided-by-vetro')}
      <Tooltip
        text={t('apy-source', {
          fees: metadata?.apyIncludesFees ? 'included' : 'excluded',
        })}
        variant="info"
      >
        <div className="group/icon flex items-center">
          <InfoIcon className="group-hover/icon:[&>g>path]:fill-neutral-950" />
        </div>
      </Tooltip>
    </>
  )
}
