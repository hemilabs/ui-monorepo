import React from 'react'

type Props = {
  children: React.ReactNode
}

const SvgComponent = props => (
  <svg
    fill="none"
    height={121}
    width={180}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M0 .5h180v120H0z" fill="url(#a)" />
    <path d="M147 48.5h36v36h-36zM39-23.422h36v36H39z" fill="#fff" />
    <path d="M110.7 48.5h36v36h-36zM38.7 12.5h36v36h-36z" fill="#FF6C15" />
    <path
      d="M-33-23.5H3v36h-36zM-33 12.5H3v36h-36zM-33 48.5H3v36h-36zM-33 84.5H3v36h-36zM3-23.5h36v36H3zM3 12.5h36v36H3zM3 48.5h36v36H3zM3 84.5h36v36H3zM39-23.5h36v36H39zM39 12.5h36v36H39zM39 48.5h36v36H39zM39 84.5h36v36H39zM75-23.5h36v36H75zM75 12.5h36v36H75zM75 48.5h36v36H75zM75 84.5h36v36H75zM111-23.5h36v36h-36zM111 12.5h36v36h-36zM111 48.5h36v36h-36zM111 84.5h36v36h-36zM147-23.5h36v36h-36zM147 12.5h36v36h-36zM147 48.5h36v36h-36zM147 84.5h36v36h-36z"
      stroke="#FF6C15"
    />
    <path d="M.5 1h179v119H.5z" stroke="#E5E6E6" />
    <defs>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="a"
        x1={90}
        x2={90}
        y1={0.5}
        y2={120.5}
      >
        <stop />
        <stop offset={1} />
      </linearGradient>
    </defs>
  </svg>
)
export default SvgComponent

export const NavGetStarted = ({ children }: Props) => (
  <div
    className="h-30 w-45 relative cursor-pointer 
    overflow-hidden rounded-3xl border border-slate-200
    border-opacity-50 transition-colors duration-300
    hover:bg-slate-500 hover:bg-opacity-5"
  >
    <svg
      fill="none"
      height="121"
      viewBox="0 0 180 121"
      width="180"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_444_630)">
        <rect
          fill="url(#paint0_linear_444_630)"
          height="120"
          width="180"
          y="0.5"
        />
        <rect fill="white" height="36" width="36" x="147" y="48.5" />
        <rect fill="white" height="36" width="36" x="39" y="-23.4219" />
        <rect
          fill="#FF6C15"
          fillOpacity="0.05"
          height="36"
          transform="matrix(1 0 0 1 110.7 48.5)"
          width="36"
        />
        <rect
          fill="#FF6C15"
          fillOpacity="0.05"
          height="36"
          transform="matrix(1 0 0 1 38.7002 12.5)"
          width="36"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="-33"
          y="-23.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="-33"
          y="12.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="-33"
          y="48.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="-33"
          y="84.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="3"
          y="-23.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="3"
          y="12.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="3"
          y="48.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="3"
          y="84.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="39"
          y="-23.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="39"
          y="12.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="39"
          y="48.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="39"
          y="84.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="75"
          y="-23.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="75"
          y="12.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="75"
          y="48.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="75"
          y="84.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="111"
          y="-23.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="111"
          y="12.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="111"
          y="48.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="111"
          y="84.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="147"
          y="-23.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="147"
          y="12.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="147"
          y="48.5"
        />
        <rect
          height="36"
          stroke="#FF6C15"
          strokeOpacity="0.02"
          strokeWidth="0.6"
          width="36"
          x="147"
          y="84.5"
        />
      </g>
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="paint0_linear_444_630"
          x1="90"
          x2="90"
          y1="0.5"
          y2="120.5"
        >
          <stop stopColor="#FF4D00" stopOpacity="0" />
          <stop offset="1" stopColor="#FF4D00" stopOpacity="0.07" />
        </linearGradient>
        <clipPath id="clip0_444_630">
          <rect fill="white" height="120" width="180" y="0.5" />
        </clipPath>
      </defs>
    </svg>
    <div className="absolute left-1/2 top-1/2 h-9 w-32 -translate-x-1/2 -translate-y-1/2 transform">
      {children}
    </div>
  </div>
)
