import { OrderedChains } from 'types/chain'
import { type Chain, fallback, http } from 'viem'

export const buildTransport = function (network: Chain) {
  const httpConfig = {
    batch: { wait: 1000 },
  }
  const rpcUrls = network.rpcUrls.default.http
  if (rpcUrls.length > 1) {
    return fallback(
      rpcUrls.map(rpcUrl => http(rpcUrl, httpConfig), { rank: true }),
    )
  }
  return http(rpcUrls[0], httpConfig)
}

export const buildTransports = (networks: Chain[] | OrderedChains) =>
  Object.fromEntries(networks.map(n => [n.id, buildTransport(n)]))
