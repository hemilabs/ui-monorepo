import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import {
  isAddress,
  parseAbiItem,
  parseEther,
  type Address,
  type Hex,
} from 'viem'

import { scriptArgs } from './cli.ts'
import { DEFAULT_DEPLOYER_PK, DEFAULT_FORK_URL } from './constants.ts'
import { buildClients } from './rpcClients.ts'

const mintAbi = parseAbiItem('function mint(address,uint256)')

function printUsage() {
  console.error(
    'Usage: pnpm --filter portal sandbox:hemi-earn -- mint --token 0x... --to 0x... [--amount 10] [flags]',
  )
  console.error('  -t, --token TOKEN       ERC20-mock address (required)')
  console.error('      --to RECIPIENT      recipient address (required)')
  console.error('  -n, --amount AMOUNT     amount in ether units (default 10)')
  console.error(
    '  [-f FORK_URL]           anvil RPC (default http://127.0.0.1:8545)',
  )
  console.error('  [--deployer-pk PK]      signer for the mint tx')
}

function parseMintArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      'amount': { short: 'n', type: 'string' },
      'deployer-pk': { type: 'string' },
      'fork-url': { short: 'f', type: 'string' },
      'to': { type: 'string' },
      'token': { short: 't', type: 'string' },
    },
    strict: true,
  })

  const token = values.token
  const to = values.to
  if (!token || !isAddress(token, { strict: false })) {
    console.error('✗ --token must be a valid address')
    printUsage()
    process.exit(1)
  }
  if (!to || !isAddress(to, { strict: false })) {
    console.error('✗ --to must be a valid address')
    printUsage()
    process.exit(1)
  }

  const deployerPk = (values['deployer-pk'] ?? DEFAULT_DEPLOYER_PK) as Hex
  if (!/^0x[0-9a-fA-F]{64}$/.test(deployerPk)) {
    console.error(
      '✗ --deployer-pk must be a 32-byte hex string starting with 0x',
    )
    printUsage()
    process.exit(1)
  }

  return {
    amount: parseEther(values.amount ?? '10'),
    amountLabel: values.amount ?? '10',
    deployerPk,
    forkUrl: values['fork-url'] ?? DEFAULT_FORK_URL,
    to: to as Address,
    token: token as Address,
  }
}

export async function runMint(argv: string[]) {
  const parsed = parseMintArgs(argv)
  const { publicClient, walletClient } = await buildClients({
    deployerPk: parsed.deployerPk,
    forkUrl: parsed.forkUrl,
  })
  const account = walletClient.account
  if (!account) {
    throw new Error(
      'buildClients did not return an account — check --deployer-pk',
    )
  }

  const hash = await walletClient.writeContract({
    abi: [mintAbi],
    account,
    address: parsed.token,
    args: [parsed.to, parsed.amount],
    chain: walletClient.chain,
    functionName: 'mint',
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success') {
    throw new Error(`mint reverted (tx ${hash})`)
  }

  console.log(
    `✓ minted ${parsed.amountLabel} to ${parsed.to} (token ${parsed.token}, tx ${hash})`,
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await runMint(scriptArgs())
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`\n✗ mint failed: ${message}`)
    process.exit(1)
  }
}
