export type BtcTxHash = string

export const isBtcTxHash = (value: string): value is BtcTxHash =>
  /^[0-9a-fA-F]{64}$/.test(value)
