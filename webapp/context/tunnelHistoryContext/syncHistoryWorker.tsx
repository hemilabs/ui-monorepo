import { featureFlags } from 'app/featureFlags'
import {
  bitcoin,
  evmRemoteNetworks,
  hemi,
  type RemoteChain,
} from 'app/networks'
import { useAccounts } from 'hooks/useAccounts'
import { useEffect, Children } from 'react'

function processWebWorkerMessage(event: MessageEvent<string>) {
  console.log(event.data)
}

type Props = {
  address: string
  chainId: RemoteChain['id']
}

const WebWorker = function ({ address, chainId }: Props) {
  useEffect(
    function loadWorker() {
      console.log(
        'starting worker for address %s and chainId %s',
        address,
        chainId,
      )
      const worker = new Worker(
        new URL(`../../workers/history.ts`, import.meta.url),
      )
      worker.postMessage({ address, chainId })
      worker.addEventListener('message', processWebWorkerMessage)

      return function () {
        console.log(
          'terminating worker for address %s and chainId %s',
          address,
          chainId,
        )
        worker.removeEventListener('message', processWebWorkerMessage)
        worker.terminate()
      }
    },
    [address, chainId],
  )

  return null
}

export const SyncHistoryWorker = function () {
  // TODO check evmChainId to ensure we're connected to a supported chain
  const { evmChainId, evmAddress, btcAddress } = useAccounts()

  const createWorker = (chainId: RemoteChain['id'], address) => (
    <WebWorker
      address={address}
      chainId={chainId}
      key={`${chainId}_${address}`}
    />
  )

  const workers = []
  // if we're connected to any supported EVM-compatible network, we can use that address as it is shared between
  // all networks to get deposits in EVM L1s and withdrawals in EVM L2s
  if (evmAddress) {
    // sync withdrawals
    workers.push(createWorker(hemi.id, evmAddress))
    // sync deposits for L1 EVM-compatible chains
    workers.push(
      ...evmRemoteNetworks.map(l1Chain => createWorker(l1Chain.id, evmAddress)),
    )
  }
  if (featureFlags.btcTunnelEnabled && btcAddress) {
    workers.push(createWorker(bitcoin.id, btcAddress))
  }

  return <>{Children.toArray(workers)}</>
}
