import { TEST_ADDRESS } from '@hemilabs/anvil-fork-setup/utils'
import { expect } from '@playwright/test'
import { formatEvmAddress } from 'utils/format'

import { test } from './fixtures/wallet'

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
      .getByText('1,000', { exact: true }),
  ).toBeVisible()
})
