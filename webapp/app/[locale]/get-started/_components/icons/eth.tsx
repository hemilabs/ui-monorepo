export const Eth = () => (
  <svg fill="none" height={19} width={19} xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#eth_path)">
      <path
        className="fill-orange-950"
        d="M9.5 18.54a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
      />
      <path
        className="translate-x-[3px] translate-y-[3px]"
        d="M6.5.54 2.815 6.65 6.5 8.825l3.685-2.177L6.5.54Zm0 12L2.815 7.347 6.5 9.539l3.685-2.191L6.5 12.539Z"
        fill="#fff"
      />
    </g>
    <defs>
      <clipPath id="eth_path">
        <path d="M.5.54h18v18H.5z" fill="#fff" />
      </clipPath>
    </defs>
  </svg>
)
