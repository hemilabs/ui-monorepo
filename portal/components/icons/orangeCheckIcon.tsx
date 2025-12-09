// It's easier to sort by value here
/* eslint-disable sort-keys */
const sizes = {
  small: 'size-4',
  medium: 'size-5',
} as const
/* eslint-enable sort-keys */

type Props = {
  size?: keyof typeof sizes
}

export const OrangeCheckIcon = ({ size = 'medium' }: Props) => (
  <div
    className={`flex ${sizes[size]} items-center justify-center rounded-full bg-orange-600`}
  >
    <svg fill="none" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
      <path
        clipRule="evenodd"
        d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
        fill="#fff"
        fillRule="evenodd"
      />
    </svg>
  </div>
)
