import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import {
  parseAbiItem,
  type Abi,
  type ContractFunctionArgs,
  type ContractFunctionName,
  type Hex,
} from 'viem'

import { scriptArgs } from './cli.ts'
import {
  DEFAULT_DEPLOYER_PK,
  DEFAULT_FORK_URL,
  GATEWAY_PROD,
} from './constants.ts'
import { buildClients } from './rpcClients.ts'

const MODE_NAMES = ['NONE', 'SLIPPAGE', 'FEE', 'UNKNOWN'] as const
type ModeName = (typeof MODE_NAMES)[number]

const MODE_ARG_TO_UINT: Record<string, number> = {
  fee: 2,
  slippage: 1,
  unknown: 3,
}

const shouldFailDepositAbi = parseAbiItem(
  'function shouldFailDeposit() view returns (bool)',
)
const shouldFailRedeemAbi = parseAbiItem(
  'function shouldFailRedeem() view returns (bool)',
)
const depositFailureModeAbi = parseAbiItem(
  'function depositFailureMode() view returns (uint8)',
)
const redeemFailureModeAbi = parseAbiItem(
  'function redeemFailureMode() view returns (uint8)',
)
const setShouldFailDepositAbi = parseAbiItem(
  'function setShouldFailDeposit(bool)',
)
const setShouldFailRedeemAbi = parseAbiItem(
  'function setShouldFailRedeem(bool)',
)
const setDepositFailureModeAbi = parseAbiItem(
  'function setDepositFailureMode(uint8)',
)
const setRedeemFailureModeAbi = parseAbiItem(
  'function setRedeemFailureMode(uint8)',
)

function printUsage() {
  console.error(
    'Usage: pnpm --filter portal sandbox:hemi-earn -- fail-gateway --status',
  )
  console.error(
    '   or: pnpm --filter portal sandbox:hemi-earn -- fail-gateway --kind <deposit|redeem> --mode <off|on|slippage|fee|unknown> [flags]',
  )
  console.error(
    '  -k, --kind KIND         deposit | redeem (required when not --status)',
  )
  console.error(
    '  -m, --mode MODE         off | on | slippage | fee | unknown (required when not --status)',
  )
  console.error(
    '  [--status]              print current failure state and exit',
  )
  console.error(
    '  [-f FORK_URL]           anvil RPC (default http://127.0.0.1:8545)',
  )
  console.error('  [--deployer-pk PK]      signer for setter txs')
}

const KIND_VALUES = ['deposit', 'redeem'] as const
type Kind = (typeof KIND_VALUES)[number]
const MODE_VALUES = ['off', 'on', 'slippage', 'fee', 'unknown'] as const
type Mode = (typeof MODE_VALUES)[number]

const isKind = (v: unknown): v is Kind =>
  (KIND_VALUES as readonly string[]).includes(v as string)
const isMode = (v: unknown): v is Mode =>
  (MODE_VALUES as readonly string[]).includes(v as string)

function parseFailGatewayArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      'deployer-pk': { type: 'string' },
      'fork-url': { short: 'f', type: 'string' },
      'kind': { short: 'k', type: 'string' },
      'mode': { short: 'm', type: 'string' },
      'status': { type: 'boolean' },
    },
    strict: true,
  })

  const forkUrl = values['fork-url'] ?? DEFAULT_FORK_URL

  if (values.status === true) {
    if (values.kind !== undefined || values.mode !== undefined) {
      console.error('✗ --status is read-only; drop --kind / --mode to use it')
      printUsage()
      process.exit(1)
    }
    // --status is read-only, so any user-supplied --deployer-pk is unused;
    // fall back to the default so a stale env var can't gate the read.
    return {
      deployerPk: DEFAULT_DEPLOYER_PK as Hex,
      forkUrl,
      status: true as const,
    }
  }

  const deployerPk = (values['deployer-pk'] ?? DEFAULT_DEPLOYER_PK) as Hex
  if (!/^0x[0-9a-fA-F]{64}$/.test(deployerPk)) {
    console.error(
      '✗ --deployer-pk must be a 32-byte hex string starting with 0x',
    )
    printUsage()
    process.exit(1)
  }

  if (!isKind(values.kind) || !isMode(values.mode)) {
    printUsage()
    process.exit(1)
  }

  return {
    deployerPk,
    forkUrl,
    kind: values.kind,
    mode: values.mode,
    status: false as const,
  }
}

type PublicClient = Awaited<ReturnType<typeof buildClients>>['publicClient']
type WalletClient = Awaited<ReturnType<typeof buildClients>>['walletClient']

async function writeAndWait<
  const TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
>({
  abi,
  account,
  args,
  functionName,
  publicClient,
  walletClient,
}: {
  abi: TAbi
  account: NonNullable<WalletClient['account']>
  args: ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName>
  functionName: TFunctionName
  publicClient: PublicClient
  walletClient: WalletClient
}) {
  // Internal cast bridges viem's Widen<>-wrapped args; callers still get the
  // full abi/functionName/args tuple check at writeAndWait's signature.
  const hash = await walletClient.writeContract({
    abi: abi as Abi,
    account,
    address: GATEWAY_PROD,
    args: args as never,
    chain: walletClient.chain,
    functionName: functionName as never,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success') {
    throw new Error(`${String(functionName)} reverted (tx ${hash})`)
  }
}

async function readStatus(publicClient: PublicClient) {
  const [deposit, redeem, depositMode, redeemMode] = await Promise.all([
    publicClient.readContract({
      abi: [shouldFailDepositAbi],
      address: GATEWAY_PROD,
      functionName: 'shouldFailDeposit',
    }),
    publicClient.readContract({
      abi: [shouldFailRedeemAbi],
      address: GATEWAY_PROD,
      functionName: 'shouldFailRedeem',
    }),
    publicClient.readContract({
      abi: [depositFailureModeAbi],
      address: GATEWAY_PROD,
      functionName: 'depositFailureMode',
    }),
    publicClient.readContract({
      abi: [redeemFailureModeAbi],
      address: GATEWAY_PROD,
      functionName: 'redeemFailureMode',
    }),
  ])
  return { deposit, depositMode, redeem, redeemMode }
}

function formatStatus(s: {
  deposit: boolean
  depositMode: number
  redeem: boolean
  redeemMode: number
}) {
  const depositName: ModeName = MODE_NAMES[s.depositMode] ?? 'NONE'
  const redeemName: ModeName = MODE_NAMES[s.redeemMode] ?? 'NONE'
  return (
    `PreviewableGatewayMock @ ${GATEWAY_PROD}\n` +
    `  deposit=${s.deposit} depositMode=${depositName}\n` +
    `  redeem=${s.redeem} redeemMode=${redeemName}`
  )
}

async function clearLegacyIfSet({
  account,
  kind,
  publicClient,
  walletClient,
}: {
  account: NonNullable<WalletClient['account']>
  kind: Kind
  publicClient: PublicClient
  walletClient: WalletClient
}) {
  const currentBool = await publicClient.readContract({
    abi: [kind === 'deposit' ? shouldFailDepositAbi : shouldFailRedeemAbi],
    address: GATEWAY_PROD,
    functionName: kind === 'deposit' ? 'shouldFailDeposit' : 'shouldFailRedeem',
  })
  if (!currentBool) return
  await writeAndWait({
    abi: [
      kind === 'deposit' ? setShouldFailDepositAbi : setShouldFailRedeemAbi,
    ],
    account,
    args: [false],
    functionName:
      kind === 'deposit' ? 'setShouldFailDeposit' : 'setShouldFailRedeem',
    publicClient,
    walletClient,
  })
}

// The enum takes precedence over the legacy bool in the .sol, so leaving a
// stale `SLIPPAGE`/`FEE`/`UNKNOWN` behind while the caller asks for `--mode on`
// would produce the wrong revert shape. Mirror `clearLegacyIfSet` for the mode.
async function clearModeIfSet({
  account,
  kind,
  publicClient,
  walletClient,
}: {
  account: NonNullable<WalletClient['account']>
  kind: Kind
  publicClient: PublicClient
  walletClient: WalletClient
}) {
  const currentMode = await publicClient.readContract({
    abi: [kind === 'deposit' ? depositFailureModeAbi : redeemFailureModeAbi],
    address: GATEWAY_PROD,
    functionName:
      kind === 'deposit' ? 'depositFailureMode' : 'redeemFailureMode',
  })
  if (currentMode === 0) return
  await writeAndWait({
    abi: [
      kind === 'deposit' ? setDepositFailureModeAbi : setRedeemFailureModeAbi,
    ],
    account,
    args: [0],
    functionName:
      kind === 'deposit' ? 'setDepositFailureMode' : 'setRedeemFailureMode',
    publicClient,
    walletClient,
  })
}

// Write the target slot BEFORE clearing the opposite slot. If the trailing
// clear reverts (transient anvil hiccup, gas issue), the mock stays in a
// failure state — a clear-first order would leave it fully-passing on the
// same revert, silently doing the opposite of what the caller asked for.
async function applyFailure({
  account,
  kind,
  mode,
  publicClient,
  walletClient,
}: {
  account: NonNullable<WalletClient['account']>
  kind: Kind
  mode: Mode
  publicClient: PublicClient
  walletClient: WalletClient
}) {
  if (mode === 'on') {
    await writeAndWait({
      abi: [
        kind === 'deposit' ? setShouldFailDepositAbi : setShouldFailRedeemAbi,
      ],
      account,
      args: [true],
      functionName:
        kind === 'deposit' ? 'setShouldFailDeposit' : 'setShouldFailRedeem',
      publicClient,
      walletClient,
    })
    await clearModeIfSet({ account, kind, publicClient, walletClient })
    console.log(`✓ ${kind} legacy failure ON`)
    return
  }

  const uint = mode === 'off' ? 0 : MODE_ARG_TO_UINT[mode]
  await writeAndWait({
    abi: [
      kind === 'deposit' ? setDepositFailureModeAbi : setRedeemFailureModeAbi,
    ],
    account,
    args: [uint],
    functionName:
      kind === 'deposit' ? 'setDepositFailureMode' : 'setRedeemFailureMode',
    publicClient,
    walletClient,
  })
  await clearLegacyIfSet({ account, kind, publicClient, walletClient })

  const modeName: ModeName = MODE_NAMES[uint] ?? 'NONE'
  console.log(`✓ ${kind}FailureMode=${modeName}`)
}

export async function runFailGateway(argv: string[]) {
  const parsed = parseFailGatewayArgs(argv)
  const { publicClient, walletClient } = await buildClients({
    deployerPk: parsed.deployerPk,
    forkUrl: parsed.forkUrl,
  })

  if (parsed.status) {
    const status = await readStatus(publicClient)
    console.log(formatStatus(status))
    return
  }

  const account = walletClient.account
  if (!account) {
    throw new Error(
      'buildClients did not return an account — check --deployer-pk',
    )
  }
  await applyFailure({
    account,
    kind: parsed.kind,
    mode: parsed.mode,
    publicClient,
    walletClient,
  })
  const status = await readStatus(publicClient)
  console.log(formatStatus(status))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await runFailGateway(scriptArgs())
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`\n✗ fail-gateway failed: ${message}`)
    process.exit(1)
  }
}
