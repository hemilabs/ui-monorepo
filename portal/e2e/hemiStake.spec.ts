import { TEST_ADDRESS } from '@hemilabs/anvil-fork-setup/utils'
import { expect, type Locator, type Page } from '@playwright/test'
import { createFormatter, formatEvmAddress } from 'utils/format'
import { MinLockDurationSeconds, snapToEpoch } from 've-hemi-actions'
import { getLockedBalance } from 've-hemi-actions/actions'
import { formatUnits, parseUnits } from 'viem'
import {
  getBlock,
  getBlockNumber,
  getContractEvents,
  readContract,
} from 'viem/actions'
import { balanceOf } from 'viem-erc20/actions'

import { advanceChainTime, createHemiClient } from './anvil'
import { test } from './fixtures/wallet'
import { fundedHemiBalance, hemiTokenAddress } from './hemiToken'
import { createPosition } from './positions'
import { veHemiAbi, veHemiAddress } from './veHemi'

const { formatDate, formatNumber } = createFormatter('en')
const formatHemi = (amount: bigint) => formatNumber(formatUnits(amount, 18))
const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const hemiCell = (amount: bigint) =>
  new RegExp(`(^|\\s)${escapeRegExp(formatHemi(amount))} HEMI(\\s|$)`)

const dispatchClick = async function (button: Locator) {
  await expect(button).toBeVisible()
  await expect(button).toBeEnabled()
  await button.dispatchEvent('click')
}

const openPositionAction = async function (page: Page, action: RegExp) {
  await dispatchClick(page.getByRole('button', { name: 'Position actions' }))
  await dispatchClick(page.getByRole('button', { name: action }))
}

const getDrawer = (page: Page, heading: RegExp) =>
  page
    .getByRole('heading', { name: heading })
    .locator('xpath=ancestor::div[.//form][1]')

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
  await expect(page.getByRole('cell', { name: hemiCell(amount) })).toBeVisible()
})

test('adds HEMI to a lock', async function ({ page, stakingPositions }) {
  const client = createHemiClient()
  const position = await createPosition({
    amount: parseUnits('25', 18),
    lockDurationInSeconds: 366 * 86_400,
  })
  stakingPositions.push(position)
  const tokenId = BigInt(position.tokenId)
  const added = parseUnits('15', 18)
  const getHemiBalance = () =>
    balanceOf(client, { account: TEST_ADDRESS, address: hemiTokenAddress })
  const [lockBefore, hemiBefore] = await Promise.all([
    getLockedBalance(client, tokenId),
    getHemiBalance(),
  ])

  await page.goto('/en/hemi-stake')
  await openPositionAction(page, /^Add \$HEMI to this lockup/)
  const drawer = getDrawer(page, /to this lockup/)
  await drawer.getByLabel('Amount').fill(formatUnits(added, 18))
  await drawer.getByRole('button', { name: 'Approve and Stake' }).click()

  await expect
    .poll(async () => (await getLockedBalance(client, tokenId)).amount)
    .toBe(lockBefore.amount + added)
  const [lockAfter, hemiAfter] = await Promise.all([
    getLockedBalance(client, tokenId),
    getHemiBalance(),
  ])

  expect(lockAfter.end).toBe(lockBefore.end)
  expect(hemiAfter).toBe(hemiBefore - added)
  await expect(
    page.getByRole('cell', { name: hemiCell(lockAfter.amount) }),
  ).toBeVisible()
})

test('adds time to a lock', async function ({ page, stakingPositions }) {
  const client = createHemiClient()
  const position = await createPosition({
    amount: parseUnits('25', 18),
    lockDurationInSeconds: 366 * 86_400,
  })
  stakingPositions.push(position)
  const tokenId = BigInt(position.tokenId)
  const lockBefore = await getLockedBalance(client, tokenId)

  await page.goto('/en/hemi-stake')
  await openPositionAction(page, /^Add time to this lockup/)
  const drawer = getDrawer(page, /^Extend lockup duration$/)
  await drawer.getByText('2 years', { exact: true }).click()
  await expect(drawer.getByRole('textbox')).toHaveValue('732 days')
  await drawer.getByRole('button', { exact: true, name: 'Stake' }).click()

  await expect
    .poll(async () => (await getLockedBalance(client, tokenId)).end)
    .toBeGreaterThan(lockBefore.end)
  const [lockAfter, { timestamp }] = await Promise.all([
    getLockedBalance(client, tokenId),
    getBlock(client),
  ])

  expect(lockAfter.amount).toBe(lockBefore.amount)
  expect(lockAfter.end).toBe(
    BigInt(snapToEpoch(Number(timestamp) + 732 * 86_400)),
  )
  await expect(
    page.getByRole('cell', {
      name: new RegExp(
        escapeRegExp(formatDate(new Date(Number(lockAfter.end) * 1000))),
      ),
    }),
  ).toBeVisible()
})

test('unlocks an expired lock', async function ({ page, stakingPositions }) {
  const client = createHemiClient()
  const amount = parseUnits('25', 18)
  const position = await createPosition({
    amount,
    lockDurationInSeconds: MinLockDurationSeconds,
  })
  stakingPositions.push(position)
  const tokenId = BigInt(position.tokenId)
  const countLocks = () =>
    readContract(client, {
      abi: veHemiAbi,
      address: veHemiAddress,
      args: [TEST_ADDRESS],
      functionName: 'balanceOf',
    })
  const getHemiBalance = () =>
    balanceOf(client, { account: TEST_ADDRESS, address: hemiTokenAddress })
  const [{ end }, { timestamp }, locksBefore, hemiBefore] = await Promise.all([
    getLockedBalance(client, tokenId),
    getBlock(client),
    countLocks(),
    getHemiBalance(),
  ])
  const chainTimestamp = await advanceChainTime(
    Number(end - timestamp) + 86_400,
  )

  await page.clock.setFixedTime(new Date(Number(chainTimestamp) * 1000))
  await page.goto('/en/hemi-stake')
  const unlockButton = page.getByRole('button', { exact: true, name: 'Unlock' })
  await expect(unlockButton).toBeEnabled()
  await unlockButton.click()

  await expect.poll(countLocks).toBe(locksBefore - BigInt(1))
  await expect(
    readContract(client, {
      abi: veHemiAbi,
      address: veHemiAddress,
      args: [tokenId],
      functionName: 'ownerOf',
    }),
  ).rejects.toThrow('ERC721NonexistentToken')
  expect(await getHemiBalance()).toBe(hemiBefore + amount)
  position.status = 'withdrawn'
  const drawerHeading = page.getByRole('heading', {
    name: 'We’re unlocking your tokens',
  })
  await expect(drawerHeading).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(drawerHeading).toBeHidden()
  const positionCell = page.getByRole('cell', { name: hemiCell(amount) })
  await expect(positionCell).toBeHidden()
  await page.getByRole('button', { exact: true, name: 'Burned' }).click()
  await expect(positionCell).toBeVisible()
})
