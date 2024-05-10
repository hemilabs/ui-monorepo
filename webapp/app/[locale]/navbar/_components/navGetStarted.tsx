import Image from 'next/image'
import React from 'react'

import backgroundImg from './get-started-background.png'

type Props = {
  children: React.ReactNode
}

export const NavGetStarted = ({ children }: Props) => (
  <div
    className="w-45 bg-get-started-gradient relative h-28 cursor-pointer overflow-hidden 
    rounded-3xl border border-slate-200 border-opacity-50
    transition-colors duration-300 hover:bg-slate-500
    hover:bg-opacity-5 md:h-32"
  >
    <Image
      alt="Get started background image"
      className="object-cover md:object-none"
      fill
      src={backgroundImg}
    />
    <div className="absolute left-1/2 top-1/2 h-9 w-32 -translate-x-1/2 -translate-y-1/2 transform">
      {children}
    </div>
  </div>
)
