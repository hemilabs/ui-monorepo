import { StaticImageData } from 'next/image'
import { StakeProtocols } from 'types/stake'

import bedRock from './images/bedRock.svg'
import bitFi from './images/bitFi.svg'
import exSat from './images/exSat.svg'
import hemi from './images/hemi.svg'
import lorenzo from './images/lorenzo.svg'
import merlinChain from './images/merlinChain.svg'
import obeliskNodeDao from './images/obeliskNodeDao.svg'
import pumpBtc from './images/pumpBtc.svg'
import solv from './images/solv.svg'
import stakeStone from './images/stakeStone.svg'
import uniRouter from './images/uniRouter.svg'

export const protocolImages: Record<StakeProtocols, StaticImageData> = {
  bedRock,
  bitFi,
  exSat,
  hemi,
  lorenzo,
  merlinChain,
  obeliskNodeDao,
  pumpBtc,
  solv,
  stakeStone,
  uniRouter,
}
