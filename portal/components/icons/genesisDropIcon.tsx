type Props = {
  selected?: boolean
}

export const GenesisDropIcon = ({ selected }: Props) => (
  <svg fill="none" height={20} width={20} xmlns="http://www.w3.org/2000/svg">
    <rect
      fill={selected ? '#FF6C15' : '#F5F5F5'}
      height={20}
      rx={6}
      width={20}
    />
    <path
      d="M10 15.6a4.201 4.201 0 0 1-4.2-4.2c0-1.994 2.848-5.995 3.644-7.076a.679.679 0 0 1 .551-.273h.01c.218 0 .421.098.55.273.797 1.08 3.645 5.082 3.645 7.076 0 2.32-1.881 4.2-4.2 4.2Z"
      fill="#A3A3A3"
    />
  </svg>
)
