import { StaticImageData } from 'next/image'
import { StakeProtocols } from 'types/stake'

import babypie from './images/babypie.svg'
import bedRock from './images/bedRock.svg'
import bitFi from './images/bitFi.svg'
import circle from './images/circle.svg'
import eigenpie from './images/eigenpie.svg'
import ethereum from './images/ethereum.svg'
import exSat from './images/exSat.svg'
import hemi from './images/hemi.svg'
import kelp from './images/kelp.svg'
import lorenzo from './images/lorenzo.svg'
import makerDao from './images/makerDao.svg'
import merlinChain from './images/merlinChain.svg'
import obeliskNodeDao from './images/obeliskNodeDao.svg'
import pumpBtc from './images/pumpBtc.svg'
import solv from './images/solv.svg'
import stakeStone from './images/stakeStone.svg'
import tether from './images/tether.svg'
import threshold from './images/threshold.svg'
import uniRouter from './images/uniRouter.svg'
import wbtc from './images/wbtc.svg'

export const protocolImages: Record<StakeProtocols, StaticImageData> = {
  babypie,
  bedRock,
  bitFi,
  circle,
  egEth: eigenpie,
  ethereum,
  exSat,
  hemi,
  kelp,
  lorenzo,
  makerDao,
  merlinChain,
  obeliskNodeDao,
  pumpBtc,
  solv,
  stakeStone,
  tether,
  threshold,
  uniBtc: bedRock,
  uniRouter,
  wbtc,
}
