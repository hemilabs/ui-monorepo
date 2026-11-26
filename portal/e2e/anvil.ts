import { hemi } from 'hemi-viem'
import { createPublicClient, http } from 'viem'

export const anvilPort = 8547
export const anvilUrl = `http://127.0.0.1:${anvilPort}`

export const createHemiClient = () =>
  createPublicClient({ chain: hemi, transport: http(anvilUrl) })
