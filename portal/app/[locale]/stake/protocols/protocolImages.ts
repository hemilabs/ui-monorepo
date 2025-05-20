import { StaticImageData } from 'next/image'
import { StakeProtocols } from 'types/stake'

import babypie from './images/babypie.png'
import bedRock from './images/bedRock.svg'
import bitFi from './images/bitFi.svg'
import circle from './images/circle.svg'
import eigenpie from './images/eigenpie.png'
import ethereum from './images/ethereum.svg'
import exSat from './images/exSat.svg'
import hemi from './images/hemi.svg'
import kelp from './images/kelp.svg'
import lorenzo from './images/lorenzo.svg'
import makerDao from './images/makerDao.png'
import merlinChain from './images/merlinChain.png'
import obeliskNodeDao from './images/obeliskNodeDao.svg'
import pumpBtc from './images/pumpBtc.png'
import river from './images/river.png'
import solv from './images/solv.svg'
import sumer from './images/sumer.png'
import tether from './images/tether.svg'
import tetherGold from './images/tetherGold.svg'
import threshold from './images/threshold.svg'
import uniRouter from './images/uniRouter.png'
import wbtc from './images/wbtc.svg'
import yieldNest from './images/yieldNest.svg'

export const protocolImages: Record<
  StakeProtocols,
  { src: StaticImageData; className?: string }
> = {
  babypie: { className: 'w-20', src: babypie },
  bedRock: { src: bedRock },
  bitFi: { src: bitFi },
  circle: { src: circle },
  egEth: { className: 'w-21', src: eigenpie },
  ethereum: { src: ethereum },
  exSat: { src: exSat },
  hemi: { src: hemi },
  kelp: { src: kelp },
  lorenzo: { src: lorenzo },
  makerDao: { className: 'w-21', src: makerDao },
  merlinChain: { className: 'w-29', src: merlinChain },
  obeliskNodeDao: { src: obeliskNodeDao },
  pumpBtc: { className: 'w-24', src: pumpBtc },
  river: { src: river },
  solv: { src: solv },
  sumer: { className: 'w-15', src: sumer },
  tether: { src: tether },
  tetherGold: { src: tetherGold },
  threshold: { src: threshold },
  uniBtc: { src: bedRock },
  uniRouter: { className: 'w-21', src: uniRouter },
  wbtc: { src: wbtc },
  yieldNest: { src: yieldNest },
}
