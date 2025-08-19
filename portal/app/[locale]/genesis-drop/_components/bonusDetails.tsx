import { OrangeCheckIcon } from 'components/icons/orangeCheckIcon'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'

import { PercentageApyStakedHemi } from '../_utils'

import { Incentives } from './incentives'
import { StakedHemiTooltip } from './stakedHemiTooltip'

const Container = ({
  bgColor,
  children,
}: {
  bgColor: string
  children: ReactNode
}) => (
  <div
    className={`flex h-full flex-col gap-y-3 rounded-b-lg p-6 text-sm font-medium ${bgColor}`}
  >
    {children}
  </div>
)

const Row = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center gap-x-1.5">{children}</div>
)

const XIcon = () => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15ZM10.7803 10.7803C10.4874 11.0732 10.0126 11.0732 9.71967 10.7803L8 9.06066L6.28033 10.7803C5.98744 11.0732 5.51256 11.0732 5.21967 10.7803C4.92678 10.4874 4.92678 10.0126 5.21967 9.71967L6.93934 8L5.21967 6.28033C4.92678 5.98744 4.92678 5.51256 5.21967 5.21967C5.51256 4.92678 5.98744 4.92678 6.28033 5.21967L8 6.93934L9.71967 5.21967C10.0126 4.92678 10.4874 4.92678 10.7803 5.21967C11.0732 5.51256 11.0732 5.98744 10.7803 6.28033L9.06066 8L10.7803 9.71967C11.0732 10.0126 11.0732 10.4874 10.7803 10.7803Z"
      fill="#A3A3A3"
      fillRule="evenodd"
    />
  </svg>
)

export const NoBonus = function () {
  const t = useTranslations('genesis-drop.claim-options')
  return (
    <Container bgColor="bg-neutral-50">
      <Row>
        <XIcon />
        <span className="text-neutral-500">{t('bonus-tokens')}</span>
      </Row>
    </Container>
  )
}

export const BonusDetails = function () {
  const t = useTranslations('genesis-drop.claim-options')
  return (
    <Container bgColor="bg-white">
      <Row>
        <OrangeCheckIcon size="small" />
        <span className="text-neutral-950">
          {t('apy-in-ve-hemi', {
            percentage: PercentageApyStakedHemi,
          })}
        </span>
        <StakedHemiTooltip />
      </Row>
      <Row>
        <OrangeCheckIcon size="small" />
        <span className="text-neutral-950">{t('future-incentives-from')}</span>
        <Incentives />
      </Row>
    </Container>
  )
}
