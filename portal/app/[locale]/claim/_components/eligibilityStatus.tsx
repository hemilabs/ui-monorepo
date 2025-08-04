import { useTranslations } from 'next-intl'

const Text = ({ value }: { value: string }) => (
  <div className="[&>svg]:max-h-26 relative flex w-full items-center justify-center">
    <svg
      className="max-w-full"
      fill="none"
      viewBox="0 0 400 90"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Enhanced drop shadow and inner shadow filter */}
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="150%"
          id="textEffects"
          width="150%"
          x="-25%"
          y="-25%"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.0392157 0 0 0 0 0.0392157 0 0 0 0 0.0392157 0 0 0 0.15 0"
          />
          <feBlend
            in2="BackgroundImageFix"
            mode="normal"
            result="effect1_dropShadow"
          />
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow"
            mode="normal"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="4" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.45 0"
          />
          <feBlend in2="shape" mode="normal" result="effect2_innerShadow" />
        </filter>

        {/* Linear gradient for text fill */}
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="textGradient"
          x1="50%"
          x2="50%"
          y1="0%"
          y2="100%"
        >
          <stop stopColor="white" stopOpacity="0.2" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* Inner shadow filter for creamy background */}
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="150%"
          id="creamyTextEffects"
          width="150%"
          x="-25%"
          y="-25%"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            in="SourceGraphic"
            in2="BackgroundImageFix"
            mode="normal"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.270588 0 0 0 0 0.0666667 0 0 0 0 0.0196078 0 0 0 0.06 0"
          />
          <feBlend in2="shape" mode="normal" result="effect1_innerShadow" />
        </filter>
      </defs>

      {/* Background stroke layer with enhanced effects */}
      <g filter="url(#creamyTextEffects)">
        <mask fill="black" id="creamyTextMask" maskUnits="userSpaceOnUse">
          <rect fill="white" height="90" width="400" />
          <text
            dominantBaseline="central"
            fontFamily="inherit"
            fontSize="64"
            fontWeight="600"
            letterSpacing="-1.28"
            textAnchor="middle"
            x="50%"
            y="50%"
          >
            {value}
          </text>
        </mask>
        <text
          dominantBaseline="central"
          fill="#FFEBD4"
          fontFamily="inherit"
          fontSize="64"
          fontWeight="600"
          letterSpacing="-1.28"
          mask="url(#creamyTextMask)"
          stroke="#FFEBD4"
          strokeLinejoin="round"
          strokeWidth="8"
          textAnchor="middle"
          x="50%"
          y="50%"
        >
          {value}
        </text>
      </g>

      {/* Main text with advanced effects */}
      <g filter="url(#textEffects)">
        <mask fill="white" id="textMask">
          <text
            dominantBaseline="central"
            fontFamily="inherit"
            fontSize="64"
            fontWeight="600"
            letterSpacing="-1.28"
            textAnchor="middle"
            x="50%"
            y="50%"
          >
            {value}
          </text>
        </mask>
        <text
          dominantBaseline="central"
          fill="url(#textGradient)"
          fontFamily="inherit"
          fontSize="64"
          fontWeight="600"
          letterSpacing="-1.28"
          mask="url(#textMask)"
          stroke="url(#textGradient)"
          strokeWidth="1"
          textAnchor="middle"
          x="50%"
          y="50%"
        >
          {value}
        </text>
        <text
          dominantBaseline="central"
          fill="#FF6C15"
          fontFamily="inherit"
          fontSize="64"
          fontWeight="600"
          letterSpacing="-1.28"
          textAnchor="middle"
          x="50%"
          y="50%"
        >
          {value}
        </text>
      </g>
    </svg>
  </div>
)

// By implementing the Status like this, TS can detect that when status is "eligible" amount must be
// defined, but not in the other way around
type Props =
  | { status: 'claimed' }
  | {
      status: 'not-eligible'
    }
  | {
      amount: string
      status: 'eligible'
    }

export const EligibilityStatus = function (props: Props) {
  const t = useTranslations('rewards-page')

  if (props.status === 'not-eligible') {
    return <Text value={t('not-eligible')} />
  }
  if (props.status === 'claimed') {
    return <Text value={t('claimed')} />
  }
  return <Text value={props.amount} />
}
