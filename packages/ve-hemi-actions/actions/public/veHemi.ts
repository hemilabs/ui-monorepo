import pMemoize from 'promise-mem'
import type { Address, PublicClient, WalletClient } from 'viem'
import { readContract } from 'viem/actions'

import { veHemiAbi } from '../../abi'

import { getVeHemiContractAddress } from './../../constants'

export const getHemiTokenAddress = async function (
  client: PublicClient | WalletClient,
): Promise<Address> {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  const veHemiAddress = getVeHemiContractAddress(client.chain.id)

  // Using @ts-expect-error fails to compile so I need to use @ts-ignore
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
  return readContract(client, {
    abi: veHemiAbi,
    address: veHemiAddress,
    functionName: 'HEMI',
  })
}

export const memoizedGetHemiTokenAddress = pMemoize(getHemiTokenAddress, {
  resolver: w => w.chain?.id,
})

export const getLockedBalance = async function (
  client: PublicClient | WalletClient,
  tokenId: bigint,
) {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  const veHemiAddress = getVeHemiContractAddress(client.chain.id)

  // Using @ts-expect-error fails to compile so I need to use @ts-ignore
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
  return readContract(client, {
    abi: veHemiAbi,
    address: veHemiAddress,
    args: [tokenId],
    functionName: 'getLockedBalance',
  })
}

export const getOwnerOf = async function (
  client: PublicClient | WalletClient,
  tokenId: bigint,
): Promise<Address> {
  if (!client.chain) {
    throw new Error('Client chain is not defined')
  }

  const veHemiAddress = getVeHemiContractAddress(client.chain.id)

  // Using @ts-expect-error fails to compile so I need to use @ts-ignore
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore because it works on IDE, and when building on its own, but fails when compiling from the portal through next
  return readContract(client, {
    abi: veHemiAbi,
    address: veHemiAddress,
    args: [tokenId],
    functionName: 'ownerOf',
  })
}
