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

const stamp = () => new Date().toTimeString().slice(0, 8)
const log = (msg: string) => console.log(`[${stamp()}] [autoclaim] ${msg}`)
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
  console.error('  [--deployer-pk PK]      signer for claimUnstake txs')
  console.error(
    `  [--poll N]              poll interval in seconds (default ${DEFAULT_POLL_SECS})`,
  )
  console.error(
    '  [--disable-autoclaim]   observe UnstakeRequested but skip claim (keeper-offline sim)',
  )
}

function parseRelayerArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      'agent': { short: 'a', type: 'string' },
      'deployer-pk': { type: 'string' },
      'disable-autoclaim': { type: 'boolean' },
      'fork-url': { short: 'f', type: 'string' },
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
    pollMs: Math.round(pollSecs * 1000),
    router,
  }
}

export async function runRelayer(argv: string[]) {
  const { agent, deployerPk, disableAutoclaim, forkUrl, pollMs, router } =
    parseRelayerArgs(argv)
  const { publicClient, walletClient } = await buildClients({
    deployerPk,
    forkUrl,
  })
  const account = walletClient.account!

  log(`starting against ${forkUrl}`)
  log(`  router=${router}`)
  log(`  agent=${agent}`)
  log(`  poll=${pollMs / 1000}s${disableAutoclaim ? ' · autoclaim=OFF' : ''}`)

  const queue = new Map<string, bigint>()
  const processed = new Set<string>()
  let lastBlock = await publicClient.getBlockNumber()
  log(`starting from block ${lastBlock}`)

  function enqueue(id: bigint, claimableAt: bigint) {
    const key = id.toString()
    if (processed.has(key) || queue.has(key)) return
    if (disableAutoclaim) {
      processed.add(key)
      log(`observed requestId=${id} claimableAt=${claimableAt} (autoclaim OFF)`)
      return
    }
    queue.set(key, claimableAt)
    log(`queued requestId=${id} claimableAt=${claimableAt}`)
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
      log(`claimed requestId=${id} (tx ${hash.slice(0, 14)}…)`)
      processed.add(key)
      queue.delete(key)
    } catch (err) {
      const raw = (err as Error).message ?? ''
      const oneLine = raw.split('\n')[0].slice(0, 200)

      if (raw.includes('UnstakeRequestNotFound')) {
        log(`requestId=${id} already claimed elsewhere — dropping`)
        processed.add(key)
        queue.delete(key)
        return
      }
      log(`claim failed requestId=${id}: ${oneLine}`)
    }
  }

  async function scanAndDrain() {
    const head = await publicClient.getBlockNumber()
    if (head > lastBlock) {
      const logs = await publicClient.getLogs({
        address: agent,
        event: unstakeRequestedAbi,
        fromBlock: lastBlock + 1n,
        toBlock: head,
      })
      for (const entry of logs) {
        enqueue(entry.args.requestId!, entry.args.claimableAt!)
      }
      lastBlock = head
    }

    if (queue.size === 0) return
    // On-chain time (not `Date.now()`) so `evm_increaseTime` in tests takes
    // effect on the maturity check.
    const block = await publicClient.getBlock()
    for (const [key, claimableAt] of [...queue.entries()]) {
      if (claimableAt > block.timestamp) continue
      if (processed.has(key)) {
        queue.delete(key)
        continue
      }
      await claimOne(BigInt(key))
    }
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
      log(`tick error: ${msg}`)
    }
    await sleep(pollMs)
  }
  log('shutting down')
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
