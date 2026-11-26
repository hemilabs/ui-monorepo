import { TEST_ADDRESS } from '@hemilabs/anvil-fork-setup/utils'
import { expect } from '@playwright/test'
import { hemi } from 'hemi-viem'
import { createFormatter, formatEvmAddress } from 'utils/format'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { getLockedBalance } from 've-hemi-actions/actions'
import { formatUnits, parseAbi, parseUnits } from 'viem'
import { getBlockNumber, getContractEvents, readContract } from 'viem/actions'
import { balanceOf } from 'viem-erc20/actions'

import { createHemiClient } from './anvil'
import { test } from './fixtures/wallet'
import { fundedHemiBalance, hemiTokenAddress } from './hemiToken'

const veHemiAbi = parseAbi([
  'event Lock(address indexed provider, address indexed account, uint256 indexed tokenId, uint256 value, uint256 ts, uint256 lockDuration, uint256 type, bool transferable, bool forfeitable)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
])
const veHemiAddress = getVeHemiContractAddress(hemi.id)

const { formatNumber } = createFormatter('en')
const formatHemi = (amount: bigint) => formatNumber(formatUnits(amount, 18))

test('connects the wallet and reads its HEMI balance from the fork', async function ({
  page,
}) {
  await page.goto('/en/hemi-stake')

  await expect(
    page.getByRole('button', { name: formatEvmAddress(TEST_ADDRESS) }),
  ).toBeVisible()
  await expect(
    page
      .getByText('Balance:')
      .locator('..')
      .getByText(formatHemi(fundedHemiBalance), { exact: true }),
  ).toBeVisible()
})

test('creates a lock from the form', async function ({ page }) {
  const client = createHemiClient()
  const amount = parseUnits('25', 18)
  const countLocks = () =>
    readContract(client, {
      abi: veHemiAbi,
      address: veHemiAddress,
      args: [TEST_ADDRESS],
      functionName: 'balanceOf',
    })
  const getHemiBalance = () =>
    balanceOf(client, { account: TEST_ADDRESS, address: hemiTokenAddress })
  const [fromBlock, locksBefore, hemiBefore] = await Promise.all([
    getBlockNumber(client),
    countLocks(),
    getHemiBalance(),
  ])

  await page.goto('/en/hemi-stake')
  const amountInput = page.getByLabel('Amount')
  await amountInput.fill(formatUnits(amount, 18))
  await page.getByRole('button', { name: /^1 year/ }).click()
  await page.getByRole('button', { name: 'Approve and Stake' }).click()

  await expect(amountInput).toHaveValue('0')
  await expect.poll(countLocks).toBe(locksBefore + BigInt(1))
  const tokenId = await readContract(client, {
    abi: veHemiAbi,
    address: veHemiAddress,
    args: [TEST_ADDRESS, locksBefore],
    functionName: 'tokenOfOwnerByIndex',
  })
  const [owner, lockedBalance, lockEvents, hemiAfter] = await Promise.all([
    readContract(client, {
      abi: veHemiAbi,
      address: veHemiAddress,
      args: [tokenId],
      functionName: 'ownerOf',
    }),
    getLockedBalance(client, tokenId),
    getContractEvents(client, {
      abi: veHemiAbi,
      address: veHemiAddress,
      args: { tokenId },
      eventName: 'Lock',
      fromBlock,
    }),
    getHemiBalance(),
  ])

  expect(owner).toBe(TEST_ADDRESS)
  expect(lockedBalance.amount).toBe(amount)
  expect(lockEvents).toHaveLength(1)
  expect(lockEvents[0].args.lockDuration).toBe(BigInt(366 * 86_400))
  expect(hemiAfter).toBe(hemiBefore - amount)
  await expect(
    page.getByRole('cell', {
      name: new RegExp(`(^|\\s)${formatHemi(amount)} HEMI(\\s|$)`),
    }),
  ).toBeVisible()
})
