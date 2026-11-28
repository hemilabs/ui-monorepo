import { useHemi } from 'hooks/useHemi'
import { orange600 } from 'styles'
import { Token } from 'types/token'

// Prefer ordering these by value rather than by key
/* eslint-disable sort-keys */
const sizes = {
  xSmall: 'size-2',
  small: 'size-2.5',
  medium: 'size-3',
  large: 'size-4',
} as const
/* eslint-enable sort-keys */

type Props = {
  size: keyof typeof sizes
  token: Token
}

const HemiLogo = ({ size }: Pick<Props, 'size'>) => (
  <svg
    className={sizes[size]}
    fill="none"
    height="10"
    viewBox="10 10 10 10"
    width="10"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect fill="#FFEBD4" height="9" rx="2.5" width="9" x="10.5" y="10.5" />
    <rect height="9" rx="2.5" stroke="white" width="9" x="10.5" y="10.5" />
    <path
      d="M15.5767 12.0009C15.5459 11.9954 15.5168 12.0157 15.5114 12.0472L15.139 14.1982H14.861L14.4886 12.0472C14.4832 12.0157 14.4541 11.9954 14.4233 12.0009C13.1008 12.2617 12.0872 13.4084 12.0036 14.8104C12.0036 14.8123 12 14.8715 12 14.901C12 14.9047 12 14.9084 12 14.9103C12 14.9214 12 14.9325 12 14.9436C12 14.9473 12 14.951 12 14.9565C12 14.9713 12 14.9843 12 14.9991C12 16.4861 13.0427 17.7235 14.4251 17.9972C14.4559 18.0028 14.485 17.9824 14.4905 17.951L14.8629 15.7999H15.1408L15.5114 17.9529C15.5168 17.9843 15.5459 18.0046 15.5767 17.9991C16.8992 17.7364 17.911 16.5897 17.9964 15.1877C17.9964 15.1859 18 15.1267 18 15.0971C18 15.0934 18 15.0897 18 15.0879C18 15.0768 18 15.0657 18 15.0546C18 15.0509 18 15.0472 18 15.0416C18 15.0268 18 15.0139 18 14.9991C18.0018 13.512 16.9591 12.2746 15.5767 12.0009Z"
      fill={orange600}
    />
  </svg>
)

export const HemiSubLogo = function ({ size, token }: Props) {
  const hemi = useHemi()
  if (token.chainId !== hemi.id) {
    return null
  }
  return (
    <div className="absolute bottom-0 right-0">
      <HemiLogo size={size} />
    </div>
  )
}
