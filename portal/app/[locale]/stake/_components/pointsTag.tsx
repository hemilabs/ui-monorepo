'use client'

import { useTranslations } from 'next-intl'
import { CSSProperties, ReactNode } from 'react'

import { BabypieJewelsIcon } from './icons/babypieJewelsIcon'
import { BitFiPointsIcon } from './icons/bitFiPointsIcon'
import { BsquaredPointsIcon } from './icons/bsquaredPointsIcon'
import { DiamondPointsIcon } from './icons/diamondPointsIcon'
import { EigenpiePointsIcon } from './icons/eigenpiePointsIcon'
import { Hemi2xPointsIcon } from './icons/hemi2xPointsIcon'
import { Hemi3xPointsIcon } from './icons/hemi3xPointsIcon'
import { HemiPointsIcon } from './icons/hemiPointsIcon'
import { KernelIcon } from './icons/kernelIcon'
import { LorenzoPointsIcon } from './icons/lorenzoPointsIcon'
import { PumpBtcPointsIcon } from './icons/pumpBtcPointsIcon'
import { RiverPointsIcon } from './icons/riverPointsIcon'
import { SolvPointsIcon } from './icons/solvPointsIcon'
import { UnirouterPointsIcon } from './icons/unirouterPointsIcon'
import { YieldNestIcon } from './icons/yieldNestIcon'

type Props = {
  backgroundColor?:
    | 'bg-black'
    | 'bg-points-bsquared'
    | 'bg-orange-600'
    | 'bg-points-solv'
  borderColor?: 'border-black' | 'border-transparent'
  label:
    | 'diamonds'
    | 'points'
    | 'seeds'
    | 'x2-eigenpie-points'
    | 'x2-babypie-jewels'
    | 'x2point5-river-points'
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
  icon,
  label,
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
      <div className="relative top-px">
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
    backgroundColor="bg-orange-600"
    icon={<HemiPointsIcon />}
    label="points"
    textColor="text-white"
  />
)

export const Hemi2xPoints = () => (
  <PointsTag
    backgroundColor="bg-orange-600"
    icon={<Hemi2xPointsIcon />}
    label="points"
    textColor="text-white"
  />
)

export const Hemi3xPoints = () => (
  <PointsTag
    backgroundColor="bg-orange-600"
    icon={<Hemi3xPointsIcon />}
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

export const BabypiePoints = () => (
  <PointsTag
    icon={<BabypieJewelsIcon />}
    label="x2-babypie-jewels"
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

export const KernelPoints = () => (
  <PointsTag
    icon={<KernelIcon />}
    label="points"
    style={{
      background: '#FF8063',
    }}
    textColor="text-neutral-950"
  />
)

export const YieldNestPoints = () => (
  <PointsTag
    backgroundColor="bg-black"
    icon={<YieldNestIcon />}
    label="seeds"
    style={{
      background: '#e8c887',
    }}
    textColor="text-neutral-950"
  />
)

export const RiverPoints = () => (
  <PointsTag
    backgroundColor="bg-black"
    icon={<RiverPointsIcon />}
    label="x2point5-river-points"
    textColor="text-white"
  />
)
