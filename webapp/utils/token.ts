import { Token } from 'types/token'

export const isNativeToken = (token: Token) => token.address.startsWith('0x')
