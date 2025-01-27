import { StaticImageData } from 'next/image'
import { StakeProtocols } from 'types/stake'

import bedRock from './images/bedRock.png'
import bitFi from './images/bitFi.png'
import exSat from './images/exSat.png'
import hemi from './images/hemi.png'
import lorenzo from './images/lorenzo.png'
import merlinChain from './images/merlinChain.png'
import nodeDao from './images/nodeDao.png'
import pumpBtc from './images/pumpBtc.png'
import solv from './images/solv.png'
import stakeStone from './images/stakeStone.png'
import uniRouter from './images/uniRouter.png'

export const protocolImages: Record<StakeProtocols, StaticImageData> = {
  bedRock,
  bitFi,
  exSat,
  hemi,
  lorenzo,
  merlinChain,
  nodeDao,
  pumpBtc,
  solv,
  stakeStone,
  uniRouter,
}
