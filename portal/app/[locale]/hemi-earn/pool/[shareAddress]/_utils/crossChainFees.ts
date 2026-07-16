// nativeFee already bundles the Agent's Ethereum-side callback, so the bridging
// portion is what's left; clamp at 0 in case that invariant ever breaks.
export const computeCrossChainFees = function ({
  layerZeroFee,
  quote,
}: {
  layerZeroFee: bigint
  quote: { callbackFee: bigint } | undefined
}) {
  const ethereumFee = quote?.callbackFee ?? BigInt(0)
  const bridgingFee =
    layerZeroFee > ethereumFee ? layerZeroFee - ethereumFee : BigInt(0)
  return { bridgingFee, ethereumFee }
}
