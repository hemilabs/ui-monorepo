import abi from 'erc-20-abi'

// Converting the abi array into a const type.
// This should be on the erc20-20-abi package, but I am unsure how to do so without
// adding typescript. This may be an option https://www.totaltypescript.com/override-the-type-of-a-json-file
export type Erc20Abi = ReadonlyArray<(typeof abi)[number]>
export const erc20Abi: Erc20Abi = abi
