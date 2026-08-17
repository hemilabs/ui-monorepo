import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import {
  isAddress,
  isAddressEqual,
  parseAbiItem,
  zeroAddress,
  type Address,
  type Hex,
} from 'viem'

import { scriptArgs } from './cli.ts'
import { defaultDeployerPk, defaultForkUrl } from './constants.ts'
import { buildClients } from './rpcClients.ts'

const actionValues = ['cancel', 'retry'] as const
type Action = (typeof actionValues)[number]

const isAction = (v: unknown): v is Action =>
  (actionValues as readonly string[]).includes(v as string)

const failedRequestsAbi = parseAbiItem(
  'function failedRequests(uint256) view returns ((address tokenIn, uint256 amountIn, bytes msgIn, uint256 nativeFee))',
)
const unstakeRequestsAbi = parseAbiItem(
  'function unstakeRequests(uint256) view returns ((address share, uint256 shares, address asset, address operator, uint256 amountOutMin, uint256 nativeFee, uint256 unstakingRequestId, uint256 claimableAt))',
)
const agentCancelAbi = parseAbiItem(
  'function cancel(uint256 requestId) payable',
)
const agentRetryAbi = parseAbiItem('function retry(uint256 requestId) payable')

const stamp = () => new Date().toTimeString().slice(0, 8)
const log = (msg: string) => console.log(`[${stamp()}] [keeper] ${msg}`)

function printUsage() {
  console.error(
    'Usage: pnpm --filter portal sandbox:hemi-earn -- keeper --action <cancel|retry> --agent 0x… --request-id N [flags]',
  )
  console.error('  --action ACTION         cancel | retry (required)')
  console.error(
    '  -a, --agent ADDR        Agent address printed by setup (required)',
  )
  console.error(
    '  -i, --request-id ID     uint256 requestId to act on (required)',
  )
  console.error(
    '  [--value WEI]           msg.value in wei (default 0; top-up under strict-fee mode)',
  )
  console.error(
    '  [-f FORK_URL]           anvil RPC (default http://127.0.0.1:8545)',
  )
  console.error(
    '  [--deployer-pk PK]      signer key (default anvil #0, registered as keeper)',
  )
}

function parseNonNegativeBigInt(raw: string, flag: string) {
  try {
    const parsed = BigInt(raw)
    if (parsed < 0n) throw new Error('negative')
    return parsed
  } catch {
    console.error(`✗ ${flag} must be a non-negative integer`)
    printUsage()
    return process.exit(1)
  }
}

function validateDeployerPk(pk: string) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(pk)) {
    console.error(
      '✗ --deployer-pk must be a 32-byte hex string starting with 0x',
    )
    printUsage()
    process.exit(1)
  }
  return pk as Hex
}

function parseKeeperArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      'action': { type: 'string' },
      'agent': { short: 'a', type: 'string' },
      'deployer-pk': { type: 'string' },
      'fork-url': { short: 'f', type: 'string' },
      'request-id': { short: 'i', type: 'string' },
      'value': { type: 'string' },
    },
    strict: true,
  })

  const agent = values.agent as Address | undefined
  const rawId = values['request-id']
  if (!isAction(values.action) || !agent || !isAddress(agent) || !rawId) {
    printUsage()
    process.exit(1)
  }

  return {
    action: values.action,
    agent,
    deployerPk: validateDeployerPk(values['deployer-pk'] ?? defaultDeployerPk),
    forkUrl: values['fork-url'] ?? defaultForkUrl,
    requestId: parseNonNegativeBigInt(rawId, '--request-id'),
    value:
      values.value === undefined
        ? 0n
        : parseNonNegativeBigInt(values.value, '--value'),
  }
}

type PublicClient = Awaited<ReturnType<typeof buildClients>>['publicClient']
type WalletClient = Awaited<ReturnType<typeof buildClients>>['walletClient']

async function readFailedTokenIn({
  agent,
  publicClient,
  requestId,
}: {
  agent: Address
  publicClient: PublicClient
  requestId: bigint
}) {
  const entry = await publicClient.readContract({
    abi: [failedRequestsAbi],
    address: agent,
    args: [requestId],
    functionName: 'failedRequests',
  })
  return entry.tokenIn
}

async function readUnstakeShare({
  agent,
  publicClient,
  requestId,
}: {
  agent: Address
  publicClient: PublicClient
  requestId: bigint
}) {
  const entry = await publicClient.readContract({
    abi: [unstakeRequestsAbi],
    address: agent,
    args: [requestId],
    functionName: 'unstakeRequests',
  })
  return entry.share
}

// Mirror production Agent.cancel dispatch order: failedRequests first, then
// unstakeRequests. Keeps the logged branch matching the on-chain path.
async function runCancel({
  account,
  agent,
  publicClient,
  requestId,
  value,
  walletClient,
}: {
  account: NonNullable<WalletClient['account']>
  agent: Address
  publicClient: PublicClient
  requestId: bigint
  value: bigint
  walletClient: WalletClient
}) {
  const failedTokenIn = await readFailedTokenIn({
    agent,
    publicClient,
    requestId,
  })
  const failedBranch = !isAddressEqual(failedTokenIn, zeroAddress)

  let unstakeBranch = false
  if (!failedBranch) {
    const unstakeShare = await readUnstakeShare({
      agent,
      publicClient,
      requestId,
    })
    unstakeBranch = !isAddressEqual(unstakeShare, zeroAddress)
  }

  if (!failedBranch && !unstakeBranch) {
    throw new Error(
      `request ${requestId} is in neither failedRequests nor unstakeRequests — nothing to cancel.\n` +
        '  Expected either a REMOTE_FAILED request (via `fail-gateway` + submit) or a mid-cooldown redeem.',
    )
  }

  const hash = await walletClient.writeContract({
    abi: [agentCancelAbi],
    account,
    address: agent,
    args: [requestId],
    chain: walletClient.chain,
    functionName: 'cancel',
    value,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success') {
    throw new Error(`Agent.cancel(${requestId}) reverted (tx ${hash})`)
  }

  const branch = failedBranch ? 'FAILED' : 'UNSTAKE'
  log(
    `Agent.cancel(${requestId}) sent — ${branch} branch (tx ${hash.slice(0, 14)}…)`,
  )
  log('  → Envio: RequestCancellationTriggered → RequestCancelled')
  log('  → Portal: CTAs disappear on next refetch; drawer shows Recover')
}

async function runRetry({
  account,
  agent,
  publicClient,
  requestId,
  value,
  walletClient,
}: {
  account: NonNullable<WalletClient['account']>
  agent: Address
  publicClient: PublicClient
  requestId: bigint
  value: bigint
  walletClient: WalletClient
}) {
  const beforeTokenIn = await readFailedTokenIn({
    agent,
    publicClient,
    requestId,
  })
  if (isAddressEqual(beforeTokenIn, zeroAddress)) {
    throw new Error(
      `request ${requestId} is not in failedRequests — nothing to retry.\n` +
        '  Trigger via `fail-gateway --kind <deposit|redeem> --mode <slippage|fee|unknown>` + submit deposit/redeem.',
    )
  }

  const hash = await walletClient.writeContract({
    abi: [agentRetryAbi],
    account,
    address: agent,
    args: [requestId],
    chain: walletClient.chain,
    functionName: 'retry',
    value,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success') {
    throw new Error(`Agent.retry(${requestId}) reverted (tx ${hash})`)
  }

  const afterTokenIn = await readFailedTokenIn({
    agent,
    publicClient,
    requestId,
  })
  if (isAddressEqual(afterTokenIn, zeroAddress)) {
    log(
      `Agent.retry(${requestId}) succeeded — failedRequests cleared (tx ${hash.slice(0, 14)}…)`,
    )
    log(
      '  → Envio: retryCount++, failed=false, status advances (FULFILLED/FINALIZED)',
    )
    log('  → Portal: REMOTE_FAILED CTAs disappear on next refetch')
    return
  }

  log(
    `Agent.retry(${requestId}) fired but failedRequests still populated (tx ${hash.slice(0, 14)}…)`,
  )
  log(
    '  → Underlying failure still active — clear via `fail-gateway --kind X --mode off` first',
  )
}

export async function runKeeper(argv: string[]) {
  const { action, agent, deployerPk, forkUrl, requestId, value } =
    parseKeeperArgs(argv)
  const { publicClient, walletClient } = await buildClients({
    deployerPk,
    forkUrl,
  })
  const account = walletClient.account
  if (!account) {
    throw new Error(
      'buildClients did not return an account — check --deployer-pk',
    )
  }

  log(`action=${action} agent=${agent} requestId=${requestId}`)

  if (action === 'cancel') {
    await runCancel({
      account,
      agent,
      publicClient,
      requestId,
      value,
      walletClient,
    })
    return
  }
  await runRetry({
    account,
    agent,
    publicClient,
    requestId,
    value,
    walletClient,
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await runKeeper(scriptArgs())
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`\n✗ keeper failed: ${message}`)
    process.exit(1)
  }
}
