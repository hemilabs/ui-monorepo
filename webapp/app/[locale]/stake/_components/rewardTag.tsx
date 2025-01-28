import { DiamondPointsIcon } from '../../stake/_components/icons/diamondPoints'
import { HemiPointsIcon } from '../../stake/_components/icons/hemiPoints'
import { PointsIcon } from '../../stake/_components/icons/points'
import { SolvXpPointsIcon } from '../../stake/_components/icons/solvXpPoints'

type Props = {
  backgroundColor?: 'bg-orange-500' | 'bg-purple-900/70' | 'bg-neutral-950'
  label: string
  icon: React.ReactNode
  style?: React.CSSProperties
}

const RewardTag = ({
  label,
  icon,
  backgroundColor = 'bg-orange-500',
  style,
}: Props) => (
  <div
    className={`inline-flex items-center gap-x-1 rounded-full py-0.5 pl-1 pr-2 ${backgroundColor} text-white`}
    style={style}
  >
    <div className="flex items-center">{icon}</div>
    <span className="font-normal">{label}</span>
  </div>
)

export const HemiTag = () => (
  <RewardTag
    backgroundColor="bg-orange-500"
    icon={<HemiPointsIcon />}
    label="Points"
  />
)

export const SolvXpTag = () => (
  <RewardTag
    backgroundColor="bg-purple-900/70"
    icon={<SolvXpPointsIcon />}
    label="Solv XP"
  />
)

export const PointsTag = () => (
  <RewardTag
    backgroundColor="bg-neutral-950"
    icon={<PointsIcon />}
    label="Points"
  />
)

export const DiamondTag = () => (
  <RewardTag
    backgroundColor="bg-neutral-950"
    icon={<DiamondPointsIcon />}
    label="Diamond"
    style={{
      background:
        'linear-gradient(311deg, rgba(63, 176, 255, 0.56) 34.84%, rgba(146, 54, 234, 0.56) 89%, rgba(242, 154, 107, 0.56) 128.42%)',
    }}
  />
)
