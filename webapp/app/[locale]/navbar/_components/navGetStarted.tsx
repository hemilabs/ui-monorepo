import Image from 'next/image'
import React from 'react'

import backgroundImg from './nav-get-started-background.png'

type Props = {
  children: React.ReactNode
}

export const NavGetStarted = ({ children }: Props) => (
  <div
    className="w-45 bg-get-started-gradient relative h-[120px] cursor-pointer overflow-hidden 
    rounded-3xl border border-slate-200 border-opacity-50
    transition-colors duration-300 hover:bg-slate-500
    hover:bg-opacity-5"
  >
    <Image
      alt="Get started background image"
      className="object-none"
      fill
      src={backgroundImg}
    />
    <div className="absolute left-1/2 top-1/2 h-11 w-52 -translate-x-1/2 -translate-y-1/2 transform md:w-32">
      {children}
    </div>
  </div>
)
