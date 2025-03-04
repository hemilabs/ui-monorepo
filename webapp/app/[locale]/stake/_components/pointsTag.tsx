'use client'

import { useTranslations } from 'next-intl'
import { CSSProperties, ReactNode } from 'react'

import { BitFiPointsIcon } from './icons/bitFiPointsIcon'
import { BsquaredPointsIcon } from './icons/bsquaredPointsIcon'
import { DiamondPointsIcon } from './icons/diamondPointsIcon'
import { EigenpiePointsIcon } from './icons/eigenpiePointsIcon'
import { HemiPointsIcon } from './icons/hemiPointsIcon'
import { LorenzoPointsIcon } from './icons/lorenzoPointsIcon'
import { PumpBtcPointsIcon } from './icons/pumpBtcPointsIcon'
import { SolvPointsIcon } from './icons/solvPointsIcon'
import { UnirouterPointsIcon } from './icons/unirouterPointsIcon'

type Props = {
  backgroundColor?:
    | 'bg-black'
    | 'bg-points-bsquared'
    | 'bg-orange-500'
    | 'bg-points-solv'
  borderColor?: 'border-black' | 'border-transparent'
  label: 'diamonds' | 'points' | 'x2-eigenpie-points' | 'x2-magpie-points'
  icon: ReactNode
  style?: CSSProperties
  textColor:
    | 'text-black'
    | 'text-neutral-950'
    | 'text-points-eigenpie'
    | 'text-points-bsquared'
    | 'text-points-pump-btc'
    | 'text-points-unirouter'
    | 'text-white'
}

const PointsTag = function ({
  backgroundColor,
  borderColor = 'border-transparent',
  label,
  icon,
  style,
  textColor,
}: Props) {
  const t = useTranslations('stake-page.points')
  return (
    <div
      className={`flex items-center gap-x-1 rounded-full border border-solid py-0.5 pl-1 pr-2 ${borderColor} ${
        backgroundColor ?? ''
      } ${textColor}`}
      style={style}
    >
      {icon}
      <span className="text-sm font-medium">{t(label)}</span>
    </div>
  )
}

export const BedrockPoints = () => (
  <PointsTag
    icon={
      <div className="h-4 w-4">
        <DiamondPointsIcon />
      </div>
    }
    label="diamonds"
    style={{
      background:
        'linear-gradient(311deg, rgba(63, 176, 255, 0.28) 34.84%, rgba(146, 54, 234, 0.28) 89%, rgba(242, 154, 107, 0.28) 128.42%)',
    }}
    textColor="text-neutral-950"
  />
)

export const BitFiPoints = () => (
  <PointsTag
    backgroundColor="bg-black"
    icon={<BitFiPointsIcon />}
    label="points"
    textColor="text-white"
  />
)

export const BsquaredPoints = () => (
  <PointsTag
    backgroundColor="bg-points-bsquared"
    borderColor="border-black"
    icon={<BsquaredPointsIcon />}
    label="points"
    textColor="text-black"
  />
)

export const EigenpiePoints = () => (
  <PointsTag
    icon={<EigenpiePointsIcon />}
    label="x2-eigenpie-points"
    style={{
      background: 'rgba(215, 226, 235, 1)',
    }}
    textColor="text-points-eigenpie"
  />
)

export const HemiPoints = () => (
  <PointsTag
    backgroundColor="bg-orange-500"
    icon={<HemiPointsIcon />}
    label="points"
    textColor="text-white"
  />
)

export const LorenzoPoints = () => (
  <PointsTag
    backgroundColor="bg-black"
    icon={<LorenzoPointsIcon />}
    label="points"
    textColor="text-white"
  />
)

export const MagpiePoints = () => (
  <PointsTag
    icon={<EigenpiePointsIcon />}
    label="x2-magpie-points"
    style={{
      background: 'rgba(215, 226, 235, 1)',
    }}
    textColor="text-points-eigenpie"
  />
)

export const PumpBtcPoints = () => (
  <PointsTag
    icon={<PumpBtcPointsIcon />}
    label="points"
    style={{
      background: 'rgba(42, 59, 146, 0.96)',
    }}
    textColor="text-points-pump-btc"
  />
)

export const SolvPoints = () => (
  <PointsTag
    backgroundColor="bg-points-solv"
    icon={<SolvPointsIcon />}
    label="points"
    textColor="text-neutral-950"
  />
)

export const UnirouterPoints = () => (
  <PointsTag
    icon={<UnirouterPointsIcon />}
    label="points"
    style={{
      background:
        'linear-gradient(118deg, rgba(194, 107, 255, 0.16) -2.63%, rgba(150, 0, 255, 0.16) 89.01%)',
    }}
    textColor="text-points-unirouter"
  />
)
