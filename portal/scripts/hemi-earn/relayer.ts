import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { isAddress, parseAbiItem, type Address, type Hex } from 'viem'

import { scriptArgs } from './cli.ts'
import { DEFAULT_DEPLOYER_PK, DEFAULT_FORK_URL } from './constants.ts'
import { buildClients } from './rpcClients.ts'

const DEFAULT_POLL_SECS = 1

const unstakeRequestedAbi = parseAbiItem(
  'event UnstakeRequested(uint256 indexed requestId, uint256 claimableAt)',
)
const claimUnstakeAbi = parseAbiItem(
  'function claimUnstake(uint256 requestId) payable',
)
const cancellationRequestedAbi = parseAbiItem(
  'event CancellationRequested(uint256 indexed requestId)',
)
const agentCancelAbi = parseAbiItem(
  'function cancel(uint256 requestId) payable',
)

const stamp = () => new Date().toTimeString().slice(0, 8)
const log = (tag: string, msg: string) =>
  console.log(`[${stamp()}] [${tag}] ${msg}`)
const sleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms))

function printUsage() {
  console.error(
    'Usage: pnpm --filter portal sandbox:hemi-earn -- relayer --router 0x… --agent 0x… [flags]',
  )
  console.error(
    '  -r, --router ADDR       Router address printed by setup (required)',
  )
  console.error(
    '  -a, --agent ADDR        Agent address printed by setup (required)',
  )
  console.error(
    '  [-f FORK_URL]           anvil RPC (default http://127.0.0.1:8545)',
  )
  console.error('  [--deployer-pk PK]      signer for keeper txs')
  console.error(
    `  [--poll N]              poll interval in seconds (default ${DEFAULT_POLL_SECS})`,
  )
  console.error(
    '  [--from-block N]        first block to scan for keeper events (default 0 — full backfill)',
  )
  console.error(
    '  [--disable-autoclaim]   observe UnstakeRequested but skip claim (keeper-offline sim)',
  )
}

function parseFromBlock(raw: string | undefined): bigint {
  if (raw === undefined) return 0n
  try {
    const parsed = BigInt(raw)
    if (parsed < 0n) throw new Error('negative')
    return parsed
  } catch {
    printUsage()
    return process.exit(1)
  }
}

function parseRelayerArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      'agent': { short: 'a', type: 'string' },
      'deployer-pk': { type: 'string' },
      'disable-autoclaim': { type: 'boolean' },
      'fork-url': { short: 'f', type: 'string' },
      'from-block': { type: 'string' },
      'poll': { type: 'string' },
      'router': { short: 'r', type: 'string' },
    },
    strict: true,
  })

  const router = values.router as Address | undefined
  const agent = values.agent as Address | undefined
  if (!router || !agent || !isAddress(router) || !isAddress(agent)) {
    printUsage()
    process.exit(1)
  }
  const pollSecs = values.poll ? Number(values.poll) : DEFAULT_POLL_SECS
  if (!Number.isFinite(pollSecs) || pollSecs <= 0) {
    printUsage()
    process.exit(1)
  }

  return {
    agent,
    deployerPk:
      (values['deployer-pk'] as Hex | undefined) ?? DEFAULT_DEPLOYER_PK,
    disableAutoclaim: values['disable-autoclaim'] === true,
    forkUrl: values['fork-url'] ?? DEFAULT_FORK_URL,
    fromBlock: parseFromBlock(values['from-block']),
    pollMs: Math.round(pollSecs * 1000),
    router,
  }
}

export async function runRelayer(argv: string[]) {
  const {
    agent,
    deployerPk,
    disableAutoclaim,
    forkUrl,
    fromBlock,
    pollMs,
    router,
  } = parseRelayerArgs(argv)
  const { publicClient, walletClient } = await buildClients({
    deployerPk,
    forkUrl,
  })
  const account = walletClient.account!

  log('relayer', `starting against ${forkUrl}`)
  log('relayer', `  router=${router}`)
  log('relayer', `  agent=${agent}`)
  log(
    'relayer',
    `  poll=${pollMs / 1000}s${disableAutoclaim ? ' · autoclaim=OFF' : ''}`,
  )

  const claimQueue = new Map<string, bigint>()
  const claimProcessed = new Set<string>()
  const cancelQueue = new Set<string>()
  const cancelProcessed = new Set<string>()
  // fromBlock - 1n so the initial scan (fromBlock+1..head) starts at fromBlock.
  let lastBlock = fromBlock === 0n ? -1n : fromBlock - 1n
  log('relayer', `scanning from block ${fromBlock}`)

  function enqueueClaim(id: bigint, claimableAt: bigint) {
    const key = id.toString()
    if (claimProcessed.has(key) || claimQueue.has(key)) return
    if (disableAutoclaim) {
      claimProcessed.add(key)
      log(
        'autoclaim',
        `observed requestId=${id} claimableAt=${claimableAt} (autoclaim OFF)`,
      )
      return
    }
    claimQueue.set(key, claimableAt)
    log('autoclaim', `queued requestId=${id} claimableAt=${claimableAt}`)
  }

  function enqueueCancel(id: bigint) {
    const key = id.toString()
    if (cancelProcessed.has(key) || cancelQueue.has(key)) return
    cancelQueue.add(key)
    log('cancel', `queued cancel requestId=${id}`)
  }

  async function claimOne(id: bigint) {
    const key = id.toString()
    try {
      const hash = await walletClient.writeContract({
        abi: [claimUnstakeAbi],
        account,
        address: agent,
        args: [id],
        chain: walletClient.chain,
        functionName: 'claimUnstake',
      })
      await publicClient.waitForTransactionReceipt({ hash })
      log('autoclaim', `claimed requestId=${id} (tx ${hash.slice(0, 14)}…)`)
      claimProcessed.add(key)
      claimQueue.delete(key)
    } catch (err) {
      const raw = (err as Error).message ?? ''
      const oneLine = raw.split('\n')[0].slice(0, 200)

      if (raw.includes('UnstakeRequestNotFound')) {
        log('autoclaim', `requestId=${id} already claimed elsewhere — dropping`)
        claimProcessed.add(key)
        claimQueue.delete(key)
        return
      }
      log('autoclaim', `claim failed requestId=${id}: ${oneLine}`)
    }
  }

  async function cancelOne(id: bigint) {
    const key = id.toString()
    try {
      const hash = await walletClient.writeContract({
        abi: [agentCancelAbi],
        account,
        address: agent,
        args: [id],
        chain: walletClient.chain,
        functionName: 'cancel',
      })
      await publicClient.waitForTransactionReceipt({ hash })
      log('cancel', `cancelled requestId=${id} (tx ${hash.slice(0, 14)}…)`)
    } catch (err) {
      const oneLine = ((err as Error).message ?? '')
        .split('\n')[0]
        .slice(0, 200)
      log('cancel', `cancel failed requestId=${id}: ${oneLine}`)
    } finally {
      // one-shot regardless: on failure the user re-triggers from the UI
      // (a fresh CancellationRequested lands on the next tick).
      cancelProcessed.add(key)
      cancelQueue.delete(key)
    }
  }

  async function scanEvents() {
    const head = await publicClient.getBlockNumber()
    if (head <= lastBlock) return
    const [unstakeLogs, cancelLogs] = await Promise.all([
      publicClient.getLogs({
        address: agent,
        event: unstakeRequestedAbi,
        fromBlock: lastBlock + 1n,
        toBlock: head,
      }),
      publicClient.getLogs({
        address: router,
        event: cancellationRequestedAbi,
        fromBlock: lastBlock + 1n,
        toBlock: head,
      }),
    ])
    for (const entry of unstakeLogs) {
      enqueueClaim(entry.args.requestId!, entry.args.claimableAt!)
    }
    for (const entry of cancelLogs) {
      enqueueCancel(entry.args.requestId!)
    }
    lastBlock = head
  }

  async function drainCancels() {
    for (const key of [...cancelQueue]) {
      if (cancelProcessed.has(key)) {
        cancelQueue.delete(key)
        continue
      }
      await cancelOne(BigInt(key))
    }
  }

  async function drainAutoclaim() {
    if (claimQueue.size === 0) return
    // On-chain time (not `Date.now()`) so `evm_increaseTime` in tests takes
    // effect on the maturity check.
    const block = await publicClient.getBlock()
    for (const [key, claimableAt] of [...claimQueue.entries()]) {
      if (claimableAt > block.timestamp) continue
      if (claimProcessed.has(key)) {
        claimQueue.delete(key)
        continue
      }
      await claimOne(BigInt(key))
    }
  }

  async function scanAndDrain() {
    await scanEvents()
    await drainCancels()
    await drainAutoclaim()
  }

  let stopped = false
  const stop = () => (stopped = true)
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)

  while (!stopped) {
    try {
      await scanAndDrain()
    } catch (err) {
      const msg = (err as Error).message?.split('\n')[0].slice(0, 120) ?? ''
      log('relayer', `tick error: ${msg}`)
    }
    await sleep(pollMs)
  }
  log('relayer', 'shutting down')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await runRelayer(scriptArgs())
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`\n✗ relayer failed: ${message}`)
    process.exit(1)
  }
}
