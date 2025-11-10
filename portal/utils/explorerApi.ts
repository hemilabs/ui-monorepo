import fetchPlusPlus from 'fetch-plus-plus'
import { type Chain } from 'viem'

export const getTokenHolders = ({
  address,
  hemi,
}: {
  address: string
  hemi: Chain
}) =>
  fetchPlusPlus(
    `${hemi.blockExplorers?.default.url}/api/v2/tokens/${address}/counters`,
  ).then(function (res: { token_holders_count: string }) {
    if (res === undefined || res.token_holders_count === undefined) {
      throw new Error('Invalid token holders from block explorer')
    }
    return Number(res.token_holders_count)
  })
