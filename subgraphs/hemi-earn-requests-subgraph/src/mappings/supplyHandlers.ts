import { type EvmOnBlockHandlerArgs, createEffect, indexer, S } from 'envio'
import {
  type Address,
  type Chain,
  type PublicClient,
  createPublicClient,
  erc20Abi,
  http,
  withRetry,
} from 'viem'
import { getBlock, multicall } from 'viem/actions'
import { bsc, hemi, mainnet } from 'viem/chains'

type Snapshot = {
  bnbSafe?: bigint
  burned?: bigint
  ethSafe?: bigint
  hemiSafe?: bigint
  locked?: bigint
  merkle?: bigint
  opBalances?: bigint
  totalSupply?: bigint
}

const hemiToken: Record<Chain['id'], Address> = {
  [bsc.id]: '0x5ffd0eadc186af9512542d0d5e5eafc65d5afc5b',
  [hemi.id]: '0x99e3dE3817F6081B2568208337ef83295b7f591D',
  [mainnet.id]: '0xEb964A1A6fAB73b8c72A0D15c7337fA4804F484d',
}

const { chains } = indexer

const accountsByChain: Record<
  Chain['id'],
  { account?: string; name: keyof Snapshot }[]
> = {
  [bsc.id]: [{ account: chains[bsc.id].Safe.addresses[0], name: 'bnbSafe' }],
  [hemi.id]: [
    { account: chains[hemi.id].Safe.addresses[0], name: 'hemiSafe' },
    { account: chains[hemi.id].VeHemi.addresses[0], name: 'locked' },
    { account: chains[hemi.id].MerkleBox.addresses[0], name: 'merkle' },
    // There's a bug in envio that lists addresses twice
    // Drop the set once we bump to https://github.com/enviodev/hyperindex/releases/tag/v3.9.0
    // See https://github.com/hemilabs/ui-monorepo/issues/2285
    ...[...new Set(chains[hemi.id].OpAddresses.addresses)].map(account => ({
      account,
      name: 'opBalances' as const,
    })),
  ],
  [mainnet.id]: [
    { name: 'totalSupply' },
    { account: chains[mainnet.id].Safe.addresses[0], name: 'ethSafe' },
    { account: chains[mainnet.id].Dead.addresses[0], name: 'burned' },
  ],
}

const toContracts = (chainId: Chain['id']) =>
  accountsByChain[chainId].map(({ account }) => ({
    abi: erc20Abi,
    address: hemiToken[chainId],
    args: account ? [account as Address] : [],
    functionName: account ? 'balanceOf' : 'totalSupply',
  }))

const contractsByChain: Record<Chain['id'], ReturnType<typeof toContracts>> = {
  [bsc.id]: toContracts(bsc.id),
  [hemi.id]: toContracts(hemi.id),
  [mainnet.id]: toContracts(mainnet.id),
}

export const toDate = (timestamp: number) =>
  new Date(timestamp * 1000).toISOString().slice(0, 10)

export const toSnapshot = (chainId: Chain['id'], values: bigint[]) =>
  accountsByChain[chainId].reduce<Snapshot>(
    (snapshot, { name }, index) => ({
      ...snapshot,
      [name]: (snapshot[name] ?? 0n) + values[index],
    }),
    {},
  )

export const endOfDay = (date: string) =>
  Date.parse(`${date}T00:00:00Z`) / 1000 + 24 * 60 * 60

// Multicall3 lives at the same address on every chain
const multicallAddress = '0xcA11bde05977b3631167028862bE2a173976CA11'

const rpcUrls: Record<Chain['id'], string | undefined> = {
  [bsc.id]: process.env.ENVIO_RPC_URL_BNB,
  [hemi.id]: process.env.ENVIO_RPC_URL_HEMI,
  [mainnet.id]: process.env.ENVIO_RPC_URL_ETH,
}

const clients = Object.fromEntries(
  [bsc, hemi, mainnet].map(chain => [
    chain.id,
    createPublicClient({
      chain,
      transport: http(rpcUrls[chain.id], { batch: true, timeout: 30000 }),
    }),
  ]),
) as Record<Chain['id'], PublicClient>

// with backoff
const retry = <T>(fn: () => Promise<T>) =>
  withRetry(fn, { delay: ({ count }) => 2 ** count * 1000, retryCount: 3 })

const llamaChainByChain: Record<Chain['id'], string> = {
  [bsc.id]: 'bsc',
  [hemi.id]: 'hemi',
  [mainnet.id]: 'ethereum',
}

// Shared by the chains. The public RPCs reject faster reads.
const rateLimit = { calls: 2, per: 'second' } as const

// About 5 minutes of blocks on each chain, for the snapshots at the head
const realtimeStride: Record<Chain['id'], number> = {
  [bsc.id]: 667,
  [hemi.id]: 25,
  [mainnet.id]: 25,
}

// Just under a day of blocks on each chain, so no past day is skipped. BNB
// Chain's stride is sized for its 0.75s blocks before January 2026.
const historicalStride: Record<Chain['id'], number> = {
  [bsc.id]: 110000,
  [hemi.id]: 7000,
  [mainnet.id]: 7000,
}

const realtimeStartBlock: Record<Chain['id'], string | undefined> = {
  [bsc.id]: process.env.ENVIO_SUPPLY_REALTIME_START_BLOCK_BNB,
  [hemi.id]: process.env.ENVIO_SUPPLY_REALTIME_START_BLOCK_HEMI,
  [mainnet.id]: process.env.ENVIO_SUPPLY_REALTIME_START_BLOCK_ETH,
}

const blockFieldByChain = {
  [bsc.id]: 'bnbBlock',
  [hemi.id]: 'hemiBlock',
  [mainnet.id]: 'ethBlock',
} as const

const emptySnapshot = {
  bnbSafe: undefined,
  burned: undefined,
  ethSafe: undefined,
  hemiSafe: undefined,
  locked: undefined,
  merkle: undefined,
  opBalances: undefined,
  totalSupply: undefined,
}

const emptyBlocks = {
  bnbBlock: undefined,
  ethBlock: undefined,
  hemiBlock: undefined,
}

const snapshotSchema = {
  bnbSafe: S.optional(S.bigint),
  burned: S.optional(S.bigint),
  ethSafe: S.optional(S.bigint),
  hemiSafe: S.optional(S.bigint),
  locked: S.optional(S.bigint),
  merkle: S.optional(S.bigint),
  opBalances: S.optional(S.bigint),
  totalSupply: S.optional(S.bigint),
}

const readBalances = async function (
  chainId: Chain['id'],
  blockNumber: number,
) {
  const client = clients[chainId]
  const [block, snapshot] = await retry(() =>
    Promise.all([
      getBlock(client, { blockNumber: BigInt(blockNumber) }),
      multicall(client, {
        allowFailure: false,
        blockNumber: BigInt(blockNumber),
        contracts: contractsByChain[chainId],
        multicallAddress,
      }).then(values => toSnapshot(chainId, values as bigint[])),
    ]),
  )
  return {
    snapshot: { ...emptySnapshot, ...snapshot },
    timestamp: Number(block.timestamp),
  }
}

// In order to process historical data and save many RPC calls
// we can get what was the closest block to midnight UTC from defiLlama.
// Note: BNB is so fast that has many blocks per second - any of them works.
// This is, after all, for chart visualization.
const findMidnightBlock = createEffect(
  {
    cache: true,
    input: { chainId: S.int32, time: S.int32 },
    name: 'findMidnightBlock',
    output: S.nullable(S.int32),
    rateLimit,
  },
  async function ({ context, input }) {
    const { chainId, time } = input
    try {
      const { height } = await retry(async function () {
        const res = await fetch(
          `https://coins.llama.fi/block/${llamaChainByChain[chainId]}/${time}`,
        )
        if (!res.ok) {
          throw new Error(`DefiLlama answered ${res.status} ${res.statusText}`)
        }
        return (await res.json()) as { height: number }
      })
      return height
    } catch (error) {
      context.cache = false
      context.log.warn(
        `Failed to find the block at ${time} on chain ${chainId}`,
        error as Error,
      )
      return null
    }
  },
)

const readSnapshot = createEffect(
  {
    input: { blockNumber: S.int32, chainId: S.int32 },
    name: 'readSupplySnapshot',
    output: S.nullable(
      S.schema({ snapshot: snapshotSchema, timestamp: S.int32 }),
    ),
    rateLimit,
  },
  async function ({ context, input }) {
    const { blockNumber, chainId } = input
    try {
      return await readBalances(chainId, blockNumber)
    } catch (error) {
      context.log.warn(
        `Failed to read the HEMI supply of chain ${chainId} at block ${blockNumber}`,
        error as Error,
      )
      return null
    }
  },
)

const readDayEndSnapshot = createEffect(
  {
    input: { blockNumber: S.int32, chainId: S.int32 },
    name: 'readDayEndSupplySnapshot',
    output: S.nullable(
      S.schema({
        blockNumber: S.int32,
        date: S.string,
        snapshot: snapshotSchema,
      }),
    ),
    rateLimit,
  },
  async function ({ context, input }) {
    const { chainId } = input
    try {
      const trigger = await retry(() =>
        getBlock(clients[chainId], { blockNumber: BigInt(input.blockNumber) }),
      )
      const date = toDate(Number(trigger.timestamp))
      const time = endOfDay(date)
      // Today has not closed yet. The realtime snapshots fill it.
      if (time * 1000 > Date.now()) {
        return null
      }
      const blockNumber = await context.effect(findMidnightBlock, {
        chainId,
        time,
      })
      if (blockNumber === null) {
        return null
      }
      const { snapshot } = await readBalances(chainId, blockNumber)
      return { blockNumber, date, snapshot }
    } catch (error) {
      context.log.warn(
        `Failed to read the HEMI supply of chain ${chainId} at the end of the day of block ${input.blockNumber}`,
        error as Error,
      )
      return null
    }
  },
)

const saveSnapshot = async function ({
  blockNumber,
  context,
  date,
  snapshot,
}: {
  blockNumber: number
  context: EvmOnBlockHandlerArgs['context']
  date: string
  snapshot: Snapshot
}) {
  const chainId = context.chain.id
  const daily = await context.DailySupplySnapshot.get(date)
  context.DailySupplySnapshot.set({
    ...emptySnapshot,
    ...emptyBlocks,
    ...daily,
    ...Object.fromEntries(
      accountsByChain[chainId].map(({ name }) => [name, snapshot[name]]),
    ),
    date,
    id: date,
    [blockFieldByChain[chainId]]: blockNumber,
  })
}

indexer.onBlock(
  {
    name: 'supply-historical',
    where: ({ chain }) => ({
      block: { number: { _every: historicalStride[chain.id] } },
    }),
  },
  async function ({ block, context }) {
    if (context.chain.isRealtime) {
      return
    }
    const read = await context.effect(readDayEndSnapshot, {
      blockNumber: block.number,
      chainId: context.chain.id,
    })
    if (read) {
      await saveSnapshot({ ...read, context })
    }
  },
)

indexer.onBlock(
  {
    name: 'supply-realtime',
    where: ({ chain }) => ({
      block: {
        number: {
          _every: realtimeStride[chain.id],
          ...(realtimeStartBlock[chain.id] && {
            _gte: Number(realtimeStartBlock[chain.id]),
          }),
        },
      },
    }),
  },
  async function ({ block, context }) {
    if (!context.chain.isRealtime) {
      return
    }
    const read = await context.effect(readSnapshot, {
      blockNumber: block.number,
      chainId: context.chain.id,
    })
    if (read) {
      await saveSnapshot({
        blockNumber: block.number,
        context,
        date: toDate(read.timestamp),
        snapshot: read.snapshot,
      })
    }
  },
)
