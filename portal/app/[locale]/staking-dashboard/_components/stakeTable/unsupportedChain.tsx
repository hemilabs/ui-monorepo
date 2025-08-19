import { Button } from 'components/button'
import { TableEmptyState } from 'components/tableEmptyState'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { useSwitchChain } from 'wagmi'

const Icon = () => (
  <svg
    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    fill="none"
    height={32}
    width={32}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#icon_def_filter_a)">
      <path
        clipRule="evenodd"
        d="M15.638 7.093a.75.75 0 0 1 .724 0l2 1.104a.75.75 0 1 1-.724 1.313L16 8.607l-1.638.903a.75.75 0 1 1-.724-1.313l2-1.104Zm-4.235 3.194a.751.751 0 0 1-.295 1.02l-.805.443.805.444a.75.75 0 0 1-.724 1.314L9.5 13.02v.73a.75.75 0 1 1-1.5 0v-2a.75.75 0 0 1 .388-.657l1.996-1.1a.75.75 0 0 1 1.019.294Zm9.194 0a.75.75 0 0 1 1.02-.295l1.995 1.101a.751.751 0 0 1 .388.657v2a.75.75 0 1 1-1.5 0v-.73l-.884.488a.75.75 0 1 1-.724-1.314l.806-.444-.806-.444a.75.75 0 0 1-.295-1.02v.001Zm-7.254 3.997a.75.75 0 0 1 1.02-.294l1.637.903 1.638-.903a.751.751 0 1 1 .724 1.313l-1.612.89v1.557a.75.75 0 1 1-1.5 0v-1.557l-1.612-.89a.748.748 0 0 1-.295-1.019ZM8.75 17.5a.75.75 0 0 1 .75.75v1.557l1.608.887a.75.75 0 0 1-.724 1.314l-1.996-1.1A.75.75 0 0 1 8 20.25v-2a.75.75 0 0 1 .75-.75Zm14.5 0a.75.75 0 0 1 .75.75v2a.75.75 0 0 1-.388.657l-1.996 1.1a.748.748 0 0 1-1.038-.284.748.748 0 0 1 .314-1.029l1.608-.887V18.25a.75.75 0 0 1 .75-.75Zm-7.25 4a.75.75 0 0 1 .75.75v.73l.888-.49a.75.75 0 0 1 .724 1.313l-2 1.104a.75.75 0 0 1-.724 0l-2-1.104a.749.749 0 1 1 .724-1.313l.888.49v-.73a.75.75 0 0 1 .75-.75Z"
        fill="#FF6C15"
        fillRule="evenodd"
      />
    </g>
    <defs>
      <filter
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
        height={18}
        id="icon_def_filter_a"
        width={16}
        x={8}
        y={7}
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix
          in="SourceAlpha"
          result="hardAlpha"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        />
        <feOffset />
        <feGaussianBlur stdDeviation={0.5} />
        <feComposite in2="hardAlpha" k2={-1} k3={1} operator="arithmetic" />
        <feColorMatrix values="0 0 0 0 0.270588 0 0 0 0 0.0666667 0 0 0 0 0.0196078 0 0 0 0.24 0" />
        <feBlend in2="shape" result="effect1_innerShadow_5357_7136" />
      </filter>
    </defs>
  </svg>
)

export const UnsupportedChain = function () {
  const hemi = useHemi()
  const { switchChain } = useSwitchChain()
  const t = useTranslations()

  return (
    <TableEmptyState
      action={
        <Button
          onClick={() => switchChain({ chainId: hemi.id })}
          size="xSmall"
          type="button"
        >
          {t('common.connect-to-network', { network: hemi.name })}
        </Button>
      }
      icon={<Icon />}
      subtitle={t('staking-dashboard.table.connect-to-hemi', {
        network: hemi.name,
      })}
      title={t('common.unsupported-chain-heading')}
    />
  )
}
