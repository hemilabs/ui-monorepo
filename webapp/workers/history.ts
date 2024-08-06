// send a message stating that the worker is alive and loaded
self.onmessage = function (
  e: MessageEvent<{ chainId: string; address: string }>,
) {
  const { chainId, address } = e.data
  self.postMessage(`loaded chainId ${chainId} and address ${address}`)
}
