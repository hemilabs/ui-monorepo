import { ExternalLink } from 'components/externalLink'
import { Chevron } from 'components/icons/chevron'
import { InfoIcon } from 'components/icons/infoIcon'
import { WarningBox } from 'components/warningBox'
import { useTranslations } from 'next-intl'

const Icon = () => <InfoIcon className="[&>g>path]:fill-black " />

export const DisclaimerEth = function () {
  const t = useTranslations('stake-page.drawer')

  return (
    <div>
      <WarningBox
        heading={t('unstake-eth-as-weth-heading')}
        icon={Icon}
        subheading={t('unstake-eth-as-weth-subheading')}
      >
        <ExternalLink
          className={`flex cursor-pointer items-center gap-x-1 text-sm text-orange-500
        `}
          href="https://purefinance.hemi.xyz/en/wrap-eth/"
        >
          <span>{t('unwrap')}</span>
          <Chevron.Right className="[&>path]:fill-orange-500" />
        </ExternalLink>
      </WarningBox>
    </div>
  )
}
