import { RecommendationLevel } from '../_types'

type Props = {
  recommendationLevel: RecommendationLevel
  value: string
}
export const Amount = ({ recommendationLevel, value }: Props) => (
  <span
    className={`text-2.33xl font-semibold ${
      recommendationLevel === 'high' ? 'text-sky-850' : 'text-black'
    }`}
  >
    {value}
  </span>
)
