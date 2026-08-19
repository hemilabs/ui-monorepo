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
  { className?: string; height: number; src: string; width: number }
> = {
  babypie: { className: 'w-20', height: 36, src: babypie, width: 160 },
  bedRock: { height: 24, src: bedRock, width: 113 },
  bitFi: { height: 24, src: bitFi, width: 62 },
  circle: { height: 18, src: circle, width: 71 },
  egEth: { className: 'w-21', height: 40, src: eigenpie, width: 170 },
  ethereum: { height: 20, src: ethereum, width: 80 },
  exSat: { height: 19, src: exSat, width: 91 },
  hemi: { height: 18, src: hemi, width: 63 },
  kelp: { height: 20, src: kelp, width: 54 },
  lorenzo: { height: 22, src: lorenzo, width: 84 },
  makerDao: { className: 'w-21', height: 24, src: makerDao, width: 166 },
  merlinChain: { className: 'w-29', height: 40, src: merlinChain, width: 232 },
  obeliskNodeDao: { height: 18, src: obeliskNodeDao, width: 64 },
  pumpBtc: { className: 'w-24', height: 72, src: pumpBtc, width: 282 },
  river: { height: 18, src: river, width: 52 },
  solv: { height: 16, src: solv, width: 56 },
  sumer: { className: 'w-15', height: 40, src: sumer, width: 131 },
  tether: { height: 14, src: tether, width: 63 },
  tetherGold: { height: 20, src: tetherGold, width: 64 },
  threshold: { height: 10, src: threshold, width: 108 },
  uniBtc: { height: 24, src: bedRock, width: 113 },
  uniRouter: { className: 'w-21', height: 48, src: uniRouter, width: 166 },
  wbtc: { height: 18, src: wbtc, width: 61 },
  yieldNest: { height: 18, src: yieldNest, width: 95 },
}
