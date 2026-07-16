// nativeFee already bundles the Agent's Ethereum-side callback, so the bridging portion is what's left.
export const computeCrossChainFees = function ({
  layerZeroFee,
  quote,
}: {
  layerZeroFee: bigint
  quote: { callbackFee: bigint } | undefined
}) {
  const ethereumFee = quote?.callbackFee ?? BigInt(0)
  return { bridgingFee: layerZeroFee - ethereumFee, ethereumFee }
}
