import { startAnvilFork } from '@hemilabs/anvil-fork-setup'
import { TEST_ADDRESS } from '@hemilabs/anvil-fork-setup/utils'
import { hemi } from 'hemi-viem'
import {
  createTestClient,
  encodeAbiParameters,
  http,
  keccak256,
  parseUnits,
  toHex,
} from 'viem'
import { setStorageAt } from 'viem/actions'

import { anvilPort } from './anvil'

const hemiTokenAddress = '0x99e3dE3817F6081B2568208337ef83295b7f591D'
const fundedHemiBalance = parseUnits('1000', 18)

const getBalanceSlot = (account: `0x${string}`) =>
  keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }],
      [account, BigInt(0)],
    ),
  )

export default async function globalSetup() {
  const { stop, url } = await startAnvilFork({
    chainId: hemi.id,
    forkUrl: process.env.HEMI_FORK_URL ?? hemi.rpcUrls.default.http[0],
    port: anvilPort,
  })
  try {
    await setStorageAt(
      createTestClient({ chain: hemi, mode: 'anvil', transport: http(url) }),
      {
        address: hemiTokenAddress,
        index: getBalanceSlot(TEST_ADDRESS),
        value: toHex(fundedHemiBalance, { size: 32 }),
      },
    )
  } catch (error) {
    await stop()
    throw error
  }
  return stop
}
