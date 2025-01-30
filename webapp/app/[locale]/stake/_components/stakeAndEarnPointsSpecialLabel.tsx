import { useTranslations } from 'next-intl'

import { StarIcon } from './icons/star'

interface Props {
  gradientMode?: 'primary' | 'secondary'
  textSize?: 'text-6xl' | 'text-4xl'
}

// This function is designed to render a gradient label with a special behavior for the letter 'i'.
// If the second part of the label (labelParts[1]) contains the letter 'i', a star icon is rendered
// above it. However, in cases where the translation does not include the letter 'i' (e.g., in Spanish),
// a conditional logic ensures that the label is rendered correctly without the star icon.
export function StakeAndEarnPointsSpecialLabel({
  gradientMode = 'primary',
  textSize = 'text-6xl',
}: Props) {
  const t = useTranslations('stake-page.dashboard')
  const labelParts = t('stake-earn-points-label').split('|')

  const gradients = {
    primary: {
      firstText: 'from-[#FF6F3D] via-[#FF8B4F] to-[#FFD37C]',
      secondText: 'from-[#FF7849] via-[#FF9A5A] to-[#FFC86B]',
      starColor: '#FF7849',
    },
    secondary: {
      firstText: 'from-[#DD3818] via-[#e46830] to-[#ea8d61]',
      secondText: 'from-[#dd3818] via-[#e46830] to-[#ea8d61]',
      starColor: '#e46830',
    },
  }

  const selectedGradients = gradients[gradientMode]

  return (
    <div className="relative z-20 text-center font-bold leading-tight text-transparent lg:text-left">
      <div
        className={`group bg-gradient-to-r ${selectedGradients.firstText} bg-clip-text ${textSize}`}
      >
        {labelParts[0]}
      </div>
      <div
        className={`group bg-gradient-to-r ${selectedGradients.secondText} bg-clip-text ${textSize}`}
      >
        {labelParts[2].includes('i') ? (
          <>
            {labelParts[1].replace('i', '')}
            <span className="relative inline-block">
              <StarIcon
                className="group-[.text-6xl]:-top-13 absolute left-1/2 -translate-x-[3px] group-[.text-4xl]:-top-[34px]"
                color={selectedGradients.starColor}
                size={textSize === 'text-6xl' ? 22 : 16}
              />
            </span>
          </>
        ) : (
          labelParts[1]
        )}
        {labelParts[2]}
      </div>
    </div>
  )
}
