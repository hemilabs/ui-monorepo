import { type Account, type Chain, type Client, type Transport } from 'viem'

import { getErc20TokenAllowance } from './src/public/allowance'
import { getErc20TokenBalance } from './src/public/balance'
import { approveErc20Token } from './src/wallet/approve'

export const erc20PublicActions =
  () =>
  <
    TTransport extends Transport = Transport,
    TChain extends Chain | undefined = Chain | undefined,
    TAccount extends Account | undefined = Account | undefined,
  >(
    client: Client<TTransport, TChain, TAccount>,
  ) => ({
    getErc20TokenAllowance: (
      params: Parameters<typeof getErc20TokenAllowance>[1],
    ) => getErc20TokenAllowance(client, params),
    getErc20TokenBalance: (
      params: Parameters<typeof getErc20TokenBalance>[1],
    ) => getErc20TokenBalance(client, params),
  })

export const erc20WalletActions = () => (client: Client) => ({
  approveErc20Token: (params: Parameters<typeof approveErc20Token>[1]) =>
    approveErc20Token(client, params),
})
