export const isInteger = (string: string) => /^\d+$/.test(string)

export const isChainId = (string: string) => /^[1-9]\d*$/.test(string)
