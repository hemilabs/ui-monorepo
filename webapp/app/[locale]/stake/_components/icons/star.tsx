interface StarIconProps {
  className: string
  color?: string
  rotation?: number
  size?: number
}

export const StarIcon = ({
  className,
  color = '#FF6014',
  rotation = 0,
  size = 14,
}: StarIconProps) => (
  <svg
    className={className}
    fill={color}
    height={size}
    style={rotation !== 0 ? { transform: `rotate(${rotation}deg)` } : undefined}
    viewBox="0 0 24 24"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2c.34 0 .68.16.88.48l2.5 4.62 5.08.74c.96.14 1.34 1.32.64 1.99l-3.68 3.58.87 5.06c.17.98-.87 1.72-1.75 1.26L12 17.77l-4.54 2.38c-.88.46-1.92-.28-1.75-1.26l.87-5.06-3.68-3.58c-.7-.67-.32-1.85.64-1.99l5.08-.74 2.5-4.62A1.01 1.01 0 0 1 12 2z" />
  </svg>
)
