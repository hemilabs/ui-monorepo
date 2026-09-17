/**
 * The chain cannot produce a rewards series.
 *
 * The route advertises every Hemi chain, but the series is a dot product over
 * `totalVeHemiSupplyAt`, which Hemi Sepolia's veHEMI does not implement. That is a
 * property of the deployment rather than a fault, so it is neither a 500 nor a row of
 * zeros - the latter reads as a real 0% APR.
 */
export class UnsupportedChainError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'UnsupportedChainError'
  }
}
